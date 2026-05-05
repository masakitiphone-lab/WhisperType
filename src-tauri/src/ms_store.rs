use serde::Serialize;

const CHECKOUT_PROVIDER: &str = "ms-store";
const PLUS_STORE_PRODUCT_ID: Option<&str> = option_env!("WHISPERTYPE_PLUS_STORE_ID");

#[derive(Clone, Serialize)]
pub struct CheckoutProviderInfo {
    provider: String,
    plus_product_configured: bool,
}

#[tauri::command]
pub fn get_checkout_provider() -> Result<CheckoutProviderInfo, String> {
    Ok(CheckoutProviderInfo {
        provider: CHECKOUT_PROVIDER.to_string(),
        plus_product_configured: PLUS_STORE_PRODUCT_ID
            .map(|value| !value.trim().is_empty())
            .unwrap_or(false),
    })
}

#[tauri::command]
pub fn is_store_build() -> Result<bool, String> {
    store_impl::is_store_build()
}

#[tauri::command]
pub async fn purchase_plus_via_store(_window: tauri::WebviewWindow) -> Result<bool, String> {
    store_impl::purchase_plus_via_store().await
}

#[tauri::command]
pub async fn check_plus_store_license() -> Result<bool, String> {
    store_impl::check_plus_store_license().await
}

#[cfg(target_os = "windows")]
mod store_impl {
    use super::PLUS_STORE_PRODUCT_ID;
    use windows::{
        Win32::{
            Foundation::WIN32_ERROR,
            Storage::Packaging::Appx::GetCurrentPackageFullName,
        },
        core::PWSTR,
    };

    pub fn is_store_build() -> Result<bool, String> {
        let mut length = 0u32;
        let result = unsafe { GetCurrentPackageFullName(&mut length, PWSTR::null()) };

        const APPMODEL_ERROR_NO_PACKAGE: WIN32_ERROR = WIN32_ERROR(15700);

        if result == APPMODEL_ERROR_NO_PACKAGE {
            return Ok(false);
        }

        if result == WIN32_ERROR(0) || length > 0 {
            return Ok(true);
        }

        Err(format!("GetCurrentPackageFullName failed with status {:?}", result))
    }

    pub async fn purchase_plus_via_store() -> Result<bool, String> {
        if !is_store_build()? {
            return Err("Microsoft Store purchases require a packaged Store build.".to_string());
        }

        let product_id = PLUS_STORE_PRODUCT_ID
            .filter(|value| !value.trim().is_empty())
            .ok_or_else(|| {
                "store_product_not_configured: set WHISPERTYPE_PLUS_STORE_ID after creating the Microsoft Store subscription add-on."
                    .to_string()
            })?;

        let _ = product_id;
        Err(
            "store_purchase_not_wired: Windows.Services.Store RequestPurchaseAsync wiring is pending."
                .to_string(),
        )
    }

    pub async fn check_plus_store_license() -> Result<bool, String> {
        Ok(false)
    }
}

#[cfg(not(target_os = "windows"))]
mod store_impl {
    pub fn is_store_build() -> Result<bool, String> {
        Ok(false)
    }

    pub async fn purchase_plus_via_store() -> Result<bool, String> {
        Err("Microsoft Store purchase is only available on Windows.".to_string())
    }

    pub async fn check_plus_store_license() -> Result<bool, String> {
        Ok(false)
    }
}
