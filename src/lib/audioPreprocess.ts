import { invoke } from "@tauri-apps/api/core";

export async function preprocessAudioBlobForTranscription(inputBlob: Blob): Promise<Blob> {
  if (inputBlob.size === 0) {
    return new Blob([], { type: inputBlob.type || "audio/webm" });
  }

  try {
    const bytes = new Uint8Array(await inputBlob.arrayBuffer());
    void invoke("log_to_terminal", {
      msg: `[JS] preprocessAudioBlobForTranscription bytes=${bytes.length}`,
    }).catch(() => {});
    const processedBytes = await invoke<number[]>("process_audio_with_ffmpeg", {
      bytes: Array.from(bytes),
    });
    void invoke("log_to_terminal", {
      msg: `[JS] process_audio_with_ffmpeg returned len=${processedBytes?.length ?? 0}`,
    }).catch(() => {});
    if (!processedBytes || processedBytes.length === 0) {
      return inputBlob;
    }

    const outputBlob = new Blob([new Uint8Array(processedBytes)], { type: "audio/webm" });
    return outputBlob;
  } catch (error) {
    void invoke("log_to_terminal", {
      msg: `[JS] preprocessAudioBlobForTranscription ERROR ${error instanceof Error ? error.message : String(error)}`,
    }).catch(() => {});
    console.warn("Failed to preprocess audio for transcription:", error);
    return inputBlob;
  }
}
