import { invoke } from "@tauri-apps/api/core";

export type CheckoutProvider = "ms-store" | "macos-direct" | "unknown";

let cachedProvider: CheckoutProvider | null = null;

export async function getCheckoutProvider(): Promise<CheckoutProvider> {
  if (cachedProvider) return cachedProvider;
  try {
    const info = await invoke<{ provider: string }>("get_checkout_provider");
    const provider: CheckoutProvider =
      info.provider === "ms-store" ? "ms-store" :
      info.provider === "macos-direct" ? "macos-direct" :
      "unknown";
    cachedProvider = provider;
    return provider;
  } catch {
    return "unknown";
  }
}

export async function isMicrosoftStoreBuild(): Promise<boolean> {
  try {
    return await invoke<boolean>("is_store_build");
  } catch {
    return false;
  }
}
