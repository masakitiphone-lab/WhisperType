pub mod input;
pub mod popup;
pub mod state;

#[cfg(target_os = "windows")]
pub use input::windows::start_post_conversion_detection;

#[cfg(not(target_os = "windows"))]
pub fn start_post_conversion_detection(_app: tauri::AppHandle) {}
