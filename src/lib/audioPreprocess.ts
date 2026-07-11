import { invoke } from "@tauri-apps/api/core";

export async function preprocessAudioBlobForTranscription(inputBlob: Blob): Promise<Blob> {
  if (inputBlob.size === 0) {
    return new Blob([], { type: inputBlob.type || "audio/webm" });
  }

  try {
    const bytes = new Uint8Array(await inputBlob.arrayBuffer());
    const processedBytes = await invoke<number[]>("process_audio_with_ffmpeg", {
      bytes: Array.from(bytes),
    });

    if (!processedBytes || processedBytes.length === 0) {
      return inputBlob;
    }

    const outputBlob = new Blob([new Uint8Array(processedBytes)], { type: "audio/webm" });
    return outputBlob;
  } catch (error) {
    console.warn("Failed to preprocess audio for transcription:", error);
    return inputBlob;
  }
}
