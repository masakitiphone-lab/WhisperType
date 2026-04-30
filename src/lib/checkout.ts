import { invoke } from "@tauri-apps/api/core";

export type CheckoutProvider = "stripe" | "ms-store";

let cachedProvider: CheckoutProvider | null = null;

export async function getCheckoutProvider(): Promise<CheckoutProvider> {
  if (cachedProvider) return cachedProvider;
  try {
    const info = await invoke<{ provider: string }>("get_checkout_provider");
    const provider = info.provider === "ms-store" ? "ms-store" : "stripe";
    cachedProvider = provider;
    return provider;
  } catch {
    return "stripe";
  }
}

export async function isMicrosoftStoreBuild(): Promise<boolean> {
  const provider = await getCheckoutProvider();
  return provider === "ms-store";
}
