#[allow(non_camel_case_types)]
pub(super) type CFMachPortRef = *mut std::ffi::c_void;

#[allow(non_camel_case_types)]
pub(super) type CFRunLoopSourceRef = *mut std::ffi::c_void;

#[allow(non_camel_case_types)]
pub(super) type CFRunLoopRef = *mut std::ffi::c_void;

#[allow(non_camel_case_types)]
pub(super) type CFStringRef = *const std::ffi::c_void;

#[allow(non_camel_case_types)]
pub(super) type CGEventTapProxy = *mut std::ffi::c_void;

#[allow(non_camel_case_types)]
pub(super) type CGEventRef = *mut std::ffi::c_void;

pub(super) type CGEventType = u32;

pub(super) const KCG_SESSION_EVENT_TAP: u32 = 1;
pub(super) const KCG_HEAD_INSERT_EVENT_TAP: u32 = 0;
pub(super) const KCG_EVENT_TAP_OPTION_LISTEN_ONLY: u32 = 1;
pub(super) const KCG_EVENT_KEY_DOWN: u32 = 10;
pub(super) const KCG_EVENT_KEY_UP: u32 = 11;
pub(super) const KCG_EVENT_FLAGS_CHANGED: u32 = 12;
pub(super) const KCG_EVENT_LEFT_MOUSE_DOWN: u32 = 1;
pub(super) const KCG_EVENT_LEFT_MOUSE_UP: u32 = 2;
pub(super) const KCG_EVENT_RIGHT_MOUSE_DOWN: u32 = 3;
pub(super) const KCG_EVENT_RIGHT_MOUSE_UP: u32 = 4;
pub(super) const KCG_EVENT_OTHER_MOUSE_DOWN: u32 = 25;
pub(super) const KCG_EVENT_OTHER_MOUSE_UP: u32 = 26;
pub(super) const KCG_EVENT_MASK_KEY_DOWN: u64 = 1_u64 << KCG_EVENT_KEY_DOWN;
pub(super) const KCG_EVENT_MASK_KEY_UP: u64 = 1_u64 << KCG_EVENT_KEY_UP;
pub(super) const KCG_EVENT_MASK_FLAGS_CHANGED: u64 = 1_u64 << KCG_EVENT_FLAGS_CHANGED;
pub(super) const KCG_EVENT_MASK_LEFT_MOUSE_DOWN: u64 = 1_u64 << KCG_EVENT_LEFT_MOUSE_DOWN;
pub(super) const KCG_EVENT_MASK_LEFT_MOUSE_UP: u64 = 1_u64 << KCG_EVENT_LEFT_MOUSE_UP;
pub(super) const KCG_EVENT_MASK_RIGHT_MOUSE_DOWN: u64 = 1_u64 << KCG_EVENT_RIGHT_MOUSE_DOWN;
pub(super) const KCG_EVENT_MASK_RIGHT_MOUSE_UP: u64 = 1_u64 << KCG_EVENT_RIGHT_MOUSE_UP;
pub(super) const KCG_EVENT_MASK_OTHER_MOUSE_DOWN: u64 = 1_u64 << KCG_EVENT_OTHER_MOUSE_DOWN;
pub(super) const KCG_EVENT_MASK_OTHER_MOUSE_UP: u64 = 1_u64 << KCG_EVENT_OTHER_MOUSE_UP;
pub(super) const KCG_KEYBOARD_EVENT_KEYCODE_FIELD: u32 = 9;
pub(super) const KCG_MOUSE_EVENT_BUTTON_NUMBER_FIELD: u32 = 3;

unsafe extern "C" {
    pub(super) fn CGEventTapCreate(
        tap: u32,
        place: u32,
        options: u32,
        events_of_interest: u64,
        callback: *const std::ffi::c_void,
        user_info: *mut std::ffi::c_void,
    ) -> CFMachPortRef;
    pub(super) fn CFMachPortCreateRunLoopSource(
        allocator: *const std::ffi::c_void,
        port: CFMachPortRef,
        order: isize,
    ) -> CFRunLoopSourceRef;
    pub(super) fn CFMachPortInvalidate(port: CFMachPortRef);
    pub(super) fn CGEventTapEnable(tap: CFMachPortRef, enable: bool);
    pub(super) fn CGEventGetFlags(event: CGEventRef) -> u64;
    pub(super) fn CGEventGetIntegerValueField(event: CGEventRef, field: u32) -> i64;
    pub(super) fn CFRelease(cf: *const std::ffi::c_void);
    pub(super) fn CFRunLoopGetCurrent() -> CFRunLoopRef;
    pub(super) fn CFRunLoopAddSource(
        run_loop: CFRunLoopRef,
        source: CFRunLoopSourceRef,
        mode: CFStringRef,
    );
    pub(super) fn CFRunLoopRun();
    pub(super) fn CFRunLoopStop(run_loop: CFRunLoopRef);
    pub(super) fn CFRunLoopWakeUp(run_loop: CFRunLoopRef);
    pub(super) fn CFRunLoopSourceInvalidate(source: CFRunLoopSourceRef);
    pub(super) static kCFRunLoopCommonModes: CFStringRef;
}
