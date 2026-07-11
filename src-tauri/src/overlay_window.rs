use std::{
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
    thread,
    time::{Duration, Instant},
};

use serde::{Deserialize, Serialize};
use tauri::{
    webview::Color, AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder,
};

use crate::{
    shared::log::append_log_line,
    shared::windowing::{
        apply_overlay_visuals, position_overlay_window, resize_overlay_window,
        show_window_without_focus, OverlayPosition, OVERLAY_HEIGHT, OVERLAY_VERTICAL_OFFSET,
        OVERLAY_WIDTH,
    },
    AppState,
};

#[derive(Clone, Serialize, Deserialize)]
pub(crate) struct NoticePayload {
    pub(crate) kind: String,
    pub(crate) code: String,
    pub(crate) detail: Option<String>,
    pub(crate) text: Option<String>,
    pub(crate) locale: String,
}

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

    apply_overlay_visuals(&window);
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
        show_window_without_focus(&window);
        let retry_abort = {
            let state = app.state::<AppState>();
            let abort = Arc::new(AtomicBool::new(false));
            if let Ok(mut flag) = state.overlay_retry_abort.lock() {
                *flag = Some(abort.clone());
            }
            abort
        };
        let retry_window = window.clone();
        thread::spawn(move || {
            for delay_ms in [50_u64, 150_u64] {
                thread::sleep(Duration::from_millis(delay_ms));
                if retry_abort.load(Ordering::Relaxed) {
                    append_log_line("[Overlay] retry aborted (window hidden)");
                    return;
                }
                apply_overlay_visuals(&retry_window);
                let _ = retry_window.set_always_on_top(true);
                show_window_without_focus(&retry_window);
            }
        });
    } else {
        append_log_line("[Overlay] hide requested");
        let _ = window.hide();
    }

    Ok(())
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
    if app.get_webview_window("overlay").is_some() && overlay_seen_recently(app) {
        return Ok(());
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
        thread::sleep(Duration::from_millis(120));
    }

    ensure_overlay_window(app, false)?;
    if wait_for_overlay_ready(app, Duration::from_millis(5000)) {
        return Ok(());
    }

    append_log_line("[Overlay] first recreation attempt failed; retrying once");
    if let Some(window) = app.get_webview_window("overlay") {
        let _ = window.close();
        thread::sleep(Duration::from_millis(120));
    }
    ensure_overlay_window(app, false)?;
    if wait_for_overlay_ready(app, Duration::from_millis(5000)) {
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
    if let Ok(mut flag) = app.state::<AppState>().overlay_retry_abort.lock() {
        if let Some(abort) = flag.take() {
            abort.store(true, Ordering::Relaxed);
        }
    }
    if let Some(window) = app.get_webview_window("overlay") {
        let _ = window.hide();
    }
    Ok(())
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
    if let Ok(mut flag) = app.state::<AppState>().overlay_retry_abort.lock() {
        if let Some(abort) = flag.take() {
            abort.store(true, Ordering::Relaxed);
        }
    }
    if let Some(notice) = app.get_webview_window("notice") {
        let _ = notice.close();
    }
    if let Some(window) = app.get_webview_window("overlay") {
        let _ = window.close();
    }
    Ok(())
}

#[tauri::command]
pub(crate) fn hide_recording_window(app: AppHandle) -> Result<(), String> {
    if let Ok(mut flag) = app.state::<AppState>().overlay_retry_abort.lock() {
        if let Some(abort) = flag.take() {
            abort.store(true, Ordering::Relaxed);
        }
    }
    if let Some(window) = app.get_webview_window("overlay") {
        let _ = window.hide();
    }
    Ok(())
}

fn ensure_notice_window(app: &AppHandle) -> Result<tauri::WebviewWindow, String> {
    if let Some(window) = app.get_webview_window("notice") {
        return Ok(window);
    }
    let window = WebviewWindowBuilder::new(app, "notice", WebviewUrl::App("notice.html".into()))
        .decorations(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .resizable(false)
        .transparent(true)
        .background_color(Color(0, 0, 0, 0))
        .inner_size(300.0, 200.0)
        .visible(false)
        .build()
        .map_err(|e| e.to_string())?;
    Ok(window)
}

#[tauri::command]
pub(crate) fn show_notice_window(app: AppHandle, payload: NoticePayload) -> Result<(), String> {
    let window = ensure_notice_window(&app)?;

    // Position near the overlay window
    if let Some(overlay) = app.get_webview_window("overlay") {
        if let Ok(overlay_pos) = overlay.outer_position() {
            let pos = overlay_pos;
            let notice_width = 300.0;
            let notice_height = 200.0;
            let overlay_width = overlay.inner_size().map(|s| s.width as f64).unwrap_or(200.0);
            let x = ((pos.x as f64).max(0.0) + (overlay_width - notice_width) / 2.0).max(0.0);
            let y = ((pos.y as f64) - notice_height - 10.0).max(0.0);
            let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition { x, y }));
        }
    }

    show_window_without_focus(&window);
    let _ = app.emit_to("notice", "show-notice", &payload);
    Ok(())
}

#[tauri::command]
pub(crate) fn hide_notice_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("notice") {
        let _ = window.hide();
    }
    Ok(())
}

#[tauri::command]
pub(crate) fn resize_notice_window(
    app: AppHandle,
    width: f64,
    height: f64,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("notice") {
        let logical_width = width.max(1.0).ceil();
        let logical_height = height.max(1.0).ceil();
        let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize {
            width: logical_width,
            height: logical_height,
        }));
    }
    Ok(())
}
