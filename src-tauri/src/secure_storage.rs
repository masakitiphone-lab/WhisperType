use crate::shared::log::append_log_line;

const SECURE_STORAGE_SERVICE: &str = "WhisperType";
const GROQ_API_KEY: &str = "whispertype.groq.api-key";

fn validate_secure_storage_key(key: &str) -> Result<(), String> {
    if key == GROQ_API_KEY {
        Ok(())
    } else {
        Err("forbidden_secure_storage_key".to_string())
    }
}

#[cfg(target_os = "windows")]
fn windows_target_name(key: &str) -> String {
    format!("{SECURE_STORAGE_SERVICE}:{key}")
}

// The previous keyring-based implementation (keyring 3.x) stored Windows
// credentials under the target name `"<user>.<service>"`. The blob format is
// the same UTF-16LE bytes we use today, so legacy entries can be read and
// migrated without user action.
#[cfg(target_os = "windows")]
fn legacy_windows_target_name(key: &str) -> String {
    format!("{key}.{SECURE_STORAGE_SERVICE}")
}

#[cfg(target_os = "windows")]
fn windows_credential_get(target: &str) -> Result<Option<String>, String> {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    use windows::core::PCWSTR;
    use windows::Win32::Foundation::{GetLastError, ERROR_NOT_FOUND};
    use windows::Win32::Security::Credentials::{
        CredFree, CredReadW, CREDENTIALW, CRED_TYPE_GENERIC,
    };

    let target_wide: Vec<u16> = OsStr::new(target).encode_wide().chain(Some(0)).collect();
    let mut cred_ptr: *mut CREDENTIALW = std::ptr::null_mut();

    let ok = unsafe { CredReadW(PCWSTR(target_wide.as_ptr()), CRED_TYPE_GENERIC, 0, &mut cred_ptr) };
    if ok.is_err() {
        let error = unsafe { GetLastError() };
        if error == ERROR_NOT_FOUND {
            return Ok(None);
        }
        return Err(format!("CredReadW failed: {}", error.0));
    }

    let result = (|| {
        let cred = unsafe { &*cred_ptr };
        if cred.CredentialBlob.is_null() || cred.CredentialBlobSize == 0 {
            return Ok(None);
        }
        let size = cred.CredentialBlobSize as usize;
        let bytes = unsafe { std::slice::from_raw_parts(cred.CredentialBlob as *const u8, size) };
        // The stored blob is the UTF-16 bytes of the value (see set).
        let value = String::from_utf16(
            bytes
                .chunks_exact(2)
                .map(|c| u16::from_le_bytes([c[0], c[1]]))
                .collect::<Vec<u16>>()
                .as_slice(),
        )
        .map_err(|e| e.to_string())?;
        Ok(Some(value))
    })();

    unsafe { CredFree(cred_ptr as *const _) };
    result
}

#[cfg(target_os = "windows")]
fn windows_credential_set(target: &str, value: &str) -> Result<(), String> {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    use windows::core::PWSTR;
    use windows::Win32::Foundation::GetLastError;
    use windows::Win32::Security::Credentials::{
        CredWriteW, CREDENTIALW, CRED_FLAGS, CRED_PERSIST_LOCAL_MACHINE, CRED_TYPE_GENERIC,
    };

    let target_wide: Vec<u16> = OsStr::new(target).encode_wide().chain(Some(0)).collect();
    // Store the value as UTF-16LE bytes.
    let value_utf16: Vec<u16> = value.encode_utf16().collect();
    let blob_bytes: Vec<u8> = value_utf16
        .iter()
        .flat_map(|c| c.to_le_bytes())
        .collect();

    let mut cred = CREDENTIALW {
        Flags: CRED_FLAGS(0),
        Type: CRED_TYPE_GENERIC,
        TargetName: PWSTR(target_wide.as_ptr() as *mut u16),
        Comment: PWSTR::null(),
        LastWritten: Default::default(),
        CredentialBlobSize: blob_bytes.len() as u32,
        CredentialBlob: blob_bytes.as_ptr() as *mut u8,
        Persist: CRED_PERSIST_LOCAL_MACHINE,
        AttributeCount: 0,
        Attributes: std::ptr::null_mut(),
        TargetAlias: PWSTR::null(),
        UserName: PWSTR::null(),
    };

    let ok = unsafe { CredWriteW(&mut cred, 0) };
    if ok.is_err() {
        return Err(format!("CredWriteW failed: {}", unsafe { GetLastError().0 }));
    }
    Ok(())
}

#[cfg(target_os = "windows")]
fn windows_credential_delete(target: &str) -> Result<(), String> {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    use windows::core::PCWSTR;
    use windows::Win32::Foundation::{GetLastError, ERROR_NOT_FOUND};
    use windows::Win32::Security::Credentials::{CredDeleteW, CRED_TYPE_GENERIC};

    let target_wide: Vec<u16> = OsStr::new(target).encode_wide().chain(Some(0)).collect();
    let ok = unsafe { CredDeleteW(PCWSTR(target_wide.as_ptr()), CRED_TYPE_GENERIC, 0) };
    if ok.is_err() {
        let error = unsafe { GetLastError() };
        if error == ERROR_NOT_FOUND {
            return Ok(());
        }
        return Err(format!("CredDeleteW failed: {}", error.0));
    }
    Ok(())
}

#[tauri::command]
pub fn secure_storage_get(key: String) -> Result<Option<String>, String> {
    validate_secure_storage_key(&key)?;

    #[cfg(target_os = "windows")]
    {
        let target = windows_target_name(&key);
        append_log_line(&format!("[SecureStorage] get target={}", target));
        if let Some(value) = windows_credential_get(&target)? {
            return Ok(Some(value));
        }

        // Migrate credentials stored under the old keyring target name so
        // users keep their saved API key after upgrading.
        let legacy_target = legacy_windows_target_name(&key);
        if let Some(value) = windows_credential_get(&legacy_target)? {
            append_log_line(&format!(
                "[SecureStorage] migrating legacy entry from {}",
                legacy_target
            ));
            let _ = windows_credential_set(&target, &value);
            let _ = windows_credential_delete(&legacy_target);
            return Ok(Some(value));
        }
        return Ok(None);
    }

    #[cfg(not(target_os = "windows"))]
    {
        use keyring::Entry;
        let entry = Entry::new(SECURE_STORAGE_SERVICE, &key).map_err(|e| e.to_string())?;
        match entry.get_password() {
            Ok(value) => {
                append_log_line("[SecureStorage] get: found");
                Ok(Some(value))
            }
            Err(keyring::Error::NoEntry) => {
                append_log_line("[SecureStorage] get: no entry");
                Ok(None)
            }
            Err(error) => {
                append_log_line(&format!("[SecureStorage] get error: {}", error));
                Err(error.to_string())
            }
        }
    }
}

#[tauri::command]
pub fn secure_storage_set(key: String, value: String) -> Result<(), String> {
    validate_secure_storage_key(&key)?;
    append_log_line(&format!(
        "[SecureStorage] set key={} value_len={}",
        key,
        value.len()
    ));

    #[cfg(target_os = "windows")]
    {
        let target = windows_target_name(&key);
        append_log_line(&format!("[SecureStorage] set target={}", target));
        let result = windows_credential_set(&target, &value);
        match &result {
            Ok(()) => append_log_line("[SecureStorage] set OK"),
            Err(error) => append_log_line(&format!("[SecureStorage] set error: {}", error)),
        }
        return result;
    }

    #[cfg(not(target_os = "windows"))]
    {
        use keyring::Entry;
        let entry = Entry::new(SECURE_STORAGE_SERVICE, &key).map_err(|e| e.to_string())?;
        let result = entry.set_password(&value);
        match &result {
            Ok(()) => append_log_line("[SecureStorage] set OK"),
            Err(error) => append_log_line(&format!("[SecureStorage] set error: {}", error)),
        }
        result.map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub fn secure_storage_delete(key: String) -> Result<(), String> {
    validate_secure_storage_key(&key)?;

    #[cfg(target_os = "windows")]
    {
        let target = windows_target_name(&key);
        append_log_line(&format!("[SecureStorage] delete target={}", target));
        let _ = windows_credential_delete(&legacy_windows_target_name(&key));
        return windows_credential_delete(&target);
    }

    #[cfg(not(target_os = "windows"))]
    {
        use keyring::Entry;
        let entry = Entry::new(SECURE_STORAGE_SERVICE, &key).map_err(|e| e.to_string())?;
        match entry.delete_credential() {
            Ok(()) => Ok(()),
            Err(keyring::Error::NoEntry) => Ok(()),
            Err(error) => Err(error.to_string()),
        }
    }
}
