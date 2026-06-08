import { invoke } from "@tauri-apps/api/core";
import { getCheckoutProvider, type CheckoutProvider } from "@/lib/checkout";

export type StoreBillingStatus = {
  provider: CheckoutProvider;
  isStoreBuild: boolean;
  isProductConfigured: boolean;
  hasLicense: boolean | null;
};

type CheckoutProviderInfo = {
  provider: string;
  plus_product_configured?: boolean;
};

export async function readStoreBillingStatus(): Promise<StoreBillingStatus> {
  const [provider, providerInfo, isStoreBuild, hasLicense] = await Promise.all([
    getCheckoutProvider(),
    invoke<CheckoutProviderInfo>("get_checkout_provider").catch(() => null),
    invoke<boolean>("is_store_build").catch(() => false),
    invoke<boolean>("check_plus_store_license").catch(() => null),
  ]);

  return {
    provider,
    isStoreBuild,
    isProductConfigured: Boolean(providerInfo?.plus_product_configured),
    hasLicense,
  };
}

export function getStorePurchaseErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("store_product_not_configured")) {
    return "store_product_not_configured";
  }

  if (message.includes("packaged Store build")) {
    return "store_build_required";
  }

  if (message.includes("plus_not_available_on_macos")) {
    return "plus_not_available_on_macos";
  }

  if (message.includes("plus_not_available_on_platform")) {
    return "plus_not_available_on_platform";
  }

  return "store_purchase_failed";
}
