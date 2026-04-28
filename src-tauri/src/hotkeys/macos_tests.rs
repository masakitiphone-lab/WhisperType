use super::{
    compile_native_binding, native_binding_matches_input, update_native_input_snapshot,
    validate_native_binding,
};
use crate::hotkeys::HotkeyBinding;

#[test]
fn native_validation_rejects_mouse_binding() {
    let binding = HotkeyBinding::parse("Ctrl+Mouse4").expect("binding should parse");

    validate_native_binding(&binding).expect("mouse binding should now be valid");
}

#[test]
fn native_validation_rejects_vendor_binding() {
    let binding = HotkeyBinding::parse("VendorButton1").expect("binding should parse");

    let error = validate_native_binding(&binding).expect_err("vendor binding should fail");
    assert!(error.contains("Vendor-specific"));
}

#[test]
fn native_binding_compiles_command_pageup() {
    let binding = HotkeyBinding::parse("Command+PageUp").expect("binding should parse");

    let compiled = compile_native_binding(&binding).expect("binding should compile");
    assert_eq!(compiled.required_flags, 0x0010_0000);
    assert_eq!(compiled.key_codes, vec![116]);
    assert!(compiled.mouse_buttons.is_empty());
}

#[test]
fn native_binding_compiles_modifier_only() {
    let binding = HotkeyBinding::parse("Ctrl+Shift").expect("binding should parse");

    let compiled = compile_native_binding(&binding).expect("binding should compile");
    assert_eq!(compiled.required_flags, 0x0006_0000);
    assert!(compiled.key_codes.is_empty());
    assert!(compiled.mouse_buttons.is_empty());
}

#[test]
fn native_binding_matches_exact_flags_and_keys() {
    let binding = HotkeyBinding::parse("Command+PageUp").expect("binding should parse");
    let compiled = compile_native_binding(&binding).expect("binding should compile");

    assert!(native_binding_matches_input(&compiled, 0x0010_0000, &[116], &[]));
    assert!(!native_binding_matches_input(&compiled, 0x0008_0000, &[116], &[]));
    assert!(!native_binding_matches_input(&compiled, 0x0010_0000, &[116, 123], &[]));
}

#[test]
fn native_binding_matches_modifier_only_exactly() {
    let binding = HotkeyBinding::parse("Ctrl+Shift").expect("binding should parse");
    let compiled = compile_native_binding(&binding).expect("binding should compile");

    assert!(native_binding_matches_input(&compiled, 0x0006_0000, &[], &[]));
    assert!(!native_binding_matches_input(&compiled, 0x0004_0000, &[], &[]));
}

#[test]
fn native_binding_matches_mouse_and_modifier_exactly() {
    let binding = HotkeyBinding::parse("Command+Mouse4").expect("binding should parse");
    let compiled = compile_native_binding(&binding).expect("binding should compile");

    assert_eq!(compiled.required_flags, 0x0010_0000);
    assert!(compiled.key_codes.is_empty());
    assert_eq!(compiled.mouse_buttons, vec![3]);

    assert!(native_binding_matches_input(&compiled, 0x0010_0000, &[], &[3]));
    assert!(!native_binding_matches_input(&compiled, 0x0010_0000, &[], &[4]));
    assert!(!native_binding_matches_input(&compiled, 0x0010_0000, &[116], &[3]));
}

#[test]
fn native_input_snapshot_tracks_activation_changes() {
    let binding = HotkeyBinding::parse("Ctrl+Shift").expect("binding should parse");
    let compiled = compile_native_binding(&binding).expect("binding should compile");
    let state = super::shared_native_state();
    *state.compiled_binding.lock().unwrap() = Some(compiled);
    *state.binding_is_active.lock().unwrap() = false;

    assert!(update_native_input_snapshot(0x0006_0000, &[], &[]));
    assert!(!update_native_input_snapshot(0x0006_0000, &[], &[]));
    assert!(update_native_input_snapshot(0x0004_0000, &[], &[]));
}
