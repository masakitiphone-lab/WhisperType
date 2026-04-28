#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod hotkeys;
mod audio_processing;
mod ai_post_conversion;
mod shared;
mod log_store;
mod post_conversion;
mod secure_storage;
mod tray;
mod text_input;
mod windowing;

use tauri::{
    webview::Color,
    AppHandle, Emitter, Manager, UserAttentionType, WebviewUrl, WebviewWindowBuilder,
};
use hotkeys::{create_hotkey_backend, HotkeyBackend, HotkeyBackendInfo};
#[cfg(target_os = "macos")]
use hotkeys::{
    macos_native_preflight_issues, macos_native_runtime_status_label, macos_permission_status_label,
    probe_macos_native_event_tap,
    request_macos_input_monitoring_permission,
};
use tauri_plugin_deep_link::DeepLinkExt;
use text_input::type_text_internal;
use log_store::append_log_line;
use audio_processing::process_audio_with_ffmpeg;
use ai_post_conversion::{
    apply_post_conversion, close_post_conversion_popup, open_post_conversion_popup,
    start_post_conversion_flow, start_post_conversion_flow_at,
};
use tray::setup_tray_clean;
use post_conversion::start_post_conversion_detection;
use windowing::{
    apply_overlay_visuals, configure_main_window_for_settings, position_window_bottom_center,
    resize_overlay_window, show_window_without_focus, OVERLAY_HEIGHT,
    OVERLAY_WIDTH,
};
use shared::hotkey_events::{
    emit_recording_started, emit_recording_stopped, emit_transcription_finished as emit_transcription_finished_event,
    emit_transcription_started,
};

use std::sync::Mutex;
#[cfg(target_os = "windows")]
use std::process::Command;
use secure_storage::{secure_storage_delete, secure_storage_get, secure_storage_set};

#[derive(Clone, serde::Serialize)]
struct RecordingState {
    is_recording: bool,
    is_transcribing: bool,
}

struct AppState {
    recording: Mutex<RecordingState>,
    current_shortcut: Mutex<String>,
    hotkey_backend: Box<dyn HotkeyBackend>,
    pending_deep_links: Mutex<Vec<String>>,
    cached_access_token: Mutex<Option<String>>,
}


fn queue_and_emit_deep_links(app: &AppHandle, urls: Vec<String>) {
    if urls.is_empty() {
        return;
    }

    if let Ok(mut pending_links) = app.state::<AppState>().pending_deep_links.lock() {
        pending_links.extend(urls.clone());
    }

    restore_main_window(app);
    let _ = app.emit("deep-link-received", serde_json::json!({ "urls": urls }));
}
fn summarize_deep_link_arg(arg: &str) -> &str {
    if arg.starts_with("whispertype://") {
        "whispertype://auth/callback?[redacted]"
    } else {
        arg
    }
}

fn toggle_main_window_visibility(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let is_visible = window.is_visible().unwrap_or(false);
        if is_visible {
            let _ = window.hide();
            return;
        }
    }

    restore_main_window(app);
}

fn ensure_main_window(app: &AppHandle) -> Result<tauri::WebviewWindow, String> {
    if let Some(window) = app.get_webview_window("main") {
        return Ok(window);
    }

    WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
        .title("WhisperType")
        .inner_size(1040.0, 780.0)
        .min_inner_size(900.0, 680.0)
        .center()
        .visible(false)
        .build()
        .map_err(|error| error.to_string())
}

fn restore_main_window(app: &AppHandle) {
    if let Ok(window) = ensure_main_window(app) {
        configure_main_window_for_settings(&window);
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
        let _ = window.request_user_attention(Some(UserAttentionType::Critical));
    }
}

fn launched_in_background() -> bool {
    std::env::args().any(|arg| arg == "--background")
}


#[cfg(target_os = "windows")]
fn ensure_windows_autostart() -> Result<(), String> {
    if cfg!(debug_assertions) {
        return Ok(());
    }

    let exe_path = std::env::current_exe().map_err(|error| error.to_string())?;
    let command_value = format!("\"{}\" --background", exe_path.display());

    let status = Command::new("reg")
        .args([
            "add",
            r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run",
            "/v",
            "WhisperType",
            "/t",
            "REG_SZ",
            "/d",
            &command_value,
            "/f",
        ])
        .status()
        .map_err(|error| error.to_string())?;

    if status.success() {
        Ok(())
    } else {
        Err(format!("failed to register Windows autostart: {:?}", status.code()))
    }
}

#[cfg(not(target_os = "windows"))]
fn ensure_windows_autostart() -> Result<(), String> {
    Ok(())
}

fn register_global_shortcut(app: &AppHandle, shortcut_str: &str) -> Result<String, String> {
    let state = app.state::<AppState>();
    append_log_line(&format!("[Shortcut] registering {}", shortcut_str));
    let registered_shortcut = state
        .hotkey_backend
        .set_binding(app, shortcut_str)
        .map_err(|error| error.to_string())?;
    let mut current_shortcut = state.current_shortcut.lock().map_err(|e| e.to_string())?;
    *current_shortcut = registered_shortcut.clone();
    append_log_line(&format!("[Shortcut] registered {}", registered_shortcut));

    Ok(registered_shortcut)
}

#[tauri::command]
fn start_recording(app: AppHandle) -> Result<(), String> {
    let state = app.state::<AppState>();
    let mut recording = state.recording.lock().map_err(|e| e.to_string())?;
    recording.is_recording = true;
    recording.is_transcribing = false;
    emit_recording_started(&app);
    Ok(())
}

#[tauri::command]
fn stop_recording(app: AppHandle) -> Result<(), String> {
    let state = app.state::<AppState>();
    let mut recording = state.recording.lock().map_err(|e| e.to_string())?;
    recording.is_recording = false;
    emit_recording_stopped(&app);
    Ok(())
}

#[tauri::command]
fn start_transcription(app: AppHandle) -> Result<(), String> {
    let state = app.state::<AppState>();
    let mut recording = state.recording.lock().map_err(|e| e.to_string())?;
    recording.is_transcribing = true;
    emit_transcription_started(&app);
    Ok(())
}

#[tauri::command]
fn finish_transcription(app: AppHandle) -> Result<(), String> {
    let state = app.state::<AppState>();
    let mut recording = state.recording.lock().map_err(|e| e.to_string())?;
    recording.is_recording = false;
    recording.is_transcribing = false;
    drop(recording);
    let _ = emit_transcription_finished(app);
    Ok(())
}

#[tauri::command]
fn set_global_shortcut(app: AppHandle, shortcut: String) -> Result<String, String> {
    register_global_shortcut(&app, shortcut.trim())
}

#[tauri::command]
fn get_hotkey_backend_name(app: AppHandle) -> Result<String, String> {
    let state = app.state::<AppState>();
    Ok(state.hotkey_backend.backend_name().to_string())
}

#[tauri::command]
fn get_hotkey_backend_info(app: AppHandle) -> Result<HotkeyBackendInfo, String> {
    let state = app.state::<AppState>();
    Ok(state.hotkey_backend.info())
}

#[tauri::command]
fn get_macos_input_monitoring_status() -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        Ok(macos_permission_status_label().to_string())
    }

    #[cfg(not(target_os = "macos"))]
    {
        Ok("unsupported".to_string())
    }
}

#[tauri::command]
fn request_macos_input_monitoring() -> Result<bool, String> {
    #[cfg(target_os = "macos")]
    {
        request_macos_input_monitoring_permission()
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err("Input Monitoring permission requests are only available on macOS.".to_string())
    }
}

#[tauri::command]
fn get_macos_native_runtime_status() -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        Ok(macos_native_runtime_status_label())
    }

    #[cfg(not(target_os = "macos"))]
    {
        Ok("unsupported".to_string())
    }
}

#[tauri::command]
fn get_macos_native_preflight_issues() -> Result<Vec<String>, String> {
    #[cfg(target_os = "macos")]
    {
        macos_native_preflight_issues()
    }

    #[cfg(not(target_os = "macos"))]
    {
        Ok(vec!["unsupported".to_string()])
    }
}

#[tauri::command]
fn probe_macos_native_event_tap_command() -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        probe_macos_native_event_tap()
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err("CGEventTap probes are only available on macOS.".to_string())
    }
}

#[tauri::command]
fn show_recording_window(app: AppHandle) -> Result<(), String> {
    ensure_overlay_window(&app, true)
}

pub fn ensure_overlay_window(app: &AppHandle, visible: bool) -> Result<(), String> {
    let window = if let Some(window) = app.get_webview_window("overlay") {
        append_log_line("[Overlay] ensure_overlay_window reused");
        window
    } else {
        append_log_line("[Overlay] ensure_overlay_window creating");
        WebviewWindowBuilder::new(
        app,
        "overlay",
        WebviewUrl::App("overlay.html".into()),
    )
    .transparent(true)
    .shadow(false)
    .background_color(Color(0, 0, 0, 0))
    .decorations(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .resizable(false)
    .inner_size(OVERLAY_WIDTH as f64, OVERLAY_HEIGHT as f64)
    .visible(false)
    .build()
    .map_err(|e| e.to_string())?
    };

    position_window_bottom_center(
        &window,
        OVERLAY_WIDTH as f64,
        OVERLAY_HEIGHT as f64,
        10.0,
    );

    apply_overlay_visuals(&window);
    let _ = window.set_always_on_top(true);
    if visible {
        append_log_line("[Overlay] ensure_overlay_window show");
        show_window_without_focus(&window);
    } else {
        append_log_line("[Overlay] ensure_overlay_window hide");
        let _ = window.hide();
    }

    Ok(())
}

#[tauri::command]
fn show_overlay_window(app: AppHandle) -> Result<(), String> {
    append_log_line("[Overlay] show_overlay_window requested");
    ensure_overlay_window(&app, true)
}

#[tauri::command]
fn hide_overlay_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("overlay") {
        let _ = window.hide();
    }
    Ok(())
}

#[tauri::command]
fn resize_overlay_window_command(app: AppHandle, width: f64, height: f64) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("overlay") {
        resize_overlay_window(&window, width, height);
    }
    Ok(())
}

#[tauri::command]
fn emit_transcription_finished(app: AppHandle) -> Result<(), String> {
    emit_transcription_finished_event(&app);
    Ok(())
}


#[tauri::command]
fn close_overlay_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("overlay") {
        let _ = window.close();
    }
    Ok(())
}

#[tauri::command]
fn hide_recording_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("overlay") {
        let _ = window.hide();
    }
    Ok(())
}

#[tauri::command]
fn show_settings_window(app: AppHandle) -> Result<(), String> {
    restore_main_window(&app);
    Ok(())
}

#[tauri::command]
fn type_text(_app: AppHandle, text: String, use_clipboard_paste: bool) -> Result<String, String> {
    type_text_internal(text, use_clipboard_paste)
}

#[tauri::command]
fn log_to_terminal(msg: String) {
    append_log_line(&format!("[JS Log] {msg}"));
    let _ = msg;
}

#[tauri::command]
fn consume_pending_deep_links(app: AppHandle) -> Result<Vec<String>, String> {
    let state = app.state::<AppState>();
    let mut pending_links = state.pending_deep_links.lock().map_err(|e| e.to_string())?;
    let urls = pending_links.clone();
    pending_links.clear();
    Ok(urls)
}

#[tauri::command]
fn get_cached_access_token(app: AppHandle) -> Result<Option<String>, String> {
    let state = app.state::<AppState>();
    let token = state
        .cached_access_token
        .lock()
        .map_err(|e| e.to_string())?
        .clone();
    Ok(token)
}

#[tauri::command]
fn set_cached_access_token(app: AppHandle, token: Option<String>) -> Result<(), String> {
    let state = app.state::<AppState>();
    let mut cached_token = state.cached_access_token.lock().map_err(|e| e.to_string())?;
    *cached_token = token;
    Ok(())
}
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();
    let startup_at = std::time::Instant::now();
    #[cfg(debug_assertions)]
    println!("[Startup] tauri builder init");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            restore_main_window(app);
            let redacted_args = args
                .iter()
                .map(|arg| summarize_deep_link_arg(arg).to_string())
                .collect::<Vec<_>>();
            #[cfg(debug_assertions)]
            println!("[Rust] Single instance triggered. Args: {:?}", redacted_args);
            // On Windows, args[1] might be the deep link URL if the app was closed
            if args.len() > 1 && args[1].starts_with("whispertype://") {
                queue_and_emit_deep_links(app, vec![args[1].clone()]);
            }
        }))
        .plugin(tauri_plugin_deep_link::init())
        .manage(AppState {
            recording: Mutex::new(RecordingState {
                is_recording: false,
                is_transcribing: false,
            }),
            current_shortcut: Mutex::new("Ctrl+Alt".to_string()),
            hotkey_backend: create_hotkey_backend(),
            pending_deep_links: Mutex::new(Vec::new()),
            cached_access_token: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            start_recording,
            stop_recording,
            start_transcription,
            finish_transcription,
            set_global_shortcut,
            get_hotkey_backend_name,
            get_hotkey_backend_info,
            get_macos_input_monitoring_status,
            get_macos_native_runtime_status,
            get_macos_native_preflight_issues,
            probe_macos_native_event_tap_command,
            request_macos_input_monitoring,
            show_overlay_window,
            hide_overlay_window,
            resize_overlay_window_command,
            close_overlay_window,
            show_recording_window,
            hide_recording_window,
            show_settings_window,
            type_text,
            log_to_terminal,
            process_audio_with_ffmpeg,
            start_post_conversion_flow,
            start_post_conversion_flow_at,
            consume_pending_deep_links,
            get_cached_access_token,
            set_cached_access_token,
            emit_transcription_finished,
            open_post_conversion_popup,
            close_post_conversion_popup,
            apply_post_conversion,
            secure_storage_get,
            secure_storage_set,
            secure_storage_delete,
        ])
        .setup(move |app| {
            #[cfg(debug_assertions)]
            println!("[Startup] setup start: {}ms", startup_at.elapsed().as_millis());
            // Setup tray
            let tray_at = std::time::Instant::now();
            setup_tray_clean(
                app.handle(),
                |app| {
                    restore_main_window(app);
                },
                |app| {
                    show_settings_window(app).ok();
                },
                toggle_main_window_visibility,
            )?;
            #[cfg(debug_assertions)]
            println!("[Startup] tray setup: {}ms", tray_at.elapsed().as_millis());

            if launched_in_background() {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.hide();
                }
            } else {
                restore_main_window(app.handle());
            }
            #[cfg(debug_assertions)]
            println!("[Startup] main window path: {}ms", startup_at.elapsed().as_millis());

            // Initialize deep link protocol
            let handle = app.handle().clone();
            app.deep_link().on_open_url(move |event| {
                let urls = event.urls().iter().map(|url| url.to_string()).collect::<Vec<_>>();
                #[cfg(debug_assertions)]
                println!("[Rust] Deep link received.");
                queue_and_emit_deep_links(&handle, urls);
            });

            #[cfg(debug_assertions)]
            println!("[Startup] overlay ready: {}ms", startup_at.elapsed().as_millis());

            let shortcut_at = std::time::Instant::now();
            register_global_shortcut(app.handle(), "Ctrl+Alt")?;
            #[cfg(debug_assertions)]
            println!("[Startup] global shortcut: {}ms", shortcut_at.elapsed().as_millis());

            start_post_conversion_detection(app.handle().clone());
            #[cfg(debug_assertions)]
            println!("[Startup] post-conversion hook initialized");
            ensure_windows_autostart().ok();

            #[cfg(debug_assertions)]
            println!("[Startup] setup done: {}ms", startup_at.elapsed().as_millis());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}








