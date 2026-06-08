#[cfg(target_os = "macos")]
use crate::log_store::append_log_line;

#[cfg(target_os = "macos")]
pub fn is_accessibility_trusted() -> bool {
    #[link(name = "ApplicationServices", kind = "framework")]
    unsafe extern "C" {
        fn AXIsProcessTrusted() -> u8;
    }

    unsafe { AXIsProcessTrusted() != 0 }
}

#[cfg(target_os = "macos")]
pub fn request_accessibility_permission() -> Result<(), String> {
    let pref_pane_url = "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility";
    if let Ok(url) = std::process::Command::new("open")
        .arg(pref_pane_url)
        .output()
    {
        if url.status.success() {
            append_log_line("[Accessibility] Opened System Settings > Privacy & Security > Accessibility");
            return Ok(());
        }
    }

    if let Ok(url) = std::process::Command::new("open")
        .arg("/System/Library/PreferencePanes/Security.prefPane")
        .output()
    {
        if url.status.success() {
            return Ok(());
        }
    }

    Err("failed_to_open_accessibility_settings".to_string())
}

#[cfg(not(target_os = "macos"))]
pub fn is_accessibility_trusted() -> bool {
    true
}

#[cfg(not(target_os = "macos"))]
pub fn request_accessibility_permission() -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub fn get_accessibility_status() -> Result<bool, String> {
    Ok(is_accessibility_trusted())
}

#[tauri::command]
pub fn request_accessibility_permission_command() -> Result<(), String> {
    request_accessibility_permission()
}
