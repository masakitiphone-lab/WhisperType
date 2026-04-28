use tauri::{webview::Color, WebviewWindow};

pub const OVERLAY_WIDTH: u32 = 520;
pub const OVERLAY_HEIGHT: u32 = 196;
pub const OVERLAY_BOTTOM_OFFSET: f64 = 38.0;
pub const SETTINGS_WINDOW_WIDTH: u32 = 1040;
pub const SETTINGS_WINDOW_HEIGHT: u32 = 780;
pub const SETTINGS_WINDOW_MIN_WIDTH: u32 = 900;
pub const SETTINGS_WINDOW_MIN_HEIGHT: u32 = 680;

pub fn apply_overlay_visuals(window: &WebviewWindow) {
    let _ = window.set_shadow(false);
    let _ = window.set_background_color(Some(Color(0, 0, 0, 0)));
}

pub fn show_window_without_focus(window: &WebviewWindow) {
    let _ = window.unminimize();
    let _ = window.show();
}

pub fn position_window_bottom_center(
    window: &WebviewWindow,
    width: f64,
    height: f64,
    bottom_offset: f64,
) {
    if let Ok(Some(monitor)) = window.current_monitor() {
        let scale = monitor.scale_factor();
        let size = monitor.size().to_logical::<f64>(scale);
        let x = (size.width - width) / 2.0;
        let y = size.height - height - bottom_offset;
        let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition { x, y }));
    }
}

pub fn resize_overlay_window(window: &WebviewWindow, width: f64, height: f64) {
    let physical_width = width.max(320.0).round() as u32;
    let physical_height = height.max(160.0).round() as u32;
    let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
        width: physical_width,
        height: physical_height,
    }));
    position_window_bottom_center(
        window,
        physical_width as f64,
        physical_height as f64,
        OVERLAY_BOTTOM_OFFSET,
    );
}

pub fn configure_main_window_for_settings(window: &WebviewWindow) {
    let _ = window.set_min_size(Some(tauri::Size::Physical(tauri::PhysicalSize {
        width: SETTINGS_WINDOW_MIN_WIDTH,
        height: SETTINGS_WINDOW_MIN_HEIGHT,
    })));
    let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
        width: SETTINGS_WINDOW_WIDTH,
        height: SETTINGS_WINDOW_HEIGHT,
    }));
    let _ = window.set_decorations(true);
    let _ = window.set_always_on_top(false);
    let _ = window.set_skip_taskbar(false);
    let _ = window.center();
}
