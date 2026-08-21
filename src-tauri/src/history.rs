use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

const HISTORY_MAX_ENTRIES: usize = 500;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryEntry {
    pub id: String,
    pub text: String,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "createdAtMs")]
    pub created_at_ms: i64,
    pub language: String,
    pub model: String,
}

fn history_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    Ok(dir.join("transcription_history.json"))
}

fn read_history_file(app: &AppHandle) -> Result<Vec<HistoryEntry>, String> {
    let path = history_file_path(app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let data = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    if data.trim().is_empty() {
        return Ok(Vec::new());
    }
    serde_json::from_str::<Vec<HistoryEntry>>(&data).map_err(|e| e.to_string())
}

fn write_history_file(app: &AppHandle, entries: &[HistoryEntry]) -> Result<(), String> {
    let path = history_file_path(app)?;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let json = serde_json::to_string(entries).map_err(|e| e.to_string())?;
    std::fs::write(&path, json).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_transcription_history(app: AppHandle) -> Result<Vec<HistoryEntry>, String> {
    read_history_file(&app)
}

#[tauri::command]
pub fn add_transcription_history_entry(
    app: AppHandle,
    entry: HistoryEntry,
) -> Result<Vec<HistoryEntry>, String> {
    if entry.text.trim().is_empty() {
        return Err("empty_text".to_string());
    }
    let mut entries = read_history_file(&app)?;
    // Deduplicate by id if already exists (overwrite)
    entries.retain(|e| e.id != entry.id);
    entries.insert(0, entry);
    if entries.len() > HISTORY_MAX_ENTRIES {
        entries.truncate(HISTORY_MAX_ENTRIES);
    }
    write_history_file(&app, &entries)?;
    Ok(entries)
}

#[tauri::command]
pub fn delete_transcription_history_entry(
    app: AppHandle,
    id: String,
) -> Result<Vec<HistoryEntry>, String> {
    let mut entries = read_history_file(&app)?;
    entries.retain(|e| e.id != id);
    write_history_file(&app, &entries)?;
    Ok(entries)
}

#[tauri::command]
pub fn clear_transcription_history(app: AppHandle) -> Result<Vec<HistoryEntry>, String> {
    write_history_file(&app, &[])?;
    Ok(Vec::new())
}
