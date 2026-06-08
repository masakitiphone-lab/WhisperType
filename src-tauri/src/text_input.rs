use crate::log_store::append_log_line;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Duration;

#[cfg(target_os = "windows")]
use windows::core::Interface;

#[cfg(target_os = "windows")]
use windows::Win32::UI::Accessibility::{
    CUIAutomation, IUIAutomation, IUIAutomationElement, IUIAutomationValuePattern,
    UIA_DocumentControlTypeId, UIA_EditControlTypeId, UIA_TextControlTypeId, UIA_TextPatternId,
    UIA_CONTROLTYPE_ID, UIA_ValuePatternId,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum PasteTargetState {
    Yes,
    No,
    Unknown,
}

enum ClipboardSnapshot {
    Text(String),
    Image(arboard::ImageData<'static>),
    Unsupported,
}

static CLIPBOARD_RESTORE_GENERATION: AtomicU64 = AtomicU64::new(0);

fn capture_clipboard_snapshot(clipboard: &mut arboard::Clipboard) -> ClipboardSnapshot {
    if let Ok(text) = clipboard.get_text() {
        return ClipboardSnapshot::Text(text);
    }

    if let Ok(image) = clipboard.get_image() {
        let bytes = image.bytes.into_owned().into_boxed_slice();
        let leaked_bytes: &'static [u8] = Box::leak(bytes);
        let image_data = arboard::ImageData {
            width: image.width,
            height: image.height,
            bytes: std::borrow::Cow::Borrowed(leaked_bytes),
        };
        return ClipboardSnapshot::Image(image_data);
    }

    ClipboardSnapshot::Unsupported
}

fn restore_clipboard_snapshot(snapshot: ClipboardSnapshot) {
    if let Ok(mut clipboard) = arboard::Clipboard::new() {
        match snapshot {
            ClipboardSnapshot::Text(text) => {
                if let Err(error) = clipboard.set_text(text) {
                    let err = error.to_string();
                    #[cfg(debug_assertions)]
                    println!("[Rust] Error restoring clipboard text: {}", err);
                    append_log_line(&format!("[Rust] Error restoring clipboard text: {}", err));
                }
            }
            ClipboardSnapshot::Image(image) => {
                if let Err(error) = clipboard.set_image(image) {
                    let err = error.to_string();
                    #[cfg(debug_assertions)]
                    println!("[Rust] Error restoring clipboard image: {}", err);
                    append_log_line(&format!("[Rust] Error restoring clipboard image: {}", err));
                }
            }
            ClipboardSnapshot::Unsupported => {
                #[cfg(debug_assertions)]
                println!("[Rust] Clipboard restore skipped: unsupported clipboard format");
                append_log_line("[Rust] Clipboard restore skipped: unsupported clipboard format");
            }
        }
    }
}

#[cfg(target_os = "windows")]
fn detect_windows_paste_target_state() -> PasteTargetState {
    use windows::Win32::System::Com::{
        CoCreateInstance, CoInitializeEx, CoUninitialize, CLSCTX_INPROC_SERVER,
        COINIT_APARTMENTTHREADED,
    };

    unsafe {
        if CoInitializeEx(None, COINIT_APARTMENTTHREADED).is_err() {
            return PasteTargetState::Unknown;
        }

        let result: Result<PasteTargetState, ()> = (|| {
            let automation: IUIAutomation =
                CoCreateInstance(&CUIAutomation, None, CLSCTX_INPROC_SERVER).map_err(|_| ())?;
            let element = automation.GetFocusedElement().map_err(|_| ())?;

            if element_or_parent_is_text_input(&automation, element)? {
                Ok(PasteTargetState::Yes)
            } else {
                Ok(PasteTargetState::No)
            }
        })();

        CoUninitialize();
        result.unwrap_or(PasteTargetState::Unknown)
    }
}

#[cfg(target_os = "windows")]
fn element_or_parent_is_text_input(
    automation: &IUIAutomation,
    element: IUIAutomationElement,
) -> Result<bool, ()> {
    let mut saw_possible_text_target = false;

    match classify_text_input_element(&element) {
        PasteTargetState::Yes => return Ok(true),
        PasteTargetState::Unknown => saw_possible_text_target = true,
        PasteTargetState::No => {}
    }

    let walker = unsafe { automation.ControlViewWalker().map_err(|_| ())? };
    let mut current = element;

    for _ in 0..4 {
        let Ok(parent) = (unsafe { walker.GetParentElement(&current) }) else {
            break;
        };

        match classify_text_input_element(&parent) {
            PasteTargetState::Yes => return Ok(true),
            PasteTargetState::Unknown => saw_possible_text_target = true,
            PasteTargetState::No => {}
        }

        current = parent;
    }

    if saw_possible_text_target {
        Err(())
    } else {
        Ok(false)
    }
}

#[cfg(target_os = "windows")]
fn classify_text_input_element(element: &IUIAutomationElement) -> PasteTargetState {
    unsafe {
        let control_type = match element.CurrentControlType() {
            Ok(value) => value,
            Err(_) => return PasteTargetState::Unknown,
        };

        if control_type == UIA_EditControlTypeId {
            return PasteTargetState::Yes;
        }

        if has_editable_value_pattern(element) {
            return PasteTargetState::Yes;
        }

        if is_possible_custom_text_target(element, control_type) {
            return PasteTargetState::Unknown;
        }

        PasteTargetState::No
    }
}

#[cfg(target_os = "windows")]
fn has_editable_value_pattern(element: &IUIAutomationElement) -> bool {
    unsafe {
        let Ok(pattern) = element.GetCurrentPattern(UIA_ValuePatternId) else {
            return false;
        };
        let Ok(value_pattern) = pattern.cast::<IUIAutomationValuePattern>() else {
            return false;
        };

        value_pattern
            .CurrentIsReadOnly()
            .map(|is_readonly| !is_readonly.as_bool())
            .unwrap_or(false)
    }
}

#[cfg(target_os = "windows")]
fn is_possible_custom_text_target(
    element: &IUIAutomationElement,
    control_type: UIA_CONTROLTYPE_ID,
) -> bool {
    unsafe {
        let is_keyboard_focusable = element
            .CurrentIsKeyboardFocusable()
            .map(|value| value.as_bool())
            .unwrap_or(false);

        if !is_keyboard_focusable {
            return false;
        }

        if control_type == UIA_DocumentControlTypeId || control_type == UIA_TextControlTypeId {
            return true;
        }

        element.GetCurrentPattern(UIA_TextPatternId).is_ok()
    }
}

fn detect_paste_target_state_before_paste() -> PasteTargetState {
    #[cfg(target_os = "windows")]
    {
        detect_windows_paste_target_state()
    }

    #[cfg(not(target_os = "windows"))]
    {
        PasteTargetState::Unknown
    }
}

fn log_paste_target_state(state: PasteTargetState) {
    match state {
        PasteTargetState::No => {
            #[cfg(debug_assertions)]
            println!("[Rust] Paste target not selected; continuing with paste");
            append_log_line("[Rust] Paste target not selected; continuing with paste");
        }
        PasteTargetState::Unknown => {
            #[cfg(debug_assertions)]
            println!("[Rust] Paste target state unknown; continuing with paste");
            append_log_line("[Rust] Paste target state unknown; continuing with paste");
        }
        PasteTargetState::Yes => {}
    }
}

pub fn type_text_internal(text: String, use_clipboard_paste: bool) -> Result<String, String> {
    #[cfg(target_os = "macos")]
    if use_clipboard_paste && !crate::accessibility::is_accessibility_trusted() {
        return Err("accessibility_permission_required".to_string());
    }

    use enigo::{
        Direction::{Click, Press, Release},
        Enigo, Key, Keyboard, Settings,
    };

    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| {
        let err = e.to_string();
        #[cfg(debug_assertions)]
        println!("[Rust] Error creating Enigo: {}", err);
        append_log_line(&format!("[Rust] Error creating Enigo: {}", err));
        err
    })?;

    if use_clipboard_paste {
        let paste_target_state = detect_paste_target_state_before_paste();
        log_paste_target_state(paste_target_state);

        let paste_result = (|| -> Result<(), String> {
            let mut clipboard = arboard::Clipboard::new().map_err(|e| {
                let err = e.to_string();
                #[cfg(debug_assertions)]
                println!("[Rust] Error creating clipboard handle: {}", err);
                append_log_line(&format!("[Rust] Error creating clipboard handle: {}", err));
                err
            })?;
            let original_clipboard_snapshot = capture_clipboard_snapshot(&mut clipboard);
            let restore_generation = CLIPBOARD_RESTORE_GENERATION.fetch_add(1, Ordering::SeqCst) + 1;

            let paste_result = (|| -> Result<(), String> {
                clipboard.set_text(text.clone()).map_err(|e| {
                    let err = e.to_string();
                    #[cfg(debug_assertions)]
                    println!("[Rust] Error setting clipboard text: {}", err);
                    append_log_line(&format!("[Rust] Error setting clipboard text: {}", err));
                    err
                })?;

                let paste_mod = if cfg!(target_os = "macos") { Key::Meta } else { Key::Control };
                enigo.key(paste_mod, Press).map_err(|e| e.to_string())?;
                enigo.key(Key::Unicode('v'), Click).map_err(|e| e.to_string())?;
                enigo.key(paste_mod, Release).map_err(|e| e.to_string())?;

                Ok(())
            })();

            std::thread::spawn(move || {
                std::thread::sleep(Duration::from_millis(2000));

                if CLIPBOARD_RESTORE_GENERATION.load(Ordering::SeqCst) != restore_generation {
                    #[cfg(debug_assertions)]
                    println!("[Rust] Clipboard restore skipped because a newer paste started");
                    append_log_line("[Rust] Clipboard restore skipped because a newer paste started");
                    return;
                }

                restore_clipboard_snapshot(original_clipboard_snapshot);
            });

            paste_result
        })();

        if let Err(error) = paste_result {
            #[cfg(debug_assertions)]
            println!("[Rust] Clipboard paste failed: {}", error);
            append_log_line(&format!("[Rust] Clipboard paste failed: {}", error));
            return Err(if error.contains("paste_target_not_selected") {
                "paste_target_not_selected".to_string()
            } else {
                "ctrl_v_send_failed".to_string()
            });
        }

        return Ok(match paste_target_state {
            PasteTargetState::No => "paste_sent_target_not_selected",
            PasteTargetState::Unknown => "paste_sent_target_unknown",
            PasteTargetState::Yes => "paste_sent",
        }
        .to_string());
    }

    Ok("typed".to_string())
}
