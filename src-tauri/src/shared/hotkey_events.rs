use tauri::{AppHandle, Emitter};

pub fn emit_recording_started(app: &AppHandle) {
    let _ = app.emit("recording-started", ());
}

pub fn emit_transcription_prefetch(app: &AppHandle) {
    let _ = app.emit("transcription-prefetch", ());
}

pub fn emit_recording_stopped(app: &AppHandle) {
    let _ = app.emit("recording-stopped", ());
}

pub fn emit_transcription_started(app: &AppHandle) {
    let _ = app.emit("transcription-started", ());
}

pub fn emit_transcription_finished(app: &AppHandle) {
    let _ = app.emit("transcription-finished", ());
}

pub fn emit_recording_failed(app: &AppHandle) {
    let _ = app.emit("recording-failed", ());
}
