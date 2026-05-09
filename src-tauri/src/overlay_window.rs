use std::{
    thread,
    time::{Duration, Instant},
};

use tauri::{
    webview::Color, AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder,
};

use crate::{
    log_store::append_log_line,
    windowing::{
        apply_overlay_visuals, position_overlay_window, resize_overlay_window,
        set_overlay_mouse_passthrough, show_window_without_focus, OverlayPosition, OVERLAY_HEIGHT,
        OVERLAY_VERTICAL_OFFSET, OVERLAY_WIDTH,
    },
    AppState,
};

const NOTICE_WIDTH: f64 = 268.0;
const NOTICE_HEIGHT: f64 = 104.0;

#[derive(Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct OverlayLayoutPreferences {
    pub(crate) overlay_scale: f64,
    pub(crate) overlay_position: String,
    pub(crate) overlay_offset_x: f64,
    pub(crate) overlay_offset_y: f64,
}

impl Default for OverlayLayoutPreferences {
    fn default() -> Self {
        Self {
            overlay_scale: 1.0,
            overlay_position: "bottom".to_string(),
            overlay_offset_x: 0.0,
            overlay_offset_y: 0.0,
        }
    }
}

pub(crate) fn preload_overlay_windows(app: &AppHandle) -> Result<(), String> {
    ensure_overlay_window(app, false)?;
    ensure_overlay_notice_window(app, false)?;
    Ok(())
}

#[tauri::command]
pub(crate) fn show_recording_window(app: AppHandle) -> Result<(), String> {
    ensure_overlay_window(&app, true)
}

pub(crate) fn ensure_overlay_window(app: &AppHandle, visible: bool) -> Result<(), String> {
    let created_window;
    let window = if let Some(window) = app.get_webview_window("overlay") {
        created_window = false;
        window
    } else {
        created_window = true;
        WebviewWindowBuilder::new(app, "overlay", WebviewUrl::App("overlay.html".into()))
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
            .map_err(|error| error.to_string())?
    };

    if created_window {
        append_log_line("[Overlay] window created");
    }

    configure_recording_overlay_window(&window);
    let _ = window.set_always_on_top(true);
    if created_window {
        position_overlay_window(
            &window,
            OVERLAY_WIDTH as f64,
            OVERLAY_HEIGHT as f64,
            OVERLAY_VERTICAL_OFFSET,
            0.0,
            OverlayPosition::Bottom,
        );
    }

    if visible {
        append_log_line("[Overlay] show requested");
        configure_recording_overlay_window(&window);
        show_window_without_focus(&window);
        let retry_window = window.clone();
        thread::spawn(move || {
            for delay_ms in [50_u64, 150_u64] {
                thread::sleep(Duration::from_millis(delay_ms));
                configure_recording_overlay_window(&retry_window);
                let _ = retry_window.set_always_on_top(true);
                show_window_without_focus(&retry_window);
            }
        });
    } else {
        append_log_line("[Overlay] hide requested");
        configure_recording_overlay_window(&window);
        let _ = window.hide();
    }

    Ok(())
}

fn configure_recording_overlay_window(window: &tauri::WebviewWindow) {
    apply_overlay_visuals(window);
    set_overlay_mouse_passthrough(window, true);
    let _ = window.set_ignore_cursor_events(true);
}

fn configure_notice_overlay_window(window: &tauri::WebviewWindow) {
    apply_overlay_visuals(window);
    set_overlay_mouse_passthrough(window, false);
    let _ = window.set_ignore_cursor_events(false);
    let _ = window.set_always_on_top(true);
}

fn hide_recording_overlay_window(window: &tauri::WebviewWindow) {
    configure_recording_overlay_window(window);
    let _ = window.hide();
}

fn mark_overlay_seen(app: &AppHandle) -> Result<(), String> {
    let state = app.state::<AppState>();
    *state.overlay_ready.lock().map_err(|error| error.to_string())? = true;
    *state
        .overlay_last_seen
        .lock()
        .map_err(|error| error.to_string())? = Some(Instant::now());
    Ok(())
}

fn overlay_seen_recently(app: &AppHandle) -> bool {
    app.state::<AppState>()
        .overlay_last_seen
        .lock()
        .ok()
        .and_then(|last_seen| *last_seen)
        .map(|last_seen| last_seen.elapsed() <= Duration::from_secs(30))
        .unwrap_or(false)
}

fn wait_for_overlay_ready(app: &AppHandle, timeout: Duration) -> bool {
    let started_at = Instant::now();
    while started_at.elapsed() < timeout {
        if overlay_seen_recently(app) {
            return true;
        }
        thread::sleep(Duration::from_millis(25));
    }
    overlay_seen_recently(app)
}

pub(crate) fn ensure_overlay_event_target(app: &AppHandle) -> Result<(), String> {
    if app.get_webview_window("overlay").is_some() {
        if overlay_seen_recently(app) || wait_for_overlay_ready(app, Duration::from_millis(1200)) {
            return Ok(());
        }
    }

    append_log_line("[Overlay] event target stale; recreating overlay window");
    {
        let state = app.state::<AppState>();
        if let Ok(mut overlay_ready) = state.overlay_ready.lock() {
            *overlay_ready = false;
        }
        if let Ok(mut overlay_last_seen) = state.overlay_last_seen.lock() {
            *overlay_last_seen = None;
        };
    }

    if let Some(window) = app.get_webview_window("overlay") {
        let _ = window.close();
        thread::sleep(Duration::from_millis(80));
    }

    ensure_overlay_window(app, false)?;
    if wait_for_overlay_ready(app, Duration::from_millis(1200)) {
        Ok(())
    } else {
        Err("overlay_not_ready".to_string())
    }
}

#[tauri::command]
pub(crate) fn overlay_ready(app: AppHandle) -> Result<(), String> {
    mark_overlay_seen(&app)?;
    append_log_line("[Overlay] ready");
    Ok(())
}

#[tauri::command]
pub(crate) fn overlay_heartbeat(app: AppHandle) -> Result<(), String> {
    mark_overlay_seen(&app)
}

#[tauri::command]
pub(crate) fn show_overlay_window(app: AppHandle) -> Result<(), String> {
    ensure_overlay_window(&app, true)
}

#[tauri::command]
pub(crate) fn hide_overlay_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("overlay") {
        hide_recording_overlay_window(&window);
    }
    Ok(())
}

#[tauri::command]
pub(crate) fn show_overlay_notice_window(
    app: AppHandle,
    notice: serde_json::Value,
) -> Result<(), String> {
    {
        let state = app.state::<AppState>();
        *state.overlay_notice.lock().map_err(|error| error.to_string())? = Some(notice.clone());
    }

    let width = notice
        .get("width")
        .and_then(|value| value.as_f64())
        .unwrap_or(268.0);
    let height = notice
        .get("minHeight")
        .and_then(|value| value.as_f64())
        .unwrap_or(104.0);
    let preferences = app
        .state::<AppState>()
        .overlay_layout_preferences
        .lock()
        .map(|preferences| preferences.clone())
        .unwrap_or_default();
    let overlay_position = OverlayPosition::from_str(&preferences.overlay_position);

    let window = ensure_overlay_notice_window(&app, false)?;
    configure_notice_overlay_window(&window);
    resize_overlay_window(
        &window,
        width,
        height,
        overlay_position,
        preferences.overlay_offset_x,
        preferences.overlay_offset_y,
    );
    show_window_without_focus(&window);
    let _ = app.emit_to("overlay_notice", "overlay-notice-updated", notice);
    Ok(())
}

fn ensure_overlay_notice_window(
    app: &AppHandle,
    visible: bool,
) -> Result<tauri::WebviewWindow, String> {
    let created_window;
    let window = if let Some(window) = app.get_webview_window("overlay_notice") {
        created_window = false;
        window
    } else {
        created_window = true;
        WebviewWindowBuilder::new(
            app,
            "overlay_notice",
            WebviewUrl::App("overlay_notice.html".into()),
        )
        .transparent(true)
        .shadow(false)
        .background_color(Color(0, 0, 0, 0))
        .decorations(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .resizable(false)
        .inner_size(NOTICE_WIDTH, NOTICE_HEIGHT)
        .visible(false)
        .build()
        .map_err(|error| error.to_string())?
    };

    if created_window {
        append_log_line("[OverlayNotice] window created");
    }

    configure_notice_overlay_window(&window);
    resize_overlay_window(
        &window,
        NOTICE_WIDTH,
        NOTICE_HEIGHT,
        OverlayPosition::Bottom,
        0.0,
        0.0,
    );
    if visible {
        show_window_without_focus(&window);
    } else {
        let _ = window.hide();
    }

    Ok(window)
}

#[tauri::command]
pub(crate) fn hide_overlay_notice_window(app: AppHandle) -> Result<(), String> {
    {
        let state = app.state::<AppState>();
        *state.overlay_notice.lock().map_err(|error| error.to_string())? = None;
    }

    if let Some(window) = app.get_webview_window("overlay_notice") {
        configure_notice_overlay_window(&window);
        let _ = window.hide();
    }
    Ok(())
}

#[tauri::command]
pub(crate) fn get_overlay_notice(app: AppHandle) -> Result<Option<serde_json::Value>, String> {
    let state = app.state::<AppState>();
    state
        .overlay_notice
        .lock()
        .map(|notice| notice.clone())
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub(crate) fn resize_overlay_window_command(
    app: AppHandle,
    width: f64,
    height: f64,
    position: Option<String>,
    offset_x: Option<f64>,
    offset_y: Option<f64>,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("overlay") {
        configure_recording_overlay_window(&window);
        let stored_preferences = app
            .state::<AppState>()
            .overlay_layout_preferences
            .lock()
            .map(|preferences| preferences.clone())
            .unwrap_or_default();
        let overlay_position_value =
            position.unwrap_or_else(|| stored_preferences.overlay_position.clone());
        let overlay_position = OverlayPosition::from_str(&overlay_position_value);
        let offset_x = offset_x
            .unwrap_or(stored_preferences.overlay_offset_x)
            .clamp(-400.0, 400.0);
        let offset_y = offset_y
            .unwrap_or(stored_preferences.overlay_offset_y)
            .clamp(-240.0, 240.0);
        resize_overlay_window(&window, width, height, overlay_position, offset_x, offset_y);
    }
    Ok(())
}

#[tauri::command]
pub(crate) fn set_overlay_layout_preferences(
    app: AppHandle,
    preferences: OverlayLayoutPreferences,
) -> Result<(), String> {
    let state = app.state::<AppState>();
    let mut stored_preferences = state
        .overlay_layout_preferences
        .lock()
        .map_err(|error| error.to_string())?;
    *stored_preferences = OverlayLayoutPreferences {
        overlay_scale: preferences.overlay_scale.clamp(0.8, 2.0),
        overlay_position: match preferences.overlay_position.as_str() {
            "top" => "top".to_string(),
            _ => "bottom".to_string(),
        },
        overlay_offset_x: preferences.overlay_offset_x.clamp(-400.0, 400.0),
        overlay_offset_y: preferences.overlay_offset_y.clamp(-240.0, 240.0),
    };
    Ok(())
}

#[tauri::command]
pub(crate) fn get_overlay_layout_preferences(
    app: AppHandle,
) -> Result<OverlayLayoutPreferences, String> {
    let state = app.state::<AppState>();
    state
        .overlay_layout_preferences
        .lock()
        .map(|preferences| preferences.clone())
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub(crate) fn close_overlay_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("overlay") {
        let _ = window.close();
    }
    Ok(())
}

#[tauri::command]
pub(crate) fn hide_recording_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("overlay") {
        hide_recording_overlay_window(&window);
    }
    Ok(())
}
