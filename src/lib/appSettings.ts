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
  tutorialCompleted: boolean;
  preferredAudioInputDeviceId: string;
};

const LEGACY_DEFAULT_HOTKEYS = new Set(["Ctrl+Shift+Space", "Ctrl+Alt"]);
const SETTINGS_STORAGE_KEY = "whispertype-settings";
const LEGACY_DEFAULT_OVERLAY_OFFSET_Y_VALUES = new Set([80, 120, 180, 220]);

export const DEFAULT_APP_SETTINGS: AppSettings = {
  hotkey: "Ctrl+Alt",
  language: "auto",
  model: "whisper-large-v3-turbo",
  prompt: "",
  overlayScale: 1,
  overlayPosition: "bottom",
  overlayOffsetX: 0,
  overlayOffsetY: 0,
  appLocale: "ja",
  showOverlay: true,
  showWaveform: true,
  playStartSound: true,
  playStopSound: true,
  soundVolume: 0.25,
  autoInsert: true,
  onboardingCompleted: false,
  tutorialCompleted: false,
  preferredAudioInputDeviceId: "",
};

export function readAppSettings(): AppSettings {
  if (typeof window === "undefined") {
    return DEFAULT_APP_SETTINGS;
  }

  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_APP_SETTINGS;
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const onboardingCompleted =
      parsed.onboardingCompleted === true ||
      (Array.isArray(parsed.onboardingCompletedUserIds) && (parsed.onboardingCompletedUserIds as unknown[]).length > 0);
    const tutorialCompleted =
      parsed.tutorialCompleted === true ||
      (Array.isArray(parsed.tutorialCompletedUserIds) && (parsed.tutorialCompletedUserIds as unknown[]).length > 0);

    const hotkey =
      typeof parsed.hotkey === "string" && parsed.hotkey.trim().length > 0
        ? LEGACY_DEFAULT_HOTKEYS.has(parsed.hotkey)
          ? DEFAULT_APP_SETTINGS.hotkey
          : parsed.hotkey
        : DEFAULT_APP_SETTINGS.hotkey;
    const parsedOverlayPosition =
      parsed.overlayPosition === "top" || parsed.overlayPosition === "bottom"
        ? parsed.overlayPosition
        : DEFAULT_APP_SETTINGS.overlayPosition;
    const parsedOverlayOffsetX =
      typeof parsed.overlayOffsetX === "number" && Number.isFinite(parsed.overlayOffsetX)
        ? Math.min(400, Math.max(-400, parsed.overlayOffsetX))
        : DEFAULT_APP_SETTINGS.overlayOffsetX;
    const parsedOverlayOffsetY =
      typeof parsed.overlayOffsetY === "number" && Number.isFinite(parsed.overlayOffsetY)
        ? Math.min(240, Math.max(-240, parsed.overlayOffsetY))
        : DEFAULT_APP_SETTINGS.overlayOffsetY;
    const overlayOffsetY =
      parsedOverlayPosition === "bottom" &&
      parsedOverlayOffsetX === 0 &&
      LEGACY_DEFAULT_OVERLAY_OFFSET_Y_VALUES.has(parsedOverlayOffsetY)
        ? DEFAULT_APP_SETTINGS.overlayOffsetY
        : parsedOverlayOffsetY;

    const settings = {
      ...DEFAULT_APP_SETTINGS,
      ...parsed,
      hotkey,
      onboardingCompleted,
      tutorialCompleted,
      preferredAudioInputDeviceId:
        typeof parsed.preferredAudioInputDeviceId === "string"
          ? parsed.preferredAudioInputDeviceId
          : DEFAULT_APP_SETTINGS.preferredAudioInputDeviceId,
      overlayScale:
        typeof parsed.overlayScale === "number" && Number.isFinite(parsed.overlayScale)
          ? Math.min(2, Math.max(0.8, parsed.overlayScale))
          : DEFAULT_APP_SETTINGS.overlayScale,
      overlayPosition: parsedOverlayPosition,
      overlayOffsetX: parsedOverlayOffsetX,
      overlayOffsetY,
      soundVolume:
        typeof parsed.soundVolume === "number" && Number.isFinite(parsed.soundVolume)
          ? Math.min(1, Math.max(0, parsed.soundVolume))
          : DEFAULT_APP_SETTINGS.soundVolume,
    };

    if (overlayOffsetY !== parsedOverlayOffsetY) {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    }

    return settings;
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
    SETTINGS_STORAGE_KEY,
    JSON.stringify({
      ...current,
      ...nextSettings,
    }),
  );
}

export const DEFAULT_OVERLAY_SCALE = 1;

export function readAppOverlayScale() {
  const value = readAppSettings().overlayScale ?? DEFAULT_OVERLAY_SCALE;
  return Math.min(2, Math.max(0.8, value));
}

export function writeAppOverlayScale(scale: number) {
  writeAppSettings({
    overlayScale: Math.min(2, Math.max(0.8, scale)),
  });
}
