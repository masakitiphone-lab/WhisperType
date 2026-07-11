use tauri::AppHandle;

mod binding;
mod info;

pub use binding::{BindingToken, HotkeyBinding};
pub use info::HotkeyBackendInfo;

pub trait HotkeyBackend: Send + Sync {
    fn backend_name(&self) -> &'static str;
    fn info(&self) -> HotkeyBackendInfo;
    fn set_binding(&self, app: &AppHandle, binding: &str) -> Result<String, String>;
}

pub fn create_hotkey_backend() -> Box<dyn HotkeyBackend> {
    #[cfg(target_os = "windows")]
    {
        Box::new(WindowsHookHotkeyBackend::default())
    }

    #[cfg(target_os = "macos")]
    {
        create_macos_hotkey_backend()
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        panic!("WhisperType currently supports only the native Windows and macOS hotkey backends.")
    }
}

#[cfg(target_os = "macos")]
#[path = "macos.rs"]
mod macos_hotkey_backend;

#[cfg(target_os = "macos")]
pub use self::macos_hotkey_backend::{
    macos_native_preflight_issues, macos_native_runtime_status_label, macos_permission_status_label,
    probe_macos_native_event_tap,
    request_macos_input_monitoring_permission,
};

#[cfg(target_os = "macos")]
pub use self::macos_hotkey_backend::create_macos_hotkey_backend;

#[cfg(target_os = "windows")]
#[path = "windows.rs"]
mod windows_hook_backend;

#[cfg(target_os = "windows")]
pub use self::windows_hook_backend::WindowsHookHotkeyBackend;

#[cfg(test)]
mod tests {
    use super::{BindingToken, HotkeyBinding};

    #[test]
    fn parses_modifier_only_binding() {
        let binding = HotkeyBinding::parse("Ctrl+Shift").expect("binding should parse");

        assert_eq!(
            binding.tokens,
            vec![
                BindingToken::Modifier("Ctrl"),
                BindingToken::Modifier("Shift"),
            ]
        );
        assert!(binding.has_modifier_only());
    }

    #[test]
    fn parses_punctuation_binding_without_separator_collision() {
        let binding = HotkeyBinding::parse("Ctrl+Alt+Equal").expect("binding should parse");

        assert!(binding.tokens.contains(&BindingToken::Modifier("Ctrl")));
        assert!(binding.tokens.contains(&BindingToken::Modifier("Alt")));
        assert!(binding.tokens.contains(&BindingToken::Key("Equal".to_string())));
        assert!(!binding.has_modifier_only());
    }

    #[test]
    fn parses_mouse_binding() {
        let binding = HotkeyBinding::parse("Ctrl+Mouse4").expect("binding should parse");

        assert_eq!(
            binding.tokens,
            vec![
                BindingToken::Modifier("Ctrl"),
                BindingToken::Mouse("Mouse4".to_string()),
            ]
        );
        assert!(binding.has_mouse_tokens());
    }

}
