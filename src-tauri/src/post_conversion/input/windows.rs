use crate::{
    hotkeys::stop_active_recording_shortcut,
    shared::log::append_log_line,
    post_conversion::{
        state::{reset_on_popup_hide, shared_state},
    },
};
use std::{mem::size_of, ptr::null_mut, sync::atomic::Ordering, thread};
use tauri::AppHandle;
use windows::Win32::{
    Foundation::{HWND, LPARAM, LRESULT, WPARAM},
    Foundation::POINT,
    System::LibraryLoader::GetModuleHandleW,
    UI::WindowsAndMessaging::{
        CallNextHookEx, CreateWindowExW, DefWindowProcW, DestroyWindow, DispatchMessageW, GetMessageW,
        GetCursorPos, PostQuitMessage, RegisterClassW, SetWindowsHookExW, TranslateMessage,
        UnhookWindowsHookEx, CS_HREDRAW, CS_VREDRAW, HC_ACTION, HHOOK, HMENU, MSG, WNDCLASSW,
        WH_MOUSE_LL, WM_CREATE, WM_DESTROY, WM_INPUT, WM_KEYDOWN, WM_KEYUP, WM_LBUTTONDOWN,
        WM_LBUTTONUP, WM_SYSKEYDOWN, WM_SYSKEYUP, WS_OVERLAPPED,
    },
};

#[repr(C)]
#[derive(Clone, Copy, Default)]
#[allow(non_snake_case)]
struct RAWINPUTDEVICE {
    usUsagePage: u16,
    usUsage: u16,
    dwFlags: u32,
    hwndTarget: HWND,
}

#[repr(C)]
#[derive(Clone, Copy, Default)]
#[allow(non_snake_case)]
struct RAWINPUTHEADER {
    dwType: u32,
    dwSize: u32,
    hDevice: isize,
    wParam: WPARAM,
}

#[repr(C)]
#[derive(Clone, Copy, Default)]
#[allow(non_snake_case)]
struct RAWMOUSE {
    usFlags: u16,
    ulButtons: u32,
    usButtonFlags: u16,
    usButtonData: u16,
    ulRawButtons: u32,
    lLastX: i32,
    lLastY: i32,
    ulExtraInformation: u32,
}

#[repr(C)]
#[derive(Clone, Copy, Default)]
#[allow(non_snake_case)]
struct RAWKEYBOARD {
    MakeCode: u16,
    Flags: u16,
    Reserved: u16,
    VKey: u16,
    Message: u32,
    ExtraInformation: u32,
}

#[repr(C)]
union RAWINPUT_DATA {
    mouse: RAWMOUSE,
    keyboard: RAWKEYBOARD,
}

#[repr(C)]
struct RAWINPUT {
    header: RAWINPUTHEADER,
    data: RAWINPUT_DATA,
}

const RIDEV_INPUTSINK: u32 = 0x0000_0100;
const RID_INPUT: u32 = 0x1000_0003;
const RIM_TYPEKEYBOARD: u32 = 1;
const RIM_TYPEMOUSE: u32 = 0;

#[link(name = "user32")]
extern "system" {
    fn RegisterRawInputDevices(
        pRawInputDevices: *const RAWINPUTDEVICE,
        uiNumDevices: u32,
        cbSize: u32,
    ) -> i32;
    fn GetRawInputData(
        hRawInput: isize,
        uiCommand: u32,
        pData: *mut core::ffi::c_void,
        pcbSize: *mut u32,
        cbSizeHeader: u32,
    ) -> u32;
}

fn start_input_thread(app: AppHandle) {
    let state = shared_state();
    if state.running.swap(true, Ordering::SeqCst) {
        return;
    }

    thread::spawn(move || unsafe {
        *state.app_handle.lock().unwrap() = Some(app.clone());

        let class_name: Vec<u16> = "WhisperTypePostConversionRawInput"
            .encode_utf16()
            .chain(Some(0))
            .collect();
        let window_title: Vec<u16> = "WhisperTypePostConversionRawInput"
            .encode_utf16()
            .chain(Some(0))
            .collect();

        let hinstance = GetModuleHandleW(None).ok().unwrap_or_default();
        let wnd_class = WNDCLASSW {
            style: CS_HREDRAW | CS_VREDRAW,
            lpfnWndProc: Some(window_proc),
            hInstance: hinstance.into(),
            lpszClassName: windows::core::PCWSTR(class_name.as_ptr()),
            ..Default::default()
        };
        if RegisterClassW(&wnd_class) == 0 {
            state.running.store(false, Ordering::SeqCst);
            return;
        }

        let hwnd = CreateWindowExW(
            Default::default(),
            windows::core::PCWSTR(class_name.as_ptr()),
            windows::core::PCWSTR(window_title.as_ptr()),
            WS_OVERLAPPED,
            0,
            0,
            0,
            0,
            HWND(null_mut()),
            HMENU(null_mut()),
            hinstance,
            None,
        );
        let hwnd = match hwnd {
            Ok(hwnd) => hwnd,
            Err(_) => {
                state.running.store(false, Ordering::SeqCst);
                return;
            }
        };

        let mouse_hook = match SetWindowsHookExW(WH_MOUSE_LL, Some(low_level_mouse_proc), hinstance, 0) {
            Ok(hook) => Some(hook),
            Err(_) => None,
        };

        let devices = [
            RAWINPUTDEVICE {
                usUsagePage: 0x01,
                usUsage: 0x06,
                dwFlags: RIDEV_INPUTSINK,
                hwndTarget: hwnd,
            },
        ];
        if RegisterRawInputDevices(devices.as_ptr(), devices.len() as u32, size_of::<RAWINPUTDEVICE>() as u32) == 0 {
            let _ = DestroyWindow(hwnd);
            if let Some(hook) = mouse_hook {
                let _ = UnhookWindowsHookEx(hook);
            }
            state.running.store(false, Ordering::SeqCst);
            return;
        }

        let mut message = MSG::default();
        while GetMessageW(&mut message, HWND(null_mut()), 0, 0).into() {
            let _ = TranslateMessage(&message);
            DispatchMessageW(&message);
        }
        let _ = DestroyWindow(hwnd);
        if let Some(hook) = mouse_hook {
            let _ = UnhookWindowsHookEx(hook);
        }
        state.running.store(false, Ordering::SeqCst);
    });
}

unsafe extern "system" fn window_proc(
    hwnd: HWND,
    msg: u32,
    w_param: WPARAM,
    l_param: LPARAM,
) -> LRESULT {
    match msg {
        WM_CREATE => LRESULT(0),
        WM_DESTROY => {
            PostQuitMessage(0);
            LRESULT(0)
        }
        WM_INPUT => {
            handle_raw_input(w_param, l_param);
            LRESULT(0)
        }
        _ => DefWindowProcW(hwnd, msg, w_param, l_param),
    }
}

unsafe fn handle_raw_input(_w_param: WPARAM, l_param: LPARAM) {
    let state = shared_state();
    if state.disabled.load(Ordering::SeqCst) {
        return;
    }

    let mut size = 0u32;
    let _ = GetRawInputData(l_param.0, RID_INPUT, null_mut(), &mut size, size_of::<RAWINPUTHEADER>() as u32);
    if size == 0 {
        return;
    }

    let mut buffer = vec![0u8; size as usize];
    let result = GetRawInputData(
        l_param.0,
        RID_INPUT,
        buffer.as_mut_ptr() as *mut core::ffi::c_void,
        &mut size,
        size_of::<RAWINPUTHEADER>() as u32,
    );
    if result == u32::MAX || result == 0 {
        return;
    }

    let raw = &*(buffer.as_ptr() as *const RAWINPUT);

    match raw.header.dwType {
        RIM_TYPEKEYBOARD => {
            let keyboard = unsafe { raw.data.keyboard };
            let vk = keyboard.VKey as u16;
            match keyboard.Message {
                WM_KEYDOWN | WM_SYSKEYDOWN => {
                    if vk == 0x11 || vk == 0xA2 || vk == 0xA3 {
                        let was_down = state.ctrl_down.swap(true, Ordering::SeqCst);
                        if !was_down {
                            append_log_line("[AI Post Conversion] ctrl_down");
                        }
                    } else if vk == 0x12 || vk == 0xA4 || vk == 0xA5 {
                        let was_down = state.alt_down.swap(true, Ordering::SeqCst);
                        if !was_down {
                            append_log_line("[AI Post Conversion] alt_down");
                        }
                    }
                }
                WM_KEYUP | WM_SYSKEYUP => {
                    if vk == 0x11 || vk == 0xA2 || vk == 0xA3 {
                        let was_down = state.ctrl_down.swap(false, Ordering::SeqCst);
                        if was_down {
                            append_log_line("[AI Post Conversion] ctrl_up");
                        }
                        stop_active_recording_shortcut("raw_ctrl_release");
                        if state.popup_open.load(Ordering::SeqCst) {
                            if let Some(app_handle) = state.app_handle.lock().unwrap().clone() {
                                let _ = crate::post_conversion::popup::window::close_post_conversion_popup(app_handle);
                                reset_on_popup_hide(&state);
                            }
                        }
                    } else if vk == 0x12 || vk == 0xA4 || vk == 0xA5 {
                        let was_down = state.alt_down.swap(false, Ordering::SeqCst);
                        if was_down {
                            append_log_line("[AI Post Conversion] alt_up");
                        }
                        stop_active_recording_shortcut("raw_alt_release");
                    }
                }
                _ => {}
            }
        }
        RIM_TYPEMOUSE => {
            let _mouse = unsafe { raw.data.mouse };
        }
        _ => {}
    }
}

unsafe extern "system" fn low_level_mouse_proc(code: i32, w_param: WPARAM, l_param: LPARAM) -> LRESULT {
    if code == HC_ACTION as i32 {
        let state = shared_state();
        if state.disabled.load(Ordering::SeqCst) {
            return CallNextHookEx(HHOOK::default(), code, w_param, l_param);
        }
        let mouse = *(l_param.0 as *const windows::Win32::UI::WindowsAndMessaging::MSLLHOOKSTRUCT);
        let message = w_param.0 as u32;
        match message {
            WM_LBUTTONDOWN => {
                let was_down = state.left_down.swap(true, Ordering::SeqCst);
                if !was_down {
                    if state.ctrl_down.load(Ordering::SeqCst) {
                        state.selection_pending.store(true, Ordering::SeqCst);
                    }
                }
            }
            WM_LBUTTONUP => {
                let was_down = state.left_down.swap(false, Ordering::SeqCst);
                if was_down {
                    if state.ctrl_down.load(Ordering::SeqCst)
                        && state.selection_pending.swap(false, Ordering::SeqCst)
                        && !state.popup_open.load(Ordering::SeqCst)
                    {
                        if let Some(app_handle) = state.app_handle.lock().unwrap().clone() {
                            let mut cursor = POINT::default();
                            let _ = GetCursorPos(&mut cursor);
                            let _ = crate::post_conversion::popup::window::start_post_conversion_flow_at(
                                app_handle,
                                cursor.x,
                                cursor.y,
                            );
                            state.popup_open.store(true, Ordering::SeqCst);
                        }
                    }
                }
            }
            _ => {}
        }
        let _ = mouse;
    }
    CallNextHookEx(HHOOK::default(), code, w_param, l_param)
}

pub fn start_post_conversion_detection(app: AppHandle) {
    let state = shared_state();
    *state.app_handle.lock().unwrap() = Some(app.clone());
    state.popup_open.store(false, Ordering::SeqCst);
    state.disabled.store(false, Ordering::SeqCst);
    start_input_thread(app);
}
