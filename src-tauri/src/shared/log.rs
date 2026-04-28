use std::sync::{Mutex, OnceLock};

pub fn append_log_line(message: &str) {
    let lock = LOG_LOCK.get_or_init(|| Mutex::new(()));
    let _guard = lock.lock().ok();
    println!("{}", message);
}

static LOG_LOCK: OnceLock<Mutex<()>> = OnceLock::new();
