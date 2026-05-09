#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod hotkeys;
mod audio_processing;
mod shared;
mod log_store;
pub(crate) mod overlay_window;
mod secure_storage;
mod tray;
mod text_input;
mod windowing;
mod ms_store;

use tauri::{AppHandle, Emitter, Manager, UserAttentionType, WebviewUrl, WebviewWindowBuilder};
use reqwest::multipart;
use hotkeys::{create_hotkey_backend, HotkeyBackend, HotkeyBackendInfo};
#[cfg(target_os = "macos")]
use hotkeys::{
    macos_native_preflight_issues, macos_native_runtime_status_label, macos_permission_status_label,
    probe_macos_native_event_tap,
    request_macos_input_monitoring_permission,
};
use tauri_plugin_deep_link::DeepLinkExt;
use reqwest::Url;
use text_input::type_text_internal;
use log_store::append_log_line;
use audio_processing::{detect_speech_with_vad, process_audio_with_ffmpeg};
use tray::setup_tray_clean;
use overlay_window::OverlayLayoutPreferences;
use windowing::configure_main_window_for_settings;
use shared::hotkey_events::{
    emit_recording_started, emit_recording_stopped, emit_transcription_finished as emit_transcription_finished_event,
    emit_transcription_prefetch, emit_transcription_started,
};

use std::{sync::Mutex, time::Instant};
#[cfg(target_os = "windows")]
use std::process::Command;
use ms_store::{check_plus_store_license, get_checkout_provider, is_store_build, purchase_plus_via_store};
use secure_storage::{secure_storage_delete, secure_storage_get, secure_storage_set};

const TRANSCRIBE_HOST_ALLOWLIST: Option<&str> = option_env!("WHISPERTYPE_TRANSCRIBE_HOST_ALLOWLIST");

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
    overlay_ready: Mutex<bool>,
    overlay_last_seen: Mutex<Option<Instant>>,
    overlay_layout_preferences: Mutex<OverlayLayoutPreferences>,
    overlay_notice: Mutex<Option<serde_json::Value>>,
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
    let registered_shortcut = state
        .hotkey_backend
        .set_binding(app, shortcut_str)
        .map_err(|error| error.to_string())?;
    let mut current_shortcut = state.current_shortcut.lock().map_err(|e| e.to_string())?;
    *current_shortcut = registered_shortcut.clone();

    Ok(registered_shortcut)
}

#[tauri::command]
fn start_recording(app: AppHandle) -> Result<(), String> {
    start_recording_internal(&app, "command")?;
    Ok(())
}

#[tauri::command]
fn stop_recording(app: AppHandle) -> Result<(), String> {
    stop_recording_internal(&app, "command")?;
    Ok(())
}

pub(crate) fn start_recording_internal(app: &AppHandle, source: &str) -> Result<bool, String> {
    if let Ok(cached_access_token) = app.state::<AppState>().cached_access_token.lock() {
        if cached_access_token.is_none() {
            append_log_line("[Shortcut] rejected: no cached access token (user not signed in)");
            restore_main_window(app);
            app.emit("auth-required", ()).ok();
            return Err("auth_required".to_string());
        }
    }

    let state = app.state::<AppState>();
    let mut recording = state.recording.lock().map_err(|e| e.to_string())?;
    if recording.is_recording {
        append_log_line(&format!("[Shortcut] start ignored: already recording source={source}"));
        return Ok(false);
    }
    recording.is_recording = true;
    recording.is_transcribing = false;
    drop(recording);

    if let Err(error) = overlay_window::ensure_overlay_event_target(app) {
        let mut recording = state.recording.lock().map_err(|e| e.to_string())?;
        recording.is_recording = false;
        recording.is_transcribing = false;
        return Err(error);
    }

    emit_recording_started(app);
    emit_transcription_prefetch(app);
    Ok(true)
}

pub(crate) fn stop_recording_internal(app: &AppHandle, source: &str) -> Result<bool, String> {
    let state = app.state::<AppState>();
    let mut recording = state.recording.lock().map_err(|e| e.to_string())?;
    if !recording.is_recording {
        append_log_line(&format!("[Shortcut] stop ignored: not recording source={source}"));
        return Ok(false);
    }
    recording.is_recording = false;
    drop(recording);

    emit_recording_stopped(app);
    Ok(true)
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
fn emit_transcription_finished(app: AppHandle) -> Result<(), String> {
    emit_transcription_finished_event(&app);
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

fn validate_transcribe_endpoint(endpoint: &str) -> Result<Url, String> {
    let url = Url::parse(endpoint).map_err(|_| "invalid_transcribe_endpoint".to_string())?;
    let host = url.host_str().ok_or_else(|| "invalid_transcribe_endpoint".to_string())?;
    let is_localhost = matches!(host, "localhost" | "127.0.0.1" | "::1");

    if cfg!(debug_assertions) && is_localhost {
        return Ok(url);
    }

    if url.scheme() != "https" || is_localhost {
        return Err("invalid_transcribe_endpoint".to_string());
    }

    if let Some(allowlist) = TRANSCRIBE_HOST_ALLOWLIST {
        let allowed = allowlist
            .split(',')
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .any(|allowed_host| host == allowed_host);

        if !allowed {
            return Err("transcribe_endpoint_not_allowed".to_string());
        }
    }

    Ok(url)
}

#[tauri::command]
async fn transcribe_request(
    endpoint: String,
    access_token: String,
    apikey: Option<String>,
    file_name: String,
    file_bytes: Vec<u8>,
    file_mime_type: String,
    language: Option<String>,
    model: String,
    prompt: Option<String>,
) -> Result<String, String> {
    let client = reqwest::Client::new();
    let endpoint_url = validate_transcribe_endpoint(&endpoint)?;
    let file_size = file_bytes.len();
    let has_language = language
        .as_ref()
        .map(|value| !value.trim().is_empty() && value != "auto")
        .unwrap_or(false);
    let has_prompt = prompt
        .as_ref()
        .map(|value| !value.trim().is_empty())
        .unwrap_or(false);
    let _ = (file_size, has_language, has_prompt);
    let mut form = multipart::Form::new().part(
        "file",
        multipart::Part::bytes(file_bytes)
            .file_name(file_name)
            .mime_str(&file_mime_type)
            .map_err(|error| error.to_string())?,
    );

    if let Some(language) = language.filter(|value| !value.trim().is_empty() && value != "auto") {
        form = form.text("language", language);
    }
    form = form.text("model", model);
    if let Some(prompt) = prompt.filter(|value| !value.trim().is_empty()) {
        form = form.text("prompt", prompt);
    }

    let mut request = client
        .post(endpoint_url)
        .bearer_auth(access_token)
        .multipart(form);

    if let Some(apikey) = apikey.filter(|value| !value.trim().is_empty()) {
        request = request.header("apikey", apikey);
    }

    let response = request.send().await.map_err(|error| error.to_string())?;
    let status = response.status();
    let body_text = response.text().await.map_err(|error| error.to_string())?;

    if !status.is_success() {
        return Err(format!("HTTP {}: {}", status.as_u16(), body_text));
    }

    Ok(body_text)
}

#[tauri::command]
fn log_to_terminal(msg: String) {
    if cfg!(debug_assertions) {
        append_log_line(&format!("[JS Log] {msg}"));
    }
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
            overlay_ready: Mutex::new(false),
            overlay_last_seen: Mutex::new(None),
            overlay_layout_preferences: Mutex::new(OverlayLayoutPreferences::default()),
            overlay_notice: Mutex::new(None),
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
            overlay_window::show_overlay_window,
            overlay_window::overlay_ready,
            overlay_window::overlay_heartbeat,
            overlay_window::hide_overlay_window,
            overlay_window::show_overlay_notice_window,
            overlay_window::hide_overlay_notice_window,
            overlay_window::get_overlay_notice,
            overlay_window::resize_overlay_window_command,
            overlay_window::set_overlay_layout_preferences,
            overlay_window::get_overlay_layout_preferences,
            overlay_window::close_overlay_window,
            overlay_window::show_recording_window,
            overlay_window::hide_recording_window,
            show_settings_window,
            type_text,
            transcribe_request,
            log_to_terminal,
            detect_speech_with_vad,
            process_audio_with_ffmpeg,
            consume_pending_deep_links,
            get_cached_access_token,
            set_cached_access_token,
            emit_transcription_finished,
            secure_storage_get,
            secure_storage_set,
            secure_storage_delete,
            get_checkout_provider,
            is_store_build,
            purchase_plus_via_store,
            check_plus_store_license,
        ])
        .setup(move |app| {
            // Setup tray
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
            if launched_in_background() {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.hide();
                }
            } else {
                restore_main_window(app.handle());
            }
            let handle = app.handle().clone();
            app.deep_link().on_open_url(move |event| {
                let urls = event.urls().iter().map(|url| url.to_string()).collect::<Vec<_>>();
                #[cfg(debug_assertions)]
                println!("[Rust] Deep link received.");
                queue_and_emit_deep_links(&handle, urls);
            });

            register_global_shortcut(app.handle(), "Ctrl+Alt")?;

            overlay_window::preload_overlay_windows(app.handle()).ok();

            ensure_windows_autostart().ok();

            let _ = startup_at;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}








