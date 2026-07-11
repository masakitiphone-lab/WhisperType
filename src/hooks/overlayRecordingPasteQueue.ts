import type { MutableRefObject } from "react";
import { invoke } from "@tauri-apps/api/core";

const MAX_PENDING_PASTE_LENGTH = 5000;

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

  const nextText = pendingPasteTextRef.current
    ? `${pendingPasteTextRef.current} ${normalizedText}`
    : normalizedText;
  pendingPasteTextRef.current =
    nextText.length > MAX_PENDING_PASTE_LENGTH
      ? nextText.slice(-MAX_PENDING_PASTE_LENGTH)
      : nextText;
}

export async function flushPastedTranscriptions(pendingPasteTextRef: MutableRefObject<string>) {
  const combinedText = pendingPasteTextRef.current.trim();
  if (!combinedText) {
    return "";
  }

  try {
    const pasteResult = await invoke<string>("type_text", { text: `${combinedText} `, useClipboardPaste: true });
    pendingPasteTextRef.current = "";

    if (pasteResult === "paste_sent_target_not_selected") {
      throw new PasteFlushError("paste_target_not_selected", combinedText);
    }

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
