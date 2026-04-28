import { invoke } from "@tauri-apps/api/core";
import { supabase } from "@/lib/supabase";
import { preprocessAudioBlobForTranscription } from "@/lib/audioPreprocess";
import { buildTranscriptionSettingsPayload, readTranscriptionSettings } from "@/lib/transcription";
import { getAudioFileName } from "@/services/audio";

type TranscriptionResponse = {
  text: string;
};

type TranscriptionContext = {
  user_id: string;
  credits: number;
};

const TRANSCRIPTION_REQUEST_TIMEOUT_MS = 15000;
const TRANSCRIPTION_PREFETCH_TTL_MS = 300_000;
const TRANSCRIBE_URL = import.meta.env.VITE_TRANSCRIBE_URL?.trim() || "";

let cachedPrefetch:
  | {
      accessToken: string;
      context: TranscriptionContext;
      cachedAt: number;
    }
  | null = null;

function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

async function logTranscriptionTiming(message: string, meta: Record<string, unknown>) {
  void message;
  void meta;
}

function setPrefetchCache(accessToken: string, context: TranscriptionContext) {
  cachedPrefetch = {
    accessToken,
    context,
    cachedAt: nowMs(),
  };
}

function getPrefetchCache() {
  if (!cachedPrefetch) return null;
  if (nowMs() - cachedPrefetch.cachedAt > TRANSCRIPTION_PREFETCH_TTL_MS) {
    cachedPrefetch = null;
    return null;
  }
  return cachedPrefetch;
}

function getJwtExpiry(accessToken: string): number | null {
  const parts = accessToken.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))) as {
      exp?: unknown;
    };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

function isTokenUsable(accessToken: string | null | undefined, skewSeconds = 60): accessToken is string {
  if (!accessToken || !accessToken.trim()) {
    return false;
  }

  const expiry = getJwtExpiry(accessToken);
  if (expiry === null) {
    return true;
  }

  return expiry > Math.floor(Date.now() / 1000) + skewSeconds;
}

async function getUsableAccessToken() {
  const authStart = nowMs();
  try {
    const cacheLookupStart = nowMs();
    const cachedToken = await invoke<string | null>("get_cached_access_token");
    await logTranscriptionTiming("cached_token_lookup_complete", {
      elapsed_ms: Math.round(nowMs() - cacheLookupStart),
      total_elapsed_ms: Math.round(nowMs() - authStart),
      has_token: !!cachedToken,
    });
    if (isTokenUsable(cachedToken)) {
      await logTranscriptionTiming("access_token_cached_hit", {
        elapsed_ms: Math.round(nowMs() - authStart),
      });
      return cachedToken;
    }
  } catch {
    // ignore cached token lookup failures and fall through
  }

  const {
    data: { session: currentSession },
  } = await supabase.auth.getSession();

  if (isTokenUsable(currentSession?.access_token)) {
    await invoke("set_cached_access_token", { token: currentSession.access_token }).catch(() => undefined);
    return currentSession.access_token;
  }

  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (!error && isTokenUsable(data.session?.access_token)) {
      await invoke("set_cached_access_token", { token: data.session.access_token }).catch(() => undefined);
      return data.session.access_token;
    }
  } catch {
    // ignore refresh failures and fall through to the cached token fallback
  }

  const {
    data: { session: fallbackSession },
  } = await supabase.auth.getSession();
  if (isTokenUsable(fallbackSession?.access_token)) {
    await invoke("set_cached_access_token", { token: fallbackSession.access_token }).catch(() => undefined);
    return fallbackSession.access_token;
  }
  return null;
}

async function getSessionUserId() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user.id ?? null;
}

async function getTranscriptionContext(userId: string): Promise<TranscriptionContext> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, credits")
    .eq("id", userId)
    .single();
  if (error || !data?.id) {
    throw new Error("profile_unavailable");
  }
  return { user_id: data.id, credits: data.credits };
}

export async function prefetchTranscriptionReadiness() {
  try {
    const accessToken = await getUsableAccessToken();
    if (!accessToken) {
      return;
    }
    const userId = await getSessionUserId();
    if (!userId) {
      return;
    }
    const context = await getTranscriptionContext(userId);
    setPrefetchCache(accessToken, context);
  } catch (error) {
    console.warn("prefetch_failed", error instanceof Error ? error.message : String(error));
  }
}


async function invokeTranscriptionRequest(formData: FormData, accessToken: string): Promise<TranscriptionResponse> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "x-whispertype-timings": JSON.stringify({
      hotkey_down_at_ms:
        (globalThis as typeof globalThis & { __whispertype_hotkey_down_at_ms?: number }).__whispertype_hotkey_down_at_ms ?? null,
      hotkey_up_at_ms:
        (globalThis as typeof globalThis & { __whispertype_hotkey_up_at_ms?: number }).__whispertype_hotkey_up_at_ms ?? null,
      recording_stopped_at_ms:
        (globalThis as typeof globalThis & { __whispertype_recording_stopped_at_ms?: number }).__whispertype_recording_stopped_at_ms ?? null,
      overlay_event_at_ms:
        (globalThis as typeof globalThis & { __whispertype_overlay_event_at_ms?: number }).__whispertype_overlay_event_at_ms ?? null,
    }),
  };
  const request = TRANSCRIBE_URL
    ? fetch(TRANSCRIBE_URL, {
        method: "POST",
        headers,
        body: formData,
      }).then(async (response) => {
        const text = await response.text();
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${text || "empty_body"}`);
        }
        try {
          return JSON.parse(text) as TranscriptionResponse;
        } catch {
          throw new Error(`invalid_json_response: ${text || "empty_body"}`);
        }
      })
    : supabase.functions.invoke<TranscriptionResponse>("transcribe", {
        body: formData,
        headers,
      }).then(({ data, error }) => {
        if (error) {
          throw error;
        }
        return data as TranscriptionResponse;
      });
  const timeout = new Promise<never>((_, reject) => {
    window.setTimeout(() => reject(new Error("transcription_timeout")), TRANSCRIPTION_REQUEST_TIMEOUT_MS);
  });

  const data = await Promise.race([request, timeout]) as TranscriptionResponse;

  if (!data?.text) {
    throw new Error("empty_transcription");
  }

  return data;
}

async function persistTranscriptionResult(text: string) {
  void text;
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  if (audioBlob.size === 0) {
    throw new Error("silent_audio");
  }

  const totalStart = nowMs();
  (globalThis as typeof globalThis & { __whispertype_hotkey_down_at_ms?: number; __whispertype_hotkey_up_at_ms?: number; __whispertype_recording_stopped_at_ms?: number; __whispertype_overlay_event_at_ms?: number }).__whispertype_hotkey_up_at_ms ??= totalStart;
  const processedBlob = await preprocessAudioBlobForTranscription(audioBlob);
  if (processedBlob.size === 0) {
    throw new Error("silent_audio");
  }
  let cachedPrefetchState = getPrefetchCache();
  if (!cachedPrefetchState) {
    const accessToken = await getUsableAccessToken();
    if (!accessToken) {
      throw new Error("auth_required");
    }
    const userId = await getSessionUserId();
    if (!userId) {
      throw new Error("auth_required");
    }
    const context = await getTranscriptionContext(userId);
    cachedPrefetchState = { accessToken, context, cachedAt: nowMs() };
    setPrefetchCache(accessToken, context);
  } else {
  }

  const accessToken = cachedPrefetchState.accessToken;

  const file = new File([processedBlob], getAudioFileName(processedBlob), {
    type: processedBlob.type || "audio/webm",
  });
  const transcriptionSettings = readTranscriptionSettings();
  const formData = new FormData();
  formData.append("file", file);

  const payload = buildTranscriptionSettingsPayload(transcriptionSettings);
  if (payload.language !== "auto") {
    formData.append("language", payload.language);
  }
  formData.append("model", payload.model);
  if (payload.prompt.trim()) {
    formData.append("prompt", payload.prompt.trim());
  }

  try {
    const data = await invokeTranscriptionRequest(formData, accessToken);
    const text = data.text.trim();
    if (!text) {
      throw new Error("empty_transcription");
    }
    void persistTranscriptionResult(text);
    return text;
  } catch (error) {
    const errorCode = error instanceof Error ? error.message : "transcription_failed";

    if (errorCode === "silent_audio") {
      throw new Error(errorCode);
    }

    if (errorCode === "transcription_failed" || errorCode === "provider_unavailable") {
      const retryData = await invokeTranscriptionRequest(formData, accessToken);
      const retryText = retryData.text.trim();
      if (!retryText) {
        throw new Error("empty_transcription");
      }
      void persistTranscriptionResult(retryText);
      return retryText;
    }

    console.error(errorCode);
    throw new Error(errorCode);
  }
}
