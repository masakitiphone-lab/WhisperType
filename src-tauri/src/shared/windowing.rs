use tauri::{webview::Color, WebviewWindow};

pub const OVERLAY_WIDTH: u32 = 211;
pub const OVERLAY_HEIGHT: u32 = 56;
pub const OVERLAY_VERTICAL_OFFSET: f64 = 0.0;
pub const SETTINGS_WINDOW_WIDTH: u32 = 1040;
pub const SETTINGS_WINDOW_HEIGHT: u32 = 780;
pub const SETTINGS_WINDOW_MIN_WIDTH: u32 = 900;
pub const SETTINGS_WINDOW_MIN_HEIGHT: u32 = 680;

#[derive(Clone, Copy)]
pub enum OverlayPosition {
    Bottom,
    Top,
}

impl OverlayPosition {
    pub fn from_str(value: &str) -> Self {
        match value {
            "top" => Self::Top,
            _ => Self::Bottom,
        }
    }
}

pub fn apply_overlay_visuals(window: &WebviewWindow) {
    let _ = window.set_shadow(false);
    let _ = window.set_background_color(Some(Color(0, 0, 0, 0)));
}

pub fn show_window_without_focus(window: &WebviewWindow) {
    let _ = window.unminimize();
    let _ = window.set_always_on_top(true);
    let _ = window.show();
    let _ = window.set_always_on_top(true);
}

pub fn position_overlay_window(
    window: &WebviewWindow,
    width: f64,
    height: f64,
    vertical_offset: f64,
    offset_x: f64,
    overlay_position: OverlayPosition,
) {
    let monitor = window
        .primary_monitor()
        .ok()
        .flatten()
        .or_else(|| window.current_monitor().ok().flatten());

    if let Some(monitor) = monitor {
        let scale = monitor.scale_factor();
        let size = monitor.size().to_logical::<f64>(scale);
        let position = monitor.position().to_logical::<f64>(scale);
        let x = position.x + (size.width - width) / 2.0 + offset_x;
        let anchor_y = match overlay_position {
            OverlayPosition::Top => size.height * 0.18,
            OverlayPosition::Bottom => size.height * 0.82,
        };
        let y = position.y + anchor_y - (height / 2.0) + vertical_offset;
        let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition { x, y }));
    }
}

pub fn resize_overlay_window(
    window: &WebviewWindow,
    width: f64,
    height: f64,
    overlay_position: OverlayPosition,
    offset_x: f64,
    offset_y: f64,
) {
    let logical_width = width.max(1.0).round();
    let logical_height = height.max(1.0).round();
    apply_overlay_visuals(window);
    let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize {
        width: logical_width,
        height: logical_height,
    }));
    position_overlay_window(
        window,
        logical_width,
        logical_height,
        offset_y,
        offset_x,
        overlay_position,
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
