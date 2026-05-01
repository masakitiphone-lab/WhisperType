import { invoke } from "@tauri-apps/api/core";

export type CheckoutProvider = "ms-store";

let cachedProvider: CheckoutProvider | null = null;

export async function getCheckoutProvider(): Promise<CheckoutProvider> {
  if (cachedProvider) return cachedProvider;
  try {
    const info = await invoke<{ provider: string }>("get_checkout_provider");
    const provider: CheckoutProvider = info.provider === "ms-store" ? "ms-store" : "ms-store";
    cachedProvider = provider;
    return provider;
  } catch {
    return "ms-store";
  }
}

export async function isMicrosoftStoreBuild(): Promise<boolean> {
  const provider = await getCheckoutProvider();
  return provider === "ms-store";
}
