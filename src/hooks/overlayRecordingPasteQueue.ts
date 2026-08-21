import type { MutableRefObject } from "react";
import { invoke } from "@tauri-apps/api/core";

// Pastes are split into chunks so long dictation sessions are never
// silently truncated and each paste stays small enough for any target app.
const PASTE_CHUNK_SIZE = 3000;
const PASTE_CHUNK_DELAY_MS = 140;

export class PasteFlushError extends Error {
  text: string;

  constructor(message: string, text: string) {
    super(message);
    this.name = "PasteFlushError";
    this.text = text;
  }
}

export function queueTranscriptionPaste(pendingPasteTextRef: MutableRefObject<string>, text: string) {
  const normalizedText = text.trim();
  if (!normalizedText) {
    return;
  }

  pendingPasteTextRef.current = pendingPasteTextRef.current
    ? `${pendingPasteTextRef.current} ${normalizedText}`
    : normalizedText;
}

export async function flushPastedTranscriptions(pendingPasteTextRef: MutableRefObject<string>) {
  const combinedText = pendingPasteTextRef.current.trim();
  if (!combinedText) {
    return "";
  }

  try {
    const chunks: string[] = [];
    for (let offset = 0; offset < combinedText.length; offset += PASTE_CHUNK_SIZE) {
      chunks.push(combinedText.slice(offset, offset + PASTE_CHUNK_SIZE));
    }

    for (let index = 0; index < chunks.length; index += 1) {
      const pasteResult = await invoke<string>("type_text", {
        text: `${chunks[index]} `,
        useClipboardPaste: true,
      });
      if (pasteResult === "paste_sent_target_not_selected") {
        pendingPasteTextRef.current = "";
        throw new PasteFlushError("paste_target_not_selected", combinedText);
      }
      if (index < chunks.length - 1) {
        await new Promise((resolve) => window.setTimeout(resolve, PASTE_CHUNK_DELAY_MS));
      }
    }

    pendingPasteTextRef.current = "";
    return combinedText;
  } catch (error) {
    if (error instanceof PasteFlushError) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    await invoke("log_to_terminal", {
      msg: `[Paste Flush Error] ${errorMessage}`,
    }).catch((err) => console.error("log_to_terminal failed:", err));
    pendingPasteTextRef.current = "";
    throw new PasteFlushError(errorMessage, combinedText);
  }
}
