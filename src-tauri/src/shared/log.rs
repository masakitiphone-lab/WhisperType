use std::sync::{Mutex, OnceLock};

const MAX_LOG_LINES: usize = 80;

static RECENT_LOGS: OnceLock<Mutex<Vec<String>>> = OnceLock::new();

pub fn append_log_line(message: &str) {
    let recent_logs = RECENT_LOGS.get_or_init(|| Mutex::new(Vec::new()));
    if let Ok(mut logs) = recent_logs.lock() {
        logs.push(message.to_string());
        if logs.len() > MAX_LOG_LINES {
            let excess = logs.len() - MAX_LOG_LINES;
            logs.drain(0..excess);
        }
    }

    if cfg!(debug_assertions) {
        let lock = LOG_LOCK.get_or_init(|| Mutex::new(()));
        let _guard = lock.lock().ok();
        println!("{}", message);
    }
}

pub fn recent_log_lines() -> Vec<String> {
    RECENT_LOGS
        .get_or_init(|| Mutex::new(Vec::new()))
        .lock()
        .map(|logs| logs.clone())
        .unwrap_or_default()
}

pub fn clear_recent_log_lines() {
    if let Ok(mut logs) = RECENT_LOGS.get_or_init(|| Mutex::new(Vec::new())).lock() {
        logs.clear();
    }
}

static LOG_LOCK: OnceLock<Mutex<()>> = OnceLock::new();
