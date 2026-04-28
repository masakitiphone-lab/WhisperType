import { readAppSettings, writeAppSettings } from "@/lib/appSettings";

export const DEFAULT_OVERLAY_SCALE = 1;

export function clampOverlayScale(value: number) {
  return Math.min(2, Math.max(0.8, value));
}

export function readOverlayScale() {
  return clampOverlayScale(readAppSettings().overlayScale ?? DEFAULT_OVERLAY_SCALE);
}

export function writeOverlayScale(scale: number) {
  writeAppSettings({
    overlayScale: clampOverlayScale(scale),
  });
}
