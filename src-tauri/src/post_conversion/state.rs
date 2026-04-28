use std::{
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex, OnceLock,
    },
};

use tauri::AppHandle;

#[derive(Default)]
pub struct PostConversionState {
    pub app_handle: Mutex<Option<AppHandle>>,
    pub ctrl_down: AtomicBool,
    pub alt_down: AtomicBool,
    pub left_down: AtomicBool,
    pub selection_pending: AtomicBool,
    pub popup_open: AtomicBool,
    pub disabled: AtomicBool,
    pub running: AtomicBool,
}

static POST_CONVERSION_STATE: OnceLock<Arc<PostConversionState>> = OnceLock::new();

pub fn shared_state() -> Arc<PostConversionState> {
    POST_CONVERSION_STATE
        .get_or_init(|| Arc::new(PostConversionState::default()))
        .clone()
}

pub fn reset_on_popup_hide(state: &PostConversionState) {
    state.popup_open.store(false, Ordering::SeqCst);
    state.left_down.store(false, Ordering::SeqCst);
    state.selection_pending.store(false, Ordering::SeqCst);
}
