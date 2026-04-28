import { invoke } from "@tauri-apps/api/core";

export async function preprocessAudioBlobForTranscription(inputBlob: Blob): Promise<Blob> {
  if (inputBlob.size === 0) {
    return new Blob([], { type: inputBlob.type || "audio/webm" });
  }

  try {
    const preprocessStart = typeof performance !== "undefined" ? performance.now() : Date.now();
    const bytes = new Uint8Array(await inputBlob.arrayBuffer());
    const processedBytes = await invoke<number[]>("process_audio_with_ffmpeg", {
      bytes: Array.from(bytes),
    });

    if (!processedBytes || processedBytes.length === 0) {
      return new Blob([], { type: inputBlob.type || "audio/webm" });
    }

    const outputBlob = new Blob([new Uint8Array(processedBytes)], { type: "audio/webm" });
    void invoke("log_to_terminal", {
      msg: `[Recording Metrics] audio_preprocess_complete input_bytes=${inputBlob.size} output_bytes=${outputBlob.size} elapsed_ms=${Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - preprocessStart)}`,
    }).catch(() => undefined);
    return outputBlob;
  } catch (error) {
    console.warn("Failed to preprocess audio for transcription:", error);
    return new Blob([], { type: inputBlob.type || "audio/webm" });
  }
}
