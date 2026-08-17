use super::{BindingToken, HotkeyBackend, HotkeyBackendInfo, HotkeyBinding};
use std::sync::{Arc, Mutex, OnceLock};
use tauri::AppHandle;

#[cfg(target_os = "macos")]
#[path = "macos_ffi.rs"]
mod macos_ffi;

#[cfg(target_os = "macos")]
use macos_ffi::*;

#[path = "macos_keymap.rs"]
mod macos_keymap;

use macos_keymap::{key_to_macos_key_code, modifier_flag_value, mouse_to_macos_button};

#[derive(Debug)]
struct MacosNativePreflightReport {
    issues: Vec<String>,
    ready_for_event_tap_wiring: bool,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum MacosPermissionStatus {
    Granted,
    MissingInputMonitoring,
    UnsupportedCheck,
}

#[derive(Clone, Debug, PartialEq, Eq)]
struct MacosNativeBinding {
    required_flags: u64,
    key_codes: Vec<u16>,
    mouse_buttons: Vec<u32>,
}

#[derive(Default)]
struct MacosNativeState {
    binding_label: Mutex<Option<String>>,
    compiled_binding: Mutex<Option<MacosNativeBinding>>,
    active_flags: Mutex<u64>,
    active_key_codes: Mutex<Vec<u16>>,
    active_mouse_buttons: Mutex<Vec<u32>>,
    binding_is_active: Mutex<bool>,
    app_handle: Mutex<Option<AppHandle>>,
    runtime_thread_running: Mutex<bool>,
    #[cfg(target_os = "macos")]
    run_loop_ref: Mutex<usize>,
    #[cfg(target_os = "macos")]
    tap_ref: Mutex<usize>,
    #[cfg(target_os = "macos")]
    source_ref: Mutex<usize>,
    runtime_status: Mutex<String>,
}

#[allow(dead_code)]
pub struct MacosNativeHotkeyBackend;

#[allow(dead_code)]
impl Default for MacosNativeHotkeyBackend {
    fn default() -> Self {
        Self
    }
}

static MACOS_NATIVE_STATE: OnceLock<Arc<MacosNativeState>> = OnceLock::new();

fn shared_native_state() -> Arc<MacosNativeState> {
    MACOS_NATIVE_STATE
        .get_or_init(|| Arc::new(MacosNativeState::default()))
        .clone()
}

#[cfg(target_os = "macos")]
unsafe extern "C" fn native_event_tap_probe_callback(
    _proxy: CGEventTapProxy,
    _event_type: CGEventType,
    event: CGEventRef,
    _user_info: *mut std::ffi::c_void,
) -> CGEventRef {
    event
}

#[cfg(target_os = "macos")]
fn macos_permission_status() -> MacosPermissionStatus {
    #[link(name = "ApplicationServices", kind = "framework")]
    unsafe extern "C" {
        fn CGPreflightListenEventAccess() -> bool;
        fn CGRequestListenEventAccess() -> bool;
    }

    unsafe {
        if CGPreflightListenEventAccess() {
            MacosPermissionStatus::Granted
        } else {
            MacosPermissionStatus::MissingInputMonitoring
        }
    }
}

#[cfg(not(target_os = "macos"))]
fn macos_permission_status() -> MacosPermissionStatus {
    MacosPermissionStatus::UnsupportedCheck
}

#[cfg(target_os = "macos")]
pub fn request_macos_input_monitoring_permission() -> Result<bool, String> {
    #[link(name = "ApplicationServices", kind = "framework")]
    unsafe extern "C" {
        fn CGRequestListenEventAccess() -> bool;
    }

    Ok(unsafe { CGRequestListenEventAccess() })
}

#[cfg(not(target_os = "macos"))]
pub fn request_macos_input_monitoring_permission() -> Result<bool, String> {
    Err("Input Monitoring permission requests are only available on macOS.".to_string())
}

pub fn macos_permission_status_label() -> &'static str {
    match macos_permission_status() {
        MacosPermissionStatus::Granted => "granted",
        MacosPermissionStatus::MissingInputMonitoring => "missing",
        MacosPermissionStatus::UnsupportedCheck => "unsupported",
    }
}

#[cfg(target_os = "macos")]
fn event_tap_symbols_available() -> bool {
    unsafe {
        let tap = CGEventTapCreate(
            KCG_SESSION_EVENT_TAP,
            KCG_HEAD_INSERT_EVENT_TAP,
            KCG_EVENT_TAP_OPTION_LISTEN_ONLY,
            0,
            native_event_tap_probe_callback as *const std::ffi::c_void,
            std::ptr::null_mut(),
        );
        if tap.is_null() {
            return false;
        }

        let source = CFMachPortCreateRunLoopSource(std::ptr::null(), tap, 0);
        if !source.is_null() {
            CFRelease(source.cast());
        }
        CFMachPortInvalidate(tap);
        CFRelease(tap.cast());
        !source.is_null()
    }
}

#[cfg(not(target_os = "macos"))]
fn event_tap_symbols_available() -> bool {
    false
}

fn native_runtime_status_label() -> String {
    let state = shared_native_state();
    let status = state.runtime_status.lock().unwrap();
    status.clone()
}

pub fn macos_native_runtime_status_label() -> String {
    native_runtime_status_label()
}

pub fn macos_native_preflight_issues() -> Result<Vec<String>, String> {
    let state = shared_native_state();
    let binding_label = state.binding_label.lock().unwrap().clone();
    let Some(binding_label) = binding_label else {
        return Ok(vec!["No macOS native binding has been compiled yet.".to_string()]);
    };

    let binding = HotkeyBinding::parse(&binding_label)?;
    Ok(native_preflight_report(&binding).issues)
}

#[cfg(target_os = "macos")]
fn native_event_mask() -> u64 {
    KCG_EVENT_MASK_KEY_DOWN
        | KCG_EVENT_MASK_KEY_UP
        | KCG_EVENT_MASK_FLAGS_CHANGED
        | KCG_EVENT_MASK_LEFT_MOUSE_DOWN
        | KCG_EVENT_MASK_LEFT_MOUSE_UP
        | KCG_EVENT_MASK_RIGHT_MOUSE_DOWN
        | KCG_EVENT_MASK_RIGHT_MOUSE_UP
        | KCG_EVENT_MASK_OTHER_MOUSE_DOWN
        | KCG_EVENT_MASK_OTHER_MOUSE_UP
}

#[cfg(target_os = "macos")]
pub fn probe_macos_native_event_tap() -> Result<String, String> {
    let state = shared_native_state();
    let binding_label = state.binding_label.lock().unwrap().clone();
    let Some(binding_label) = binding_label else {
        update_native_runtime_status("probe-missing-binding");
        return Err("No macOS native binding has been compiled yet.".to_string());
    };

    let binding = HotkeyBinding::parse(&binding_label)?;
    let report = native_preflight_report(&binding);
    if !report.ready_for_event_tap_wiring {
        update_native_runtime_status("probe-preflight-blocked");
        return Err(format!(
            "macOS native event tap probe blocked: {}",
            report.issues.join(" ")
        ));
    }

    let tap = unsafe {
        CGEventTapCreate(
            KCG_SESSION_EVENT_TAP,
            KCG_HEAD_INSERT_EVENT_TAP,
            KCG_EVENT_TAP_OPTION_LISTEN_ONLY,
            native_event_mask(),
            native_event_tap_probe_callback as *const std::ffi::c_void,
            std::ptr::null_mut(),
        )
    };

    if tap.is_null() {
        update_native_runtime_status("event-tap-create-failed");
        return Err(
            "CGEventTapCreate returned null. Input Monitoring permission or event visibility may still be insufficient."
                .to_string(),
        );
    }

    let source = unsafe { CFMachPortCreateRunLoopSource(std::ptr::null(), tap, 0) };
    if source.is_null() {
        unsafe {
            CFMachPortInvalidate(tap);
            CFRelease(tap.cast());
        }
        update_native_runtime_status("event-tap-source-failed");
        return Err("CFMachPortCreateRunLoopSource returned null for the macOS event tap.".to_string());
    }

    unsafe {
        CFRelease(source.cast());
        CFMachPortInvalidate(tap);
        CFRelease(tap.cast());
    }

    update_native_runtime_status("event-tap-create-ok");
    Ok("CGEventTapCreate probe succeeded. The remaining step is keeping the tap installed on a run loop and wiring callbacks into the hotkey runtime.".to_string())
}

#[cfg(not(target_os = "macos"))]
pub fn probe_macos_native_event_tap() -> Result<String, String> {
    Err("CGEventTap probes are only available on macOS.".to_string())
}

#[cfg(target_os = "macos")]
unsafe extern "C" fn native_event_tap_runtime_callback(
    _proxy: CGEventTapProxy,
    event_type: CGEventType,
    event: CGEventRef,
    _user_info: *mut std::ffi::c_void,
) -> CGEventRef {
    let state = shared_native_state();
    let flags = unsafe { CGEventGetFlags(event) };
    let mut active_key_codes = state.active_key_codes.lock().unwrap().clone();
    let mut active_mouse_buttons = state.active_mouse_buttons.lock().unwrap().clone();

    match event_type {
        KCG_EVENT_KEY_DOWN => {
            let key_code =
                unsafe { CGEventGetIntegerValueField(event, KCG_KEYBOARD_EVENT_KEYCODE_FIELD) } as u16;
            if !active_key_codes.contains(&key_code) {
                active_key_codes.push(key_code);
            }
        }
        KCG_EVENT_KEY_UP => {
            let key_code =
                unsafe { CGEventGetIntegerValueField(event, KCG_KEYBOARD_EVENT_KEYCODE_FIELD) } as u16;
            active_key_codes.retain(|code| *code != key_code);
        }
        KCG_EVENT_LEFT_MOUSE_DOWN => {
            if !active_mouse_buttons.contains(&0) {
                active_mouse_buttons.push(0);
            }
        }
        KCG_EVENT_LEFT_MOUSE_UP => {
            active_mouse_buttons.retain(|button| *button != 0);
        }
        KCG_EVENT_RIGHT_MOUSE_DOWN => {
            if !active_mouse_buttons.contains(&1) {
                active_mouse_buttons.push(1);
            }
        }
        KCG_EVENT_RIGHT_MOUSE_UP => {
            active_mouse_buttons.retain(|button| *button != 1);
        }
        KCG_EVENT_OTHER_MOUSE_DOWN => {
            let button =
                unsafe { CGEventGetIntegerValueField(event, KCG_MOUSE_EVENT_BUTTON_NUMBER_FIELD) } as u32;
            if !active_mouse_buttons.contains(&button) {
                active_mouse_buttons.push(button);
            }
        }
        KCG_EVENT_OTHER_MOUSE_UP => {
            let button =
                unsafe { CGEventGetIntegerValueField(event, KCG_MOUSE_EVENT_BUTTON_NUMBER_FIELD) } as u32;
            active_mouse_buttons.retain(|value| *value != button);
        }
        KCG_EVENT_FLAGS_CHANGED => {}
        _ => {}
    }

    if update_native_input_snapshot(flags, &active_key_codes, &active_mouse_buttons) {
        emit_native_binding_transition();
    }

    event
}

#[cfg(target_os = "macos")]
fn stop_native_event_tap_runtime() {
    let state = shared_native_state();

    let run_loop_ref = {
        let mut value = state.run_loop_ref.lock().unwrap();
        let current = *value;
        *value = 0;
        current
    };
    let tap_ref = {
        let mut value = state.tap_ref.lock().unwrap();
        let current = *value;
        *value = 0;
        current
    };
    let source_ref = {
        let mut value = state.source_ref.lock().unwrap();
        let current = *value;
        *value = 0;
        current
    };

    if source_ref != 0 {
        unsafe {
            CFRunLoopSourceInvalidate(source_ref as CFRunLoopSourceRef);
        }
    }
    if tap_ref != 0 {
        unsafe {
            CFMachPortInvalidate(tap_ref as CFMachPortRef);
        }
    }
    if run_loop_ref != 0 {
        unsafe {
            CFRunLoopStop(run_loop_ref as CFRunLoopRef);
            CFRunLoopWakeUp(run_loop_ref as CFRunLoopRef);
        }
    }

    *state.runtime_thread_running.lock().unwrap() = false;
    update_native_runtime_status("event-tap-disabled");
}

#[cfg(target_os = "macos")]
fn install_native_event_tap_runtime(app: AppHandle) -> Result<(), String> {
    let state = shared_native_state();
    *state.app_handle.lock().unwrap() = Some(app);
    stop_native_event_tap_runtime();
    update_native_runtime_status("event-tap-installing");

    let compiled_binding = state.compiled_binding.lock().unwrap().clone();
    if compiled_binding.is_none() {
        update_native_runtime_status("binding-not-ready");
        return Err("No compiled macOS native binding is available.".to_string());
    }

    if !event_tap_symbols_available() {
        update_native_runtime_status("event-tap-symbols-unavailable");
        return Err("CGEventTap symbols are unavailable on this macOS build.".to_string());
    }

    std::thread::spawn(move || unsafe {
        let tap = CGEventTapCreate(
            KCG_SESSION_EVENT_TAP,
            KCG_HEAD_INSERT_EVENT_TAP,
            KCG_EVENT_TAP_OPTION_LISTEN_ONLY,
            native_event_mask(),
            native_event_tap_runtime_callback as *const std::ffi::c_void,
            std::ptr::null_mut(),
        );

        if tap.is_null() {
            update_native_runtime_status("event-tap-create-failed");
            return;
        }

        let source = CFMachPortCreateRunLoopSource(std::ptr::null(), tap, 0);
        if source.is_null() {
            CFMachPortInvalidate(tap);
            CFRelease(tap.cast());
            update_native_runtime_status("event-tap-source-failed");
            return;
        }

        let run_loop = CFRunLoopGetCurrent();
        {
            let state = shared_native_state();
            *state.run_loop_ref.lock().unwrap() = run_loop as usize;
            *state.tap_ref.lock().unwrap() = tap as usize;
            *state.source_ref.lock().unwrap() = source as usize;
            *state.runtime_thread_running.lock().unwrap() = true;
        }

        CFRunLoopAddSource(run_loop, source, kCFRunLoopCommonModes);
        CGEventTapEnable(tap, true);
        update_native_runtime_status("event-tap-running");
        CFRunLoopRun();

        CFRunLoopSourceInvalidate(source);
        CFMachPortInvalidate(tap);
        CFRelease(source.cast());
        CFRelease(tap.cast());

        let state = shared_native_state();
        *state.run_loop_ref.lock().unwrap() = 0;
        *state.tap_ref.lock().unwrap() = 0;
        *state.source_ref.lock().unwrap() = 0;
        *state.runtime_thread_running.lock().unwrap() = false;
        update_native_runtime_status("event-tap-disabled");
    });

    Ok(())
}

#[cfg(not(target_os = "macos"))]
fn install_native_event_tap_runtime(_app: AppHandle) -> Result<(), String> {
    Err("The macOS native event tap runtime is only available on macOS.".to_string())
}

fn update_native_runtime_status(status: impl Into<String>) {
    let state = shared_native_state();
    *state.runtime_status.lock().unwrap() = status.into();
}

fn compile_native_binding(binding: &HotkeyBinding) -> Result<MacosNativeBinding, String> {
    let mut required_flags = 0_u64;
    let mut key_codes = Vec::new();
    let mut mouse_buttons = Vec::new();

    for token in &binding.tokens {
        match token {
            BindingToken::Modifier(value) => {
                required_flags |= modifier_flag_value(value)?;
            }
            BindingToken::Key(value) => key_codes.push(key_to_macos_key_code(value)?),
            BindingToken::Mouse(value) => mouse_buttons.push(mouse_to_macos_button(value)?),
            BindingToken::Vendor(_) => {
                return Err(
                    "Vendor-specific buttons are not supported on the macOS native backend."
                        .to_string(),
                )
            }
        }
    }

    Ok(MacosNativeBinding {
        required_flags,
        key_codes,
        mouse_buttons,
    })
}

const MACOS_SUPPORTED_MODIFIER_FLAGS: u64 = 0x0004_0000 | 0x0002_0000 | 0x0008_0000 | 0x0010_0000;

fn normalize_key_codes(key_codes: &[u16]) -> Vec<u16> {
    let mut normalized = key_codes.to_vec();
    normalized.sort_unstable();
    normalized.dedup();
    normalized
}

fn normalize_mouse_buttons(mouse_buttons: &[u32]) -> Vec<u32> {
    let mut normalized = mouse_buttons.to_vec();
    normalized.sort_unstable();
    normalized.dedup();
    normalized
}

fn filter_supported_modifier_flags(flags: u64) -> u64 {
    flags & MACOS_SUPPORTED_MODIFIER_FLAGS
}

fn native_binding_matches_input(
    binding: &MacosNativeBinding,
    active_flags: u64,
    active_key_codes: &[u16],
    active_mouse_buttons: &[u32],
) -> bool {
    let normalized_flags = filter_supported_modifier_flags(active_flags);
    if normalized_flags != binding.required_flags {
        return false;
    }

    let normalized_keys = normalize_key_codes(active_key_codes);
    let required_keys = normalize_key_codes(&binding.key_codes);
    if normalized_keys != required_keys {
        return false;
    }

    let normalized_mouse_buttons = normalize_mouse_buttons(active_mouse_buttons);
    let required_mouse_buttons = normalize_mouse_buttons(&binding.mouse_buttons);
    normalized_mouse_buttons == required_mouse_buttons
}

#[allow(dead_code)]
fn update_native_input_snapshot(
    active_flags: u64,
    active_key_codes: &[u16],
    active_mouse_buttons: &[u32],
) -> bool {
    let state = shared_native_state();
    *state.active_flags.lock().unwrap() = filter_supported_modifier_flags(active_flags);
    *state.active_key_codes.lock().unwrap() = normalize_key_codes(active_key_codes);
    *state.active_mouse_buttons.lock().unwrap() = normalize_mouse_buttons(active_mouse_buttons);

    let is_active = state
        .compiled_binding
        .lock()
        .unwrap()
        .as_ref()
        .map(|binding| {
            native_binding_matches_input(binding, active_flags, active_key_codes, active_mouse_buttons)
        })
        .unwrap_or(false);

    let mut current_binding_state = state.binding_is_active.lock().unwrap();
    let changed = *current_binding_state != is_active;
    *current_binding_state = is_active;
    changed
}

fn current_binding_is_active() -> bool {
    let state = shared_native_state();
    let is_active = state.binding_is_active.lock().unwrap();
    *is_active
}

fn emit_native_binding_transition() {
    let state = shared_native_state();
    let is_active = *state.binding_is_active.lock().unwrap();
    let app_handle = state.app_handle.lock().unwrap().clone();
    let Some(app_handle) = app_handle else {
        return;
    };

    if is_active {
        let binding_label = state
            .binding_label
            .lock()
            .unwrap()
            .clone()
            .unwrap_or_else(|| "unknown".to_string());
        crate::shared::log::append_log_line(&format!("[Shortcut] matched: {binding_label}"));
        if let Err(error) = crate::start_recording_internal(&app_handle, "macos-native") {
            crate::shared::log::append_log_line(&format!("[Shortcut] start failed: {error}"));
        }
    } else {
        let binding_label = state
            .binding_label
            .lock()
            .unwrap()
            .clone()
            .unwrap_or_else(|| "unknown".to_string());
        crate::shared::log::append_log_line(&format!("[Shortcut] released: {binding_label}"));
        if let Err(error) = crate::stop_recording_internal(&app_handle, "macos-native") {
            crate::shared::log::append_log_line(&format!("[Shortcut] stop failed: {error}"));
        }
    }
}

fn validate_native_binding(binding: &HotkeyBinding) -> Result<(), String> {
    if binding.has_vendor_tokens() {
        return Err(
            "Vendor-specific buttons still need a device-specific macOS strategy.".to_string(),
        );
    }

    for token in &binding.tokens {
        match token {
            BindingToken::Key(value) if value.eq_ignore_ascii_case("Fn") => {
                return Err(
                    "The Fn key is not expected to be available through the planned CGEventTap backend."
                        .to_string(),
                );
            }
            BindingToken::Vendor(_) => {
                return Err(
                    "Vendor-specific buttons are still outside the planned macOS backend scope."
                        .to_string(),
                );
            }
            _ => {}
        }
    }

    Ok(())
}

fn native_preflight_report(binding: &HotkeyBinding) -> MacosNativePreflightReport {
    let mut issues = Vec::new();

    if let Err(error) = validate_native_binding(binding) {
        issues.push(error);
    }

    if let Err(error) = compile_native_binding(binding) {
        issues.push(error);
    }

    match macos_permission_status() {
        MacosPermissionStatus::Granted => {}
        MacosPermissionStatus::MissingInputMonitoring => issues.push(
            "Input Monitoring permission is not granted yet. A native macOS event tap will not receive global keyboard events until that permission is enabled in System Settings."
                .to_string(),
        ),
        MacosPermissionStatus::UnsupportedCheck => issues.push(
            "Input Monitoring permission could not be preflighted on this platform/build."
                .to_string(),
        ),
    }

    MacosNativePreflightReport {
        ready_for_event_tap_wiring: issues.is_empty(),
        issues,
    }
}

#[allow(dead_code)]
impl HotkeyBackend for MacosNativeHotkeyBackend {
    fn backend_name(&self) -> &'static str {
        "macos-event-tap"
    }

    fn info(&self) -> HotkeyBackendInfo {
        HotkeyBackendInfo {
            backend_name: self.backend_name().to_string(),
            platform: std::env::consts::OS.to_string(),
            backend_tier: "native".to_string(),
            planned_native_backend: None,
            supports_modifier_only: true,
            supports_function_keys: true,
            supports_navigation_keys: true,
            supports_mouse_buttons: true,
            supports_vendor_keys: false,
            requires_accessibility_permission: true,
            required_permission_name: Some("Input Monitoring".to_string()),
            permission_hint: Some(
                "The native macOS backend is planned to use CGEventTap and will require Input Monitoring permission in System Settings before global keyboard monitoring can work."
                    .to_string(),
            ),
            supported_examples: vec![
                "Command+Shift".to_string(),
                "Option+F1".to_string(),
                "Command+PageUp".to_string(),
                "Mouse4".to_string(),
                "Command+Mouse4".to_string(),
            ],
            unsupported_examples: vec![
                "Fn".to_string(),
                "VendorButton1".to_string(),
            ],
            notes: vec![
                "Native macOS event tap backend placeholder.".to_string(),
                "Binding compilation to macOS modifier flags and virtual key codes is already in place."
                    .to_string(),
                "Binding matching for modifier flags and active key codes is now in place; the remaining step is wiring real CGEventTap callbacks into that runtime state."
                    .to_string(),
                "Keyboard and standard mouse button bindings now compile into the native macOS path."
                    .to_string(),
                format!(
                    "Current native runtime status: {}",
                    native_runtime_status_label()
                ),
            ],
        }
    }

    fn set_binding(&self, app: &AppHandle, binding_str: &str) -> Result<String, String> {
        let binding = HotkeyBinding::parse(binding_str)?;
        let compiled = compile_native_binding(&binding)?;
        let report = native_preflight_report(&binding);
        let state = shared_native_state();
        *state.binding_label.lock().unwrap() = Some(binding.to_string());
        *state.compiled_binding.lock().unwrap() = Some(MacosNativeBinding {
            required_flags: compiled.required_flags,
            key_codes: compiled.key_codes.clone(),
            mouse_buttons: compiled.mouse_buttons.clone(),
        });
        *state.active_flags.lock().unwrap() = 0;
        state.active_key_codes.lock().unwrap().clear();
        state.active_mouse_buttons.lock().unwrap().clear();
        *state.binding_is_active.lock().unwrap() = false;
        *state.app_handle.lock().unwrap() = Some(app.clone());
        crate::shared::log::append_log_line(&format!("[Shortcut] registered: {}", binding));
        if report.ready_for_event_tap_wiring {
            if event_tap_symbols_available() {
                update_native_runtime_status("ready-for-event-tap-install");
            } else {
                update_native_runtime_status("event-tap-symbols-unavailable");
            }
        } else {
            update_native_runtime_status("binding-not-ready");
        }
        if !report.ready_for_event_tap_wiring {
            return Err(format!(
                "The native macOS backend cannot activate this binding yet. Parsed binding: {}. Compiled flags: 0x{:X}. Compiled key codes: {:?}. Compiled mouse buttons: {:?}. {}",
                binding,
                compiled.required_flags,
                compiled.key_codes,
                compiled.mouse_buttons,
                report.issues.join(" ")
            ));
        }

        install_native_event_tap_runtime(app.clone()).map_err(|error| {
            format!(
                "The native macOS event tap backend failed to install for binding {}. {}",
                binding, error
            )
        })?;

        Ok(binding.to_string())
    }
}

pub fn create_macos_hotkey_backend() -> Box<dyn HotkeyBackend> {
    Box::new(MacosNativeHotkeyBackend::default())
}

#[cfg(test)]
#[path = "macos_tests.rs"]
mod tests;
