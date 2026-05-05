use super::{BindingToken, HotkeyBackend, HotkeyBackendInfo, HotkeyBinding};
use crate::{
    ensure_overlay_window, restore_main_window,
    shared::{hotkey_events::emit_transcription_prefetch, log::append_log_line},
    AppState,
};
use std::{
    collections::HashSet,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex, OnceLock,
    },
    thread,
};
use tauri::{webview::Color, AppHandle, Emitter, Manager};
use windows::Win32::{
    Foundation::{HMODULE, LPARAM, LRESULT, WPARAM},
    System::LibraryLoader::GetModuleHandleW,
    UI::WindowsAndMessaging::{
        CallNextHookEx, DispatchMessageW, GetMessageW, SetWindowsHookExW, TranslateMessage,
        UnhookWindowsHookEx, HC_ACTION, HHOOK, KBDLLHOOKSTRUCT, MSG, LLKHF_INJECTED, WH_KEYBOARD_LL,
        WM_KEYDOWN, WM_KEYUP, WM_SYSKEYDOWN, WM_SYSKEYUP,
    },
};

#[derive(Default)]
pub struct WindowsHookHotkeyBackend;

#[derive(Default)]
struct HookSharedState {
    binding_label: Mutex<String>,
    required_groups: Mutex<Vec<Vec<u16>>>,
    pressed_keys: Mutex<HashSet<u16>>,
    active: AtomicBool,
    app_handle: Mutex<Option<AppHandle>>,
    last_error: Mutex<Option<String>>,
}

static HOOK_STATE: OnceLock<Arc<HookSharedState>> = OnceLock::new();

fn shared_state() -> Arc<HookSharedState> {
    HOOK_STATE
        .get_or_init(|| {
            let state = Arc::new(HookSharedState::default());
            start_hook_thread(state.clone());
            state
        })
        .clone()
}

fn start_hook_thread(state: Arc<HookSharedState>) {
    thread::spawn(move || unsafe {
        let module = GetModuleHandleW(None).unwrap_or(HMODULE::default());
        let hook =
            match SetWindowsHookExW(WH_KEYBOARD_LL, Some(low_level_keyboard_proc), module, 0) {
                Ok(hook) => hook,
                Err(error) => {
                    *state.last_error.lock().unwrap() =
                        Some(format!("Failed to install Windows keyboard hook: {}", error));
                    return;
                }
            };

        let mut message = MSG::default();
        while GetMessageW(&mut message, None, 0, 0).into() {
            let _ = TranslateMessage(&message);
            DispatchMessageW(&message);
        }

        let _ = UnhookWindowsHookEx(hook);
    });
}

fn update_pressed_keys(state: &Arc<HookSharedState>, vk: u16, message: u32) {
    let mut pressed = state.pressed_keys.lock().unwrap();
    match message {
        WM_SYSKEYDOWN | WM_KEYDOWN => {
            pressed.insert(vk);
        }
        WM_SYSKEYUP | WM_KEYUP => {
            pressed.remove(&vk);
        }
        _ => {}
    }
}

fn is_key_event(message: u32) -> bool {
    matches!(message, WM_SYSKEYDOWN | WM_KEYDOWN | WM_SYSKEYUP | WM_KEYUP)
}

fn binding_is_down(pressed: &HashSet<u16>, required_groups: &[Vec<u16>]) -> bool {
    !required_groups.is_empty()
        && required_groups
            .iter()
            .all(|group| group.iter().any(|key| pressed.contains(key)))
}

fn handle_binding_state(state: &Arc<HookSharedState>) {
    let pressed = state.pressed_keys.lock().unwrap().clone();
    let required_groups = state.required_groups.lock().unwrap().clone();
    let binding_down = binding_is_down(&pressed, &required_groups);
    let was_active = state.active.load(Ordering::SeqCst);

    match (was_active, binding_down) {
        (false, true) => {
            state.active.store(true, Ordering::SeqCst);
            start_overlay_session(state, required_groups.len());
        }
        (true, false) => {
            stop_overlay_session(state, "binding_released");
        }
        _ => {}
    }
}

fn start_overlay_session(state: &Arc<HookSharedState>, required_group_count: usize) {
    if let Some(app_handle) = state.app_handle.lock().unwrap().clone() {
        // Require authentication before starting recording
        if let Ok(app_state) = app_handle.state::<AppState>().cached_access_token.lock() {
            if app_state.is_none() {
                append_log_line("[Shortcut] rejected: no cached access token (user not signed in)");
                restore_main_window(&app_handle);
                app_handle.emit("auth-required", ()).ok();
                return;
            }
        }

        let _ = required_group_count;
        let overlay_ready = app_handle
            .state::<AppState>()
            .overlay_ready
            .lock()
            .map(|ready| *ready)
            .unwrap_or(false);
        append_log_line(&format!("[Shortcut] recording start overlay_ready={overlay_ready}"));

        if let Err(error) = ensure_overlay_window(&app_handle, true) {
            append_log_line(&format!("[Overlay] show failed: {error}"));
        }
        if let Some(window) = app_handle.get_webview_window("overlay") {
            let _ = window.set_shadow(false);
            let _ = window.set_background_color(Some(Color(0, 0, 0, 0)));
            let _ = window.set_always_on_top(true);
        }
        emit_transcription_prefetch(&app_handle);
        app_handle.emit("recording-started", ()).ok();
    }
}

fn stop_overlay_session(state: &Arc<HookSharedState>, _reason: &str) {
    if let Some(app_handle) = state.app_handle.lock().unwrap().clone() {
        let was_active = state.active.swap(false, Ordering::SeqCst);
        if was_active {
            app_handle.emit("recording-stopped", ()).ok();
        }
    }
}

unsafe extern "system" fn low_level_keyboard_proc(
    code: i32,
    w_param: WPARAM,
    l_param: LPARAM,
) -> LRESULT {
    if code == HC_ACTION as i32 {
        let state = shared_state();
        let keyboard = *(l_param.0 as *const KBDLLHOOKSTRUCT);
        if keyboard.flags.contains(LLKHF_INJECTED) {
            return CallNextHookEx(HHOOK::default(), code, w_param, l_param);
        }
        let vk = keyboard.vkCode as u16;
        let message = w_param.0 as u32;
        if is_key_event(message) {
            update_pressed_keys(&state, vk, message);
            handle_binding_state(&state);
        }
    }

    CallNextHookEx(HHOOK::default(), code, w_param, l_param)
}

#[allow(dead_code)]
fn binding_matches(pressed: &HashSet<u16>, groups: &[Vec<u16>]) -> bool {
    if groups.is_empty() {
        return false;
    }

    groups
        .iter()
        .all(|group| group.iter().any(|key| pressed.contains(key)))
}

#[allow(dead_code)]
fn is_modifier_vk(vk: u16) -> bool {
    matches!(vk, 0x10 | 0x11 | 0x12 | 0xA0 | 0xA1 | 0xA2 | 0xA3 | 0xA4 | 0xA5 | 0x5B | 0x5C)
}

#[allow(dead_code)]
fn modifier_bits_for_binding(binding: &HotkeyBinding) -> u32 {
    let mut bits = 0u32;
    for token in &binding.tokens {
        if let BindingToken::Modifier(value) = token {
            bits |= match *value {
                "Shift" => 0b001,
                "Ctrl" => 0b010,
                "Alt" => 0b100,
                "Meta" => 0b1000,
                _ => 0,
            };
        }
    }
    bits
}

fn vk_groups_for_binding(binding: &HotkeyBinding) -> Result<Vec<Vec<u16>>, String> {
    binding
        .tokens
        .iter()
        .map(|token| match token {
            BindingToken::Modifier("Ctrl") => Ok(vec![0x11, 0xA2, 0xA3]),
            BindingToken::Modifier("Shift") => Ok(vec![0x10, 0xA0, 0xA1]),
            BindingToken::Modifier("Alt") => Ok(vec![0x12, 0xA4, 0xA5]),
            BindingToken::Modifier("Meta") => Ok(vec![0x5B, 0x5C]),
            BindingToken::Modifier(other) => Err(format!("Unsupported modifier: {}", other)),
            BindingToken::Key(value) => key_to_vk_group(value),
            BindingToken::Mouse(value) => mouse_to_vk_group(value),
            BindingToken::Vendor(_) => {
                Err("Vendor-specific buttons need the upcoming native backend.".to_string())
            }
        })
        .collect()
}

fn mouse_to_vk_group(value: &str) -> Result<Vec<u16>, String> {
    let upper = value.to_uppercase();
    let group = match upper.as_str() {
        "MOUSELEFT" => vec![0x01],
        "MOUSERIGHT" => vec![0x02],
        "MOUSEMIDDLE" => vec![0x04],
        "MOUSE4" => vec![0x05],
        "MOUSE5" => vec![0x06],
        _ => return Err(format!("Unsupported mouse button: {}", value)),
    };

    Ok(group)
}

fn key_to_vk_group(value: &str) -> Result<Vec<u16>, String> {
    let upper = value.to_uppercase();
    let group = match upper.as_str() {
        "EQUAL" | "PLUS" => vec![0xBB],
        "MINUS" => vec![0xBD],
        "BRACKETLEFT" => vec![0xDB],
        "BRACKETRIGHT" => vec![0xDD],
        "BACKSLASH" => vec![0xDC],
        "SEMICOLON" => vec![0xBA],
        "QUOTE" => vec![0xDE],
        "COMMA" => vec![0xBC],
        "PERIOD" => vec![0xBE],
        "SLASH" => vec![0xBF],
        "BACKQUOTE" => vec![0xC0],
        "PRINTSCREEN" => vec![0x2C],
        "SCROLLLOCK" => vec![0x91],
        "PAUSE" => vec![0x13],
        "INSERT" => vec![0x2D],
        "DELETE" => vec![0x2E],
        "HOME" => vec![0x24],
        "END" => vec![0x23],
        "PAGEUP" => vec![0x21],
        "PAGEDOWN" => vec![0x22],
        "CONTEXTMENU" => vec![0x5D],
        "BROWSERBACK" => vec![0xA6],
        "BROWSERFORWARD" => vec![0xA7],
        "BROWSERREFRESH" => vec![0xA8],
        "BROWSERSTOP" => vec![0xA9],
        "BROWSERSEARCH" => vec![0xAA],
        "BROWSERFAVORITES" => vec![0xAB],
        "BROWSERHOME" => vec![0xAC],
        "AUDIOVOLUMEMUTE" => vec![0xAD],
        "AUDIOVOLUMEDOWN" => vec![0xAE],
        "AUDIOVOLUMEUP" => vec![0xAF],
        "MEDIATRACKNEXT" => vec![0xB0],
        "MEDIATRACKPREVIOUS" => vec![0xB1],
        "MEDIASTOP" => vec![0xB2],
        "MEDIAPLAYPAUSE" => vec![0xB3],
        "LAUNCHMAIL" => vec![0xB4],
        "LAUNCHAPP1" => vec![0xB6],
        "LAUNCHAPP2" => vec![0xB7],
        "SLEEP" => vec![0x5F],
        "WAKEUP" => vec![0x5F],
        "ARROWUP" | "UP" => vec![0x26],
        "ARROWDOWN" | "DOWN" => vec![0x28],
        "ARROWLEFT" | "LEFT" => vec![0x25],
        "ARROWRIGHT" | "RIGHT" => vec![0x27],
        "SPACE" => vec![0x20],
        "ENTER" => vec![0x0D],
        "ESCAPE" => vec![0x1B],
        "TAB" => vec![0x09],
        "BACKSPACE" => vec![0x08],
        "NUMPAD0" => vec![0x60],
        "NUMPAD1" => vec![0x61],
        "NUMPAD2" => vec![0x62],
        "NUMPAD3" => vec![0x63],
        "NUMPAD4" => vec![0x64],
        "NUMPAD5" => vec![0x65],
        "NUMPAD6" => vec![0x66],
        "NUMPAD7" => vec![0x67],
        "NUMPAD8" => vec![0x68],
        "NUMPAD9" => vec![0x69],
        "NUMPADADD" => vec![0x6B],
        "NUMPADSUBTRACT" => vec![0x6D],
        "NUMPADMULTIPLY" => vec![0x6A],
        "NUMPADDIVIDE" => vec![0x6F],
        "NUMPADDECIMAL" => vec![0x6E],
        "NUMPADENTER" => vec![0x0D],
        key if key.starts_with('F') => {
            let number = key
                .trim_start_matches('F')
                .parse::<u16>()
                .map_err(|_| format!("Unsupported function key: {}", value))?;
            if !(1..=24).contains(&number) {
                return Err(format!("Unsupported function key: {}", value));
            }
            vec![0x6F + number]
        }
        key if key.len() == 1 => {
            let character = key.chars().next().unwrap();
            if character.is_ascii_alphabetic() || character.is_ascii_digit() {
                vec![character as u16]
            } else {
                return Err(format!("Unsupported key: {}", value));
            }
        }
        _ => return Err(format!("Unsupported key: {}", value)),
    };

    Ok(group)
}

impl HotkeyBackend for WindowsHookHotkeyBackend {
    fn backend_name(&self) -> &'static str {
        "windows-hook"
    }

    fn info(&self) -> HotkeyBackendInfo {
        HotkeyBackendInfo {
            backend_name: self.backend_name().to_string(),
            platform: std::env::consts::OS.to_string(),
            backend_tier: "native".to_string(),
            planned_native_backend: None,
            supports_function_keys: true,
            supports_navigation_keys: true,
            supports_mouse_buttons: true,
            supports_vendor_keys: false,
            requires_accessibility_permission: false,
            required_permission_name: None,
            permission_hint: None,
            supported_examples: vec![
                "Ctrl+Shift".to_string(),
                "PrintScreen".to_string(),
                "Pause".to_string(),
                "Ctrl+Alt+Equal".to_string(),
                "Mouse4".to_string(),
                "Ctrl+Mouse5".to_string(),
                "MediaPlayPause".to_string(),
                "BrowserBack".to_string(),
            ],
            unsupported_examples: vec![
                "Fn".to_string(),
                "VendorButton1".to_string(),
                "Custom keyboard macro key exposed as Unidentified".to_string(),
            ],
            notes: vec![
                "Uses a Windows low-level keyboard hook backend.".to_string(),
                "Alt is tracked via WM_SYSKEY* and VK_MENU / VK_LMENU / VK_RMENU state updates."
                    .to_string(),
                "Supports modifier-only chords, function keys, many navigation/system keys, and standard mouse buttons.".to_string(),
                "Vendor-specific buttons are still planned but not wired yet.".to_string(),
            ],
        }
    }

    fn set_binding(&self, app: &AppHandle, binding: &str) -> Result<String, String> {
        let state = shared_state();
        let binding = HotkeyBinding::parse(binding)?;
        let groups = vk_groups_for_binding(&binding)?;

        *state.binding_label.lock().unwrap() = binding.to_string();
        *state.required_groups.lock().unwrap() = groups;
        *state.pressed_keys.lock().unwrap() = HashSet::new();
        state.active.store(false, Ordering::SeqCst);
        *state.app_handle.lock().unwrap() = Some(app.clone());

        if let Some(error) = state.last_error.lock().unwrap().clone() {
            return Err(error);
        }

        Ok(binding.to_string())
    }
}
