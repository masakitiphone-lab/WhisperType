import { invoke } from "@tauri-apps/api/core";
import { supabase } from "@/lib/supabase";
import { preprocessAudioBlobForTranscription } from "@/lib/audioPreprocess";
import { readStoredAuthSessionSnapshot } from "@/lib/authStorage";
import { buildTranscriptionSettingsPayload, readTranscriptionSettings } from "@/lib/transcription";
import { getAudioFileName } from "@/services/audio";

type TranscriptionResponse = {
  text: string;
  remaining_credits?: number;
};

export type TranscriptionRequestStartInfo = {
  byteSize: number;
  durationMs: number | null;
};

type TranscriptionLifecycle = {
  onRequestStart?: (info: TranscriptionRequestStartInfo) => void;
};

type TranscriptionContext = {
  user_id: string;
  daily_credits: number;
  bonus_credits: number;
  available_credits: number | null;
  plan: "free" | "plus";
  is_unlimited: boolean;
};

const TRANSCRIPTION_REQUEST_TIMEOUT_MS = 15000;
const TRANSCRIPTION_PREFETCH_TTL_MS = 300_000;
const TRANSCRIBE_URL = import.meta.env.VITE_TRANSCRIBE_URL?.trim() || "";
const SUPABASE_REST_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${String(import.meta.env.VITE_SUPABASE_URL).replace(/\/+$/, "")}/rest/v1`
  : "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || "";

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

function hasAvailableTranscriptionCredit(context: TranscriptionContext) {
  return context.is_unlimited || (context.available_credits ?? 0) > 0;
}

async function readFreshTranscriptionReadiness() {
  const accessToken = await getUsableAccessToken();
  const userId = await getSessionUserId(accessToken);
  if (!userId) {
    throw new Error("auth_required: no authenticated user id");
  }
  const context = await getTranscriptionContext(userId, accessToken);
  setPrefetchCache(accessToken, context);
  return { accessToken, context, cachedAt: nowMs() };
}

export async function assertTranscriptionCanStart() {
  const readiness = await readFreshTranscriptionReadiness();
  if (!hasAvailableTranscriptionCredit(readiness.context)) {
    cachedPrefetch = null;
    throw new Error("insufficient_credits");
  }
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

function getJwtSubject(accessToken: string): string | null {
  const parts = accessToken.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))) as {
      sub?: unknown;
    };
    return typeof payload.sub === "string" && payload.sub.trim() ? payload.sub : null;
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
  let authFailureReason: string | null = null;

  try {
    const cachedToken = await invoke<string | null>("get_cached_access_token");
    if (isTokenUsable(cachedToken)) {
      return cachedToken;
    }
  } catch {
  }

  let {
    data: { session: currentSession },
  } = await supabase.auth.getSession();

  if (!currentSession) {
    const storedSession = await readStoredAuthSessionSnapshot();
    if (storedSession?.access_token && storedSession.refresh_token) {
      const { data, error } = await supabase.auth.setSession({
        access_token: storedSession.access_token,
        refresh_token: storedSession.refresh_token,
      });
      if (error) {
        authFailureReason = error.message;
      } else {
        currentSession = data.session;
      }
    }
  }

  if (isTokenUsable(currentSession?.access_token)) {
    await invoke("set_cached_access_token", { token: currentSession.access_token }).catch((err) =>
      console.error("Failed to cache access token:", err)
    );
    return currentSession.access_token;
  }

  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      authFailureReason = error.message;
    }
    if (!error && isTokenUsable(data.session?.access_token)) {
      await invoke("set_cached_access_token", { token: data.session.access_token }).catch((err) =>
        console.error("Failed to cache refreshed token:", err)
      );
      return data.session.access_token;
    }
  } catch (error) {
    authFailureReason = error instanceof Error ? error.message : String(error);
  }

  const {
    data: { session: fallbackSession },
  } = await supabase.auth.getSession();
  if (isTokenUsable(fallbackSession?.access_token)) {
    await invoke("set_cached_access_token", { token: fallbackSession.access_token }).catch((err) =>
      console.error("Failed to cache fallback token:", err)
    );
    return fallbackSession.access_token;
  }
  throw new Error(`auth_required: ${authFailureReason || "no usable access token"}`);
}

async function getSessionUserId(accessToken?: string) {
  const tokenUserId = accessToken ? getJwtSubject(accessToken) : null;
  if (tokenUserId) {
    return tokenUserId;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user.id ?? null;
}

async function getTranscriptionContext(userId: string, accessToken: string): Promise<TranscriptionContext> {
  if (!SUPABASE_REST_URL || !SUPABASE_ANON_KEY) {
    throw new Error("profile_unavailable: missing_supabase_rest_config");
  }

  const buildContextFromRow = (row: {
    user_id: string;
    daily_credits: number | null;
    bonus_credits: number | null;
    plan?: string | null;
    available_credits?: number | null;
    is_unlimited?: boolean | null;
  }): TranscriptionContext => {
    if (row.user_id !== userId) {
      throw new Error(`profile_unavailable: user mismatch context=${row.user_id} token=${userId}`);
    }

    const isUnlimited = row.is_unlimited === true || row.plan === "plus";
    return {
      user_id: row.user_id,
      daily_credits: row.daily_credits ?? 0,
      bonus_credits: row.bonus_credits ?? 0,
      available_credits:
        isUnlimited ? null : row.available_credits ?? (row.daily_credits ?? 0) + (row.bonus_credits ?? 0),
      plan: isUnlimited ? "plus" : "free",
      is_unlimited: isUnlimited,
    };
  };

  const readProfileRow = async () => {
    const endpoint = `${SUPABASE_REST_URL}/profiles?select=id,daily_credits,bonus_credits,plan&id=eq.${encodeURIComponent(userId)}&limit=1`;
    let response: Response;
    try {
      response = await fetch(endpoint, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      throw new Error(
        `profile_unavailable: network_error: ${endpoint}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    const bodyText = await response.text();

    if (!response.ok) {
      let responseError = bodyText || "empty_body";
      try {
        const parsed = JSON.parse(bodyText) as {
          code?: unknown;
          message?: unknown;
          details?: unknown;
          hint?: unknown;
        };
        responseError = [parsed.code, parsed.message, parsed.details, parsed.hint]
          .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
          .join(": ") || responseError;
      } catch {
      }
      throw new Error(`profile_unavailable: HTTP ${response.status}: ${responseError}`);
    }

    let data: unknown;
    try {
      data = JSON.parse(bodyText);
    } catch {
      throw new Error(`profile_unavailable: invalid_json_response: ${bodyText || "empty_body"}`);
    }

    const row = (Array.isArray(data) ? data[0] : data) as
      | {
          id: string;
          daily_credits: number | null;
          bonus_credits: number | null;
          plan: string | null;
        }
      | null;

    if (!row?.id) {
      throw new Error("profile_unavailable: empty transcription context");
    }

    return buildContextFromRow({
      user_id: row.id,
      daily_credits: row.daily_credits,
      bonus_credits: row.bonus_credits,
      plan: row.plan,
    });
  };

  const readRpcContext = async () => {
    const endpoint = `${SUPABASE_REST_URL}/rpc/get_transcription_context`;
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: "{}",
      });
    } catch (error) {
      return readProfileRow().catch((profileError) => {
        throw new Error(
          `profile_unavailable: network_error: ${endpoint}: ${error instanceof Error ? error.message : String(error)}; fallback=${
            profileError instanceof Error ? profileError.message : String(profileError)
          }`
        );
      });
    }
    const bodyText = await response.text();

    if (!response.ok) {
      let responseError = bodyText || "empty_body";
      try {
        const parsed = JSON.parse(bodyText) as {
          code?: unknown;
          message?: unknown;
          details?: unknown;
          hint?: unknown;
        };
        responseError = [parsed.code, parsed.message, parsed.details, parsed.hint]
          .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
          .join(": ") || responseError;
      } catch {
      }

      if (
        (response.status === 404 && /PGRST202/.test(responseError)) ||
        (response.status === 400 && /42703/.test(responseError)) ||
        /column .*daily_credits.* does not exist/i.test(responseError)
      ) {
        return readProfileRow();
      }

      throw new Error(`profile_unavailable: HTTP ${response.status}: ${responseError}`);
    }

    let data: unknown;
    try {
      data = JSON.parse(bodyText);
    } catch {
      throw new Error(`profile_unavailable: invalid_json_response: ${bodyText || "empty_body"}`);
    }

    const row = (Array.isArray(data) ? data[0] : data) as
      | {
          user_id: string;
          daily_credits: number | null;
          bonus_credits: number | null;
          available_credits: number | null;
          plan: string | null;
          is_unlimited: boolean | null;
        }
      | null;

    if (!row?.user_id) {
      throw new Error("profile_unavailable: empty transcription context");
    }

    return buildContextFromRow(row);
  };

  return readRpcContext();
}

export async function prefetchTranscriptionReadiness() {
  try {
    await readFreshTranscriptionReadiness();
  } catch (error) {
    console.warn("prefetch_failed", error instanceof Error ? error.message : String(error));
  }
}


async function invokeTranscriptionRequest(formData: FormData, accessToken: string): Promise<TranscriptionResponse> {
  const endpoint = TRANSCRIBE_URL;
  if (!endpoint) {
    throw new Error("provider_unavailable: missing_transcribe_endpoint");
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("invalid_audio: missing_audio_file");
  }

  const language = formData.get("language");
  const model = formData.get("model");
  const prompt = formData.get("prompt");
  const fileBytes = new Uint8Array(await file.arrayBuffer());
  const normalizedLanguage = typeof language === "string" && language !== "auto" && language.trim()
    ? language.trim()
    : null;
  const normalizedModel = typeof model === "string" ? model : "";
  const normalizedPrompt = typeof prompt === "string" && prompt.trim() ? prompt.trim() : null;

  const timeoutId = window.setTimeout(() => {}, TRANSCRIPTION_REQUEST_TIMEOUT_MS);

  let data: TranscriptionResponse;
  try {
    const responseText = await invoke<string>("transcribe_request", {
      endpoint,
      accessToken,
      apikey: SUPABASE_ANON_KEY || null,
      fileName: file.name,
      fileBytes: Array.from(fileBytes),
      fileMimeType: file.type || "audio/webm",
      language: normalizedLanguage,
      model: normalizedModel,
      prompt: normalizedPrompt,
    });
    try {
      data = JSON.parse(responseText) as TranscriptionResponse;
    } catch {
      throw new Error(`invalid_json_response: ${responseText || "empty_body"}`);
    }
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!data?.text) {
    throw new Error("empty_transcription");
  }

  return data;
}

async function readAudioDurationMs(blob: Blob): Promise<number | null> {
  return new Promise((resolve) => {
    const audio = document.createElement("audio");
    const objectUrl = URL.createObjectURL(blob);
    const timeoutId = window.setTimeout(() => cleanup(null), 1200);

    const cleanup = (durationMs: number | null) => {
      window.clearTimeout(timeoutId);
      audio.removeAttribute("src");
      audio.load();
      URL.revokeObjectURL(objectUrl);
      resolve(durationMs);
    };

    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      const durationMs = Number.isFinite(audio.duration) ? Math.max(0, audio.duration * 1000) : null;
      cleanup(durationMs);
    };
    audio.onerror = () => cleanup(null);
    audio.src = objectUrl;
  });
}

export async function transcribeAudio(audioBlob: Blob, lifecycle: TranscriptionLifecycle = {}): Promise<string> {
  if (audioBlob.size === 0) {
    throw new Error("silent_audio");
  }

  globalThis.__whispertype_hotkey_up_at_ms ??= nowMs();
  let cachedPrefetchState = getPrefetchCache();
  if (!cachedPrefetchState) {
    cachedPrefetchState = await readFreshTranscriptionReadiness();
  }

  if (!hasAvailableTranscriptionCredit(cachedPrefetchState.context)) {
    cachedPrefetchState = await readFreshTranscriptionReadiness();
    if (!hasAvailableTranscriptionCredit(cachedPrefetchState.context)) {
      cachedPrefetch = null;
      throw new Error("insufficient_credits");
    }
  }

  const processedBlob = await preprocessAudioBlobForTranscription(audioBlob);
  if (processedBlob.size === 0) {
    throw new Error("silent_audio");
  }
  const processedDurationMs = await readAudioDurationMs(processedBlob);

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
    lifecycle.onRequestStart?.({ byteSize: processedBlob.size, durationMs: processedDurationMs });
    const data = await invokeTranscriptionRequest(formData, accessToken);
    const text = data.text.trim();
    if (!text) {
      throw new Error("empty_transcription");
    }
    cachedPrefetch = null;
    return text;
  } catch (error) {
    const errorCode = error instanceof Error ? error.message : "transcription_failed";

    if (errorCode === "silent_audio") {
      throw new Error(errorCode);
    }

    if (errorCode === "insufficient_credits") {
      cachedPrefetch = null;
      throw new Error(errorCode);
    }

    if (errorCode === "transcription_failed" || errorCode === "provider_unavailable") {
      const retryData = await invokeTranscriptionRequest(formData, accessToken);
      const retryText = retryData.text.trim();
      if (!retryText) {
        throw new Error("empty_transcription");
      }
      cachedPrefetch = null;
      return retryText;
    }

    console.error("Transcription error:", errorCode);
    throw new Error(errorCode);
  }
}
