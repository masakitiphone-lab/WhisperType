import { invoke } from "@tauri-apps/api/core";
import { preprocessAudioBlobForTranscription } from "@/lib/audioPreprocess";
import { buildTranscriptionSettingsPayload, readTranscriptionSettings } from "@/lib/transcription";

const GROQ_KEY = "whispertype.groq.api-key";
function getAudioFileName(blob: Blob): string {
  if (blob.type.includes("wav")) return "audio.wav";
  if (blob.type.includes("mp4")) return "audio.m4a";
  if (blob.type.includes("ogg")) return "audio.ogg";
  return "audio.webm";
}

export async function getGroqApiKey(): Promise<string> {
  return (await invoke<string | null>("secure_storage_get", { key: GROQ_KEY }))?.trim() || "";
}

export async function setGroqApiKey(value: string): Promise<void> {
  const key = value.trim();
  if (key) await invoke("secure_storage_set", { key: GROQ_KEY, value: key });
  else await invoke("secure_storage_delete", { key: GROQ_KEY });
}

export async function prefetchTranscriptionReadiness() {
  return getGroqApiKey();
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  void invoke("log_to_terminal", { msg: `[JS] transcribeAudio enter size=${audioBlob.size}` }).catch(() => {});
  if (audioBlob.size === 0) throw new Error("silent_audio");
  const apiKey = await getGroqApiKey();
  void invoke("log_to_terminal", { msg: `[JS] transcribeAudio apiKey=${apiKey ? "set" : "MISSING"}` }).catch(() => {});
  if (!apiKey) throw new Error("groq_api_key_missing");

  const processedBlob = await preprocessAudioBlobForTranscription(audioBlob);
  if (processedBlob.size === 0) throw new Error("silent_audio");

  const file = new File([processedBlob], getAudioFileName(processedBlob), {
    type: processedBlob.type || "audio/webm",
  });
  const settings = buildTranscriptionSettingsPayload(readTranscriptionSettings());
  const responseText = await invoke<string>("transcribe_request", {
    groqApiKey: apiKey,
    fileName: file.name,
    fileBytes: Array.from(new Uint8Array(await file.arrayBuffer())),
    fileMimeType: file.type,
    language: settings.language === "auto" ? null : settings.language,
    model: settings.model,
    prompt: settings.prompt.trim() || null,
  });
  const data = JSON.parse(responseText) as { text?: string };
  const text = data.text?.trim() || "";
  if (!text) throw new Error("empty_transcription");
  return text;
}
