import type { MutableRefObject } from "react";
import { invoke } from "@tauri-apps/api/core";

const MAX_PENDING_PASTE_LENGTH = 5000;

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
    return;
  }

  try {
    await invoke<string>("type_text", { text: `${combinedText} `, useClipboardPaste: true });
  } catch (error) {
    await invoke("log_to_terminal", {
      msg: `[Paste Flush Error] ${error}`,
    }).catch((err) => console.error("log_to_terminal failed:", err));
    throw error;
  } finally {
    pendingPasteTextRef.current = "";
  }
}
