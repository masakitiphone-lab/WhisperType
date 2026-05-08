export type AppSettings = {
  hotkey: string;
  language:
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
  model: "whisper-large-v3" | "whisper-large-v3-turbo";
  prompt: string;
  overlayScale: number;
  overlayPosition: "bottom" | "top";
  overlayOffsetX: number;
  overlayOffsetY: number;
  appLocale: "en" | "ja" | "es";
  showOverlay: boolean;
  showWaveform: boolean;
  playStartSound: boolean;
  playStopSound: boolean;
  soundVolume: number;
  autoInsert: boolean;
  onboardingCompleted: boolean;
  onboardingCompletedUserIds: string[];
  tutorialCompletedUserIds: string[];
  preferredAudioInputDeviceId: string;
};

const LEGACY_DEFAULT_HOTKEYS = new Set(["Ctrl+Shift+Space", "Ctrl+Alt"]);

export const DEFAULT_APP_SETTINGS: AppSettings = {
  hotkey: "Ctrl+Alt",
  language: "auto",
  model: "whisper-large-v3-turbo",
  prompt: "",
  overlayScale: 1,
  overlayPosition: "bottom",
  overlayOffsetX: 0,
  overlayOffsetY: 80,
  appLocale: "ja",
  showOverlay: true,
  showWaveform: true,
  playStartSound: true,
  playStopSound: true,
  soundVolume: 0.25,
  autoInsert: true,
  onboardingCompleted: false,
  onboardingCompletedUserIds: [],
  tutorialCompletedUserIds: [],
  preferredAudioInputDeviceId: "",
};

export function readAppSettings(): AppSettings {
  if (typeof window === "undefined") {
    return DEFAULT_APP_SETTINGS;
  }

  try {
    const raw = localStorage.getItem("whispertype-settings");
    if (!raw) {
      return DEFAULT_APP_SETTINGS;
    }

    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    const onboardingCompletedUserIds = Array.isArray(parsed.onboardingCompletedUserIds)
      ? parsed.onboardingCompletedUserIds.filter(
          (value): value is string => typeof value === "string" && value.trim().length > 0,
        )
      : DEFAULT_APP_SETTINGS.onboardingCompletedUserIds;
    const tutorialCompletedUserIds = Array.isArray(parsed.tutorialCompletedUserIds)
      ? parsed.tutorialCompletedUserIds.filter(
          (value): value is string => typeof value === "string" && value.trim().length > 0,
        )
      : DEFAULT_APP_SETTINGS.tutorialCompletedUserIds;

    const hotkey =
      typeof parsed.hotkey === "string" && parsed.hotkey.trim().length > 0
        ? LEGACY_DEFAULT_HOTKEYS.has(parsed.hotkey)
          ? DEFAULT_APP_SETTINGS.hotkey
          : parsed.hotkey
        : DEFAULT_APP_SETTINGS.hotkey;

    return {
      ...DEFAULT_APP_SETTINGS,
      ...parsed,
      hotkey,
      onboardingCompletedUserIds,
      tutorialCompletedUserIds,
      preferredAudioInputDeviceId:
        typeof parsed.preferredAudioInputDeviceId === "string"
          ? parsed.preferredAudioInputDeviceId
          : DEFAULT_APP_SETTINGS.preferredAudioInputDeviceId,
      overlayScale:
        typeof parsed.overlayScale === "number" && Number.isFinite(parsed.overlayScale)
          ? Math.min(2, Math.max(0.8, parsed.overlayScale))
          : DEFAULT_APP_SETTINGS.overlayScale,
      overlayPosition:
        parsed.overlayPosition === "top" || parsed.overlayPosition === "bottom"
          ? parsed.overlayPosition
          : DEFAULT_APP_SETTINGS.overlayPosition,
      overlayOffsetX:
        typeof parsed.overlayOffsetX === "number" && Number.isFinite(parsed.overlayOffsetX)
          ? Math.min(400, Math.max(-400, parsed.overlayOffsetX))
          : DEFAULT_APP_SETTINGS.overlayOffsetX,
      overlayOffsetY:
        typeof parsed.overlayOffsetY === "number" && Number.isFinite(parsed.overlayOffsetY)
          ? Math.min(240, Math.max(-240, parsed.overlayOffsetY))
          : DEFAULT_APP_SETTINGS.overlayOffsetY,
      soundVolume:
        typeof parsed.soundVolume === "number" && Number.isFinite(parsed.soundVolume)
          ? Math.min(1, Math.max(0, parsed.soundVolume))
          : DEFAULT_APP_SETTINGS.soundVolume,
    };
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

export function writeAppSettings(nextSettings: Partial<AppSettings>) {
  if (typeof window === "undefined") {
    return;
  }

  const current = readAppSettings();
  localStorage.setItem(
    "whispertype-settings",
    JSON.stringify({
      ...current,
      ...nextSettings,
    }),
  );
}
