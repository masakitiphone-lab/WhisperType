import { invoke } from "@tauri-apps/api/core";
import { readAppSettings } from "@/lib/appSettings";

export type TranscriptionHistoryEntry = {
  id: string;
  text: string;
  createdAt: string;
  createdAtMs: number;
  language: string;
  model: string;
};

const FALLBACK_KEY = "whispertype-transcription-history-fallback";

function createEntry(text: string): TranscriptionHistoryEntry {
  const now = new Date();
  const settings = (() => {
    try {
      return readAppSettings();
    } catch {
      return { language: "auto", model: "whisper-large-v3-turbo" } as const;
    }
  })();
  return {
    id: (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    text: text.trim(),
    createdAt: now.toISOString(),
    createdAtMs: now.getTime(),
    language: (settings as { language?: string }).language ?? "auto",
    model: (settings as { model?: string }).model ?? "whisper-large-v3-turbo",
  };
}

function readFallback(): TranscriptionHistoryEntry[] {
  try {
    const raw = localStorage.getItem(FALLBACK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TranscriptionHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFallback(entries: TranscriptionHistoryEntry[]) {
  try {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(entries.slice(0, 500)));
  } catch {
    // ignore quota
  }
}

export async function getTranscriptionHistory(): Promise<TranscriptionHistoryEntry[]> {
  try {
    const entries = await invoke<TranscriptionHistoryEntry[]>("get_transcription_history");
    if (Array.isArray(entries)) return entries;
    return readFallback();
  } catch {
    return readFallback();
  }
}

export async function addTranscriptionHistoryEntry(text: string): Promise<TranscriptionHistoryEntry[]> {
  const trimmed = text.trim();
  if (!trimmed) return getTranscriptionHistory();
  const entry = createEntry(trimmed);
  try {
    const entries = await invoke<TranscriptionHistoryEntry[]>("add_transcription_history_entry", { entry });
    writeFallback(entries);
    return entries;
  } catch {
    const current = readFallback();
    const next = [entry, ...current.filter((e) => e.id !== entry.id)].slice(0, 500);
    writeFallback(next);
    return next;
  }
}

export async function deleteTranscriptionHistoryEntry(id: string): Promise<TranscriptionHistoryEntry[]> {
  try {
    const entries = await invoke<TranscriptionHistoryEntry[]>("delete_transcription_history_entry", { id });
    writeFallback(entries);
    return entries;
  } catch {
    const next = readFallback().filter((e) => e.id !== id);
    writeFallback(next);
    return next;
  }
}

export async function clearTranscriptionHistory(): Promise<TranscriptionHistoryEntry[]> {
  try {
    const entries = await invoke<TranscriptionHistoryEntry[]>("clear_transcription_history");
    writeFallback(entries);
    return entries;
  } catch {
    writeFallback([]);
    return [];
  }
}

export function formatHistoryDate(entry: TranscriptionHistoryEntry, locale: string): string {
  try {
    const d = new Date(entry.createdAtMs || entry.createdAt);
    return d.toLocaleString(locale === "ja" ? "ja-JP" : locale === "es" ? "es-ES" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return entry.createdAt;
  }
}
