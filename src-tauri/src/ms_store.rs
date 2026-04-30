/// Microsoft Store IAP abstraction for WhisperType Plus.
///
/// To enable real Store purchases, uncomment the `Services_Store` feature in
/// Cargo.toml and implement the WinRT calls below.
///
/// For now this module returns a safe fallback so the app compiles and runs
/// whether it is distributed via the Microsoft Store or as a standalone
/// installer.

const CHECKOUT_PROVIDER: &str = "stripe"; // Change to "ms-store" for Store builds

#[derive(Clone, serde::Serialize)]
pub struct CheckoutProviderInfo {
    provider: String,
}

#[tauri::command]
pub fn get_checkout_provider() -> Result<CheckoutProviderInfo, String> {
    Ok(CheckoutProviderInfo {
        provider: CHECKOUT_PROVIDER.to_string(),
    })
}

/// Initiates purchase of the Plus add-on through the Microsoft Store.
/// Returns `true` if the purchase succeeded.
#[tauri::command]
pub async fn purchase_plus_via_store() -> Result<bool, String> {
    // TODO: Implement WinRT StoreContext flow when CHECKOUT_PROVIDER == "ms-store".
    // Example (requires `windows::Services::Store`):
    //
    // let context = StoreContext::GetDefault().map_err(|e| e.to_string())?;
    // let result = context
    //     .RequestPurchaseAsync("whispertype_plus")
    //     .map_err(|e| e.to_string())?
    //     .await
    //     .map_err(|e| e.to_string())?;
    // Ok(result.Status().unwrap() == StorePurchaseStatus::Succeeded)
    //
    // For standalone builds, return an error directing the user to Stripe.
    Err("Microsoft Store purchase is not available in this build.".to_string())
}

/// Checks whether the current user owns the Plus add-on.
#[tauri::command]
pub async fn check_plus_store_license() -> Result<bool, String> {
    // TODO: Query StoreContext.GetAppLicenseAsync() and inspect AddOnLicenses.
    Ok(false)
}
