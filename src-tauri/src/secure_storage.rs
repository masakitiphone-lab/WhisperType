use keyring::Entry;

const SECURE_STORAGE_SERVICE: &str = "WhisperType";
<<<<<<< HEAD
const GROQ_API_KEY: &str = "whispertype.groq.api-key";

fn validate_secure_storage_key(key: &str) -> Result<(), String> {
    if key == GROQ_API_KEY {
=======
const AUTH_STORAGE_KEY: &str = "whispertype.auth.token";

fn validate_secure_storage_key(key: &str) -> Result<(), String> {
    let is_supported_supabase_key =
        key.starts_with("sb-") && key.ends_with("-auth-token") && key.len() <= 96;
    if key == AUTH_STORAGE_KEY || is_supported_supabase_key {
>>>>>>> 76c0a9ef47068d3322c0f3d617003f87660d788a
        Ok(())
    } else {
        Err("forbidden_secure_storage_key".to_string())
    }
}

#[tauri::command]
pub fn secure_storage_get(key: String) -> Result<Option<String>, String> {
    validate_secure_storage_key(&key)?;
    let entry = Entry::new(SECURE_STORAGE_SERVICE, &key).map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(value) => Ok(Some(value)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(error) => Err(error.to_string()),
    }
}

#[tauri::command]
pub fn secure_storage_set(key: String, value: String) -> Result<(), String> {
    validate_secure_storage_key(&key)?;
    let entry = Entry::new(SECURE_STORAGE_SERVICE, &key).map_err(|e| e.to_string())?;
    entry.set_password(&value).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn secure_storage_delete(key: String) -> Result<(), String> {
    validate_secure_storage_key(&key)?;
    let entry = Entry::new(SECURE_STORAGE_SERVICE, &key).map_err(|e| e.to_string())?;
    match entry.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(error) => Err(error.to_string()),
    }
}
