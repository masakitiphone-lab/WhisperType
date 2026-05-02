import { invoke } from "@tauri-apps/api/core";

let cachedLicense: boolean | null = null;
let cachedAt = 0;

const STORE_LICENSE_TTL_MS = 15_000;

export async function hasLocalPlusLicense(forceRefresh = false): Promise<boolean> {
  const now = Date.now();
  if (!forceRefresh && cachedLicense !== null && now - cachedAt < STORE_LICENSE_TTL_MS) {
    return cachedLicense;
  }

  try {
    const next = await invoke<boolean>("check_plus_store_license");
    cachedLicense = next;
    cachedAt = now;
    return next;
  } catch {
    cachedLicense = false;
    cachedAt = now;
    return false;
  }
}
