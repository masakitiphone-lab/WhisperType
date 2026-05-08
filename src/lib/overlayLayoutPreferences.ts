import { invoke } from "@tauri-apps/api/core";
import { readAppSettings, type AppSettings } from "@/lib/appSettings";

export type OverlayLayoutPreferences = Pick<
  AppSettings,
  "overlayScale" | "overlayPosition" | "overlayOffsetX" | "overlayOffsetY"
>;

export function selectOverlayLayoutPreferences(settings: AppSettings): OverlayLayoutPreferences {
  return {
    overlayScale: settings.overlayScale,
    overlayPosition: settings.overlayPosition,
    overlayOffsetX: settings.overlayOffsetX,
    overlayOffsetY: settings.overlayOffsetY,
  };
}

export async function readOverlayLayoutPreferences(): Promise<OverlayLayoutPreferences> {
  try {
    return await invoke<OverlayLayoutPreferences>("get_overlay_layout_preferences");
  } catch {
    return selectOverlayLayoutPreferences(readAppSettings());
  }
}

export async function setNativeOverlayLayoutPreferences(preferences: OverlayLayoutPreferences) {
  await invoke("set_overlay_layout_preferences", { preferences });
}

export async function resizeOverlayWindowForPreferences(
  stageWidth: number,
  stageHeight: number,
  preferences: OverlayLayoutPreferences,
) {
  await invoke("resize_overlay_window_command", {
    width: stageWidth * preferences.overlayScale,
    height: stageHeight * preferences.overlayScale,
    position: preferences.overlayPosition,
    offsetX: preferences.overlayOffsetX,
    offsetY: preferences.overlayOffsetY,
  });
}
