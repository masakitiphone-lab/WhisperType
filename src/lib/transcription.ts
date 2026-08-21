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

export const DEFAULT_TRANSCRIPTION_PROMPT =
  "今日は朝から天気が良く、清々しい一日が始まりました。午前中はカフェでゆっくりと読書をし、午後からは友人との待ち合わせを予定しています。最近は、日常の中にある小さな幸せを大切にしながら、一歩ずつ着実に進むことを心がけています。こうした穏やかな時間が、日々の活力につながっていると感じます。";

export const JAPANESE_TRANSCRIPTION_PROMPT = "日本語の自然な表記。固有名詞は通常表記。";

export const ENGLISH_TRANSCRIPTION_PROMPT =
  "Natural English spelling. Keep names and brand terms unchanged.";

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
    const prompt = settings.prompt;
    const isLegacyPrompt =
      !prompt.trim() ||
      prompt === LEGACY_DEFAULT_TRANSCRIPTION_PROMPT ||
      prompt === JAPANESE_TRANSCRIPTION_PROMPT ||
      prompt === ENGLISH_TRANSCRIPTION_PROMPT;
    return {
      language: settings.language,
      model: settings.model,
      prompt: isLegacyPrompt ? DEFAULT_TRANSCRIPTION_SETTINGS.prompt : prompt,
    };
  } catch (error) {
    console.warn("Failed to read transcription settings:", error);
    return DEFAULT_TRANSCRIPTION_SETTINGS;
  }
}
