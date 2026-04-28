import { readAppSettings } from "@/lib/appSettings";

export type TranscriptionLanguage =
  | "auto"
  | "ja"
  | "en"
  | "es"
  | "fr"
  | "de"
  | "it"
  | "pt"
  | "zh"
  | "ko";
export type TranscriptionModel = "whisper-large-v3" | "whisper-large-v3-turbo";

export type TranscriptionSettings = {
  language: TranscriptionLanguage;
  model: TranscriptionModel;
  prompt: string;
};

export const LEGACY_DEFAULT_TRANSCRIPTION_PROMPT =
  "Transcribe naturally in the spoken language. For Japanese, prefer natural kanji-kana mixed writing instead of all hiragana when appropriate. For English, use normal English spelling. Keep product and brand names in their usual spelling. Do not add duplicated trailing text.";

export const DEFAULT_TRANSCRIPTION_PROMPT = "";

export const JAPANESE_TRANSCRIPTION_PROMPT =
  "日本語は自然な漢字かな交じりで文字起こししてください。全部ひらがなにしないでください。製品名やブランド名は通常の表記を維持し、末尾の重複文を追加しないでください。";

export const ENGLISH_TRANSCRIPTION_PROMPT =
  "Transcribe in natural English spelling. Keep product and brand names in their usual spelling, and do not add duplicated trailing text.";

export function buildTranscriptionSettingsPayload(
  settings: TranscriptionSettings
): Record<string, string> {
  return {
    language: settings.language,
    model: settings.model,
    prompt: settings.prompt,
  };
}

export const DEFAULT_TRANSCRIPTION_SETTINGS: TranscriptionSettings = {
  language: "auto",
  model: "whisper-large-v3-turbo",
  prompt: DEFAULT_TRANSCRIPTION_PROMPT,
};

export function readTranscriptionSettings(): TranscriptionSettings {
  try {
    const settings = readAppSettings();
    return {
      language: settings.language,
      model: settings.model,
      prompt:
        settings.prompt === LEGACY_DEFAULT_TRANSCRIPTION_PROMPT
          ? DEFAULT_TRANSCRIPTION_SETTINGS.prompt
          : settings.prompt,
    };
  } catch (error) {
    console.warn("Failed to read transcription settings:", error);
    return DEFAULT_TRANSCRIPTION_SETTINGS;
  }
}
