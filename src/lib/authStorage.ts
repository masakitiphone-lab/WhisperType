import { invoke } from "@tauri-apps/api/core";

const AUTH_STORAGE_KEY = "whispertype.auth.token";

function getLegacyStorageKeys() {
  const keys = [AUTH_STORAGE_KEY];

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl) {
      const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
      if (projectRef) {
        keys.push(`sb-${projectRef}-auth-token`);
      }
    }
  } catch {
    // ignore malformed env during local setup
  }

  return Array.from(new Set(keys));
}

async function secureGet(key: string): Promise<string | null> {
  try {
    return (await invoke<string | null>("secure_storage_get", { key })) ?? null;
  } catch {
    return null;
  }
}

async function secureSet(key: string, value: string): Promise<boolean> {
  try {
    await invoke("secure_storage_set", { key, value });
    return true;
  } catch {
    return false;
  }
}

async function secureDelete(key: string): Promise<boolean> {
  try {
    await invoke("secure_storage_delete", { key });
    return true;
  } catch {
    return false;
  }
}

function browserGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function browserSet(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore storage errors in browser fallback
  }
}

function browserDelete(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore storage errors in browser fallback
  }
}

async function migrateLegacySessionIntoSecureStorage(targetKey: string) {
  for (const legacyKey of getLegacyStorageKeys()) {
    const value = browserGet(legacyKey);
    if (!value) continue;

    const stored = await secureSet(targetKey, value);
    if (stored) {
      for (const cleanupKey of getLegacyStorageKeys()) {
        browserDelete(cleanupKey);
      }
      return value;
    }
  }

  return null;
}

export const authStorageKey = AUTH_STORAGE_KEY;

export const browserAuthStorage = {
  getItem(key: string) {
    return browserGet(key);
  },
  setItem(key: string, value: string) {
    browserSet(key, value);
  },
  removeItem(key: string) {
    browserDelete(key);
  },
};

export const authStorage = {
  async getItem(key: string): Promise<string | null> {
    const secureValue = await secureGet(key);
    if (secureValue !== null) {
      return secureValue;
    }

    const migrated = await migrateLegacySessionIntoSecureStorage(key);
    if (migrated !== null) {
      return migrated;
    }

    return browserGet(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    const stored = await secureSet(key, value);
    browserSet(key, value);

    if (!stored) {
      return;
    }

    for (const legacyKey of getLegacyStorageKeys()) {
      if (legacyKey !== key) {
        browserDelete(legacyKey);
      }
    }
  },

  async removeItem(key: string): Promise<void> {
    const deleted = await secureDelete(key);
    if (!deleted) {
      browserDelete(key);
    }

    for (const legacyKey of getLegacyStorageKeys()) {
      browserDelete(legacyKey);
    }
  },
};


type StoredAuthSession = {
  access_token?: string;
  refresh_token?: string;
  currentSession?: {
    access_token?: string;
    refresh_token?: string;
  } | null;
};

function extractStoredSessionTokens(parsed: StoredAuthSession | null | undefined) {
  const directAccessToken = parsed?.access_token;
  const directRefreshToken = parsed?.refresh_token;
  if (typeof directAccessToken === "string" && directAccessToken && typeof directRefreshToken === "string" && directRefreshToken) {
    return {
      access_token: directAccessToken,
      refresh_token: directRefreshToken,
    };
  }

  const nestedAccessToken = parsed?.currentSession?.access_token;
  const nestedRefreshToken = parsed?.currentSession?.refresh_token;
  if (typeof nestedAccessToken === "string" && nestedAccessToken && typeof nestedRefreshToken === "string" && nestedRefreshToken) {
    return {
      access_token: nestedAccessToken,
      refresh_token: nestedRefreshToken,
    };
  }

  return null;
}

export async function readStoredAuthSessionSnapshot(): Promise<{ access_token: string; refresh_token: string } | null> {
  const raw = await authStorage.getItem(authStorageKey);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredAuthSession;
    return extractStoredSessionTokens(parsed);
  } catch {
    // ignore malformed storage payloads
  }

  return null;
}
