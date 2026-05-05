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
    let _ = window.set_always_on_top(true);
}

pub fn position_window_bottom_center(
    window: &WebviewWindow,
    width: f64,
    height: f64,
    bottom_offset: f64,
) {
    let monitor = window
        .current_monitor()
        .ok()
        .flatten()
        .or_else(|| window.primary_monitor().ok().flatten());

    if let Some(monitor) = monitor {
        let scale = monitor.scale_factor();
        let size = monitor.size().to_logical::<f64>(scale);
        let x = (size.width - width) / 2.0;
        let y = size.height - height - bottom_offset;
        let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition { x, y }));
    }
}

pub fn resize_overlay_window(window: &WebviewWindow, width: f64, height: f64) {
    let logical_width = width.max(1.0).round();
    let logical_height = height.max(1.0).round();
    apply_overlay_visuals(window);
    let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize {
        width: logical_width,
        height: logical_height,
    }));
    position_window_bottom_center(
        window,
        logical_width,
        logical_height,
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
