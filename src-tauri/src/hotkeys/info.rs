use serde::Serialize;

#[derive(Clone, Serialize)]
pub struct HotkeyBackendInfo {
    pub backend_name: String,
    pub platform: String,
    pub backend_tier: String,
    pub planned_native_backend: Option<String>,
    pub supports_modifier_only: bool,
    pub supports_function_keys: bool,
    pub supports_navigation_keys: bool,
    pub supports_mouse_buttons: bool,
    pub supports_vendor_keys: bool,
    pub requires_accessibility_permission: bool,
    pub required_permission_name: Option<String>,
    pub permission_hint: Option<String>,
    pub supported_examples: Vec<String>,
    pub unsupported_examples: Vec<String>,
    pub notes: Vec<String>,
}
