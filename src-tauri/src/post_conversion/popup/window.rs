use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};

#[derive(Clone, Serialize)]
pub struct PostConversionPayload {
    pub anchor_x: i32,
    pub anchor_y: i32,
}

fn open_popup_window(app: &AppHandle) -> Result<(), String> {
    if app.get_webview_window("ai-post-conversion").is_some() {
        return Ok(());
    }

    WebviewWindowBuilder::new(
        app,
        "ai-post-conversion",
        WebviewUrl::App("postConversion.html".into()),
    )
    .title("AI Post Conversion")
    .inner_size(220.0, 120.0)
    .resizable(false)
    .decorations(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .visible(false)
    .build()
    .map_err(|error| error.to_string())?;

    Ok(())
}

fn clamp_window_position(app: &AppHandle, anchor_x: i32, anchor_y: i32) -> Result<(f64, f64), String> {
    let window_width = 220.0;
    let window_height = 120.0;
    let margin = 12.0;

    let Some(window) = app.get_webview_window("ai-post-conversion") else {
        return Ok((anchor_x as f64, anchor_y as f64));
    };

    let monitor = window.current_monitor().map_err(|error| error.to_string())?;
    let Some(monitor) = monitor else {
        return Ok((anchor_x as f64, anchor_y as f64));
    };

    let scale = monitor.scale_factor();
    let size = monitor.size().to_logical::<f64>(scale);
    let position = monitor.position().to_logical::<f64>(scale);
    let mut x = anchor_x as f64 - window_width / 2.0;
    let mut y = anchor_y as f64 - window_height - margin;

    let min_x = position.x + margin;
    let min_y = position.y + margin;
    let max_x = position.x + size.width - window_width - margin;
    let max_y = position.y + size.height - window_height - margin;

    x = x.max(min_x).min(max_x);
    y = y.max(min_y).min(max_y);

    Ok((x, y))
}

#[tauri::command]
pub fn open_post_conversion_popup(
    app: AppHandle,
    anchor_x: i32,
    anchor_y: i32,
) -> Result<PostConversionPayload, String> {
    let payload = PostConversionPayload { anchor_x, anchor_y };

    open_popup_window(&app)?;
    if let Some(window) = app.get_webview_window("ai-post-conversion") {
        if let Ok((x, y)) = clamp_window_position(&app, anchor_x, anchor_y) {
            let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition { x, y }));
        }
        let _ = window.show();
        let _ = window.set_focus();
    }
    app.emit("ai-post-conversion-opened", payload.clone())
        .map_err(|error| error.to_string())?;
    Ok(payload)
}

#[tauri::command]
pub fn start_post_conversion_flow(app: AppHandle) -> Result<PostConversionPayload, String> {
    open_post_conversion_popup(app, 0, 0)
}

#[tauri::command]
pub fn start_post_conversion_flow_at(
    app: AppHandle,
    anchor_x: i32,
    anchor_y: i32,
) -> Result<PostConversionPayload, String> {
    open_post_conversion_popup(app, anchor_x, anchor_y)
}

#[tauri::command]
pub fn apply_post_conversion() -> Result<(), String> { Ok(()) }

#[tauri::command]
pub fn close_post_conversion_popup(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("ai-post-conversion") {
        let _ = window.hide();
    }
    app.emit("ai-post-conversion-closed", ()).map_err(|error| error.to_string())?;
    Ok(())
}
