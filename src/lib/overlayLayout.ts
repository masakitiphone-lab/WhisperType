export const OVERLAY_WIDTH = 200;
export const OVERLAY_HEIGHT = 40;
export const BASE_HEIGHT = 32;
export const ICON_SIZE = 38;
export const CAPSULE_ICON_GAP = 10;
export const WAVEFORM_BAR_COUNT = 16;
export const WAVEFORM_VIEW_HEIGHT = BASE_HEIGHT - 6;
export const WAVEFORM_BAR_WIDTH = 4;
export const WAVEFORM_BAR_GAP = 2;
export const WAVEFORM_VISUAL_GAIN = 14;
export const WAVEFORM_FLOW_SPEED = 0.2;
export const WAVEFORM_PHASE_STEP = 0.6;
export const WAVEFORM_IDLE_BASE_LEVEL = 0.14;
export const WAVEFORM_IDLE_WAVE_SIZE = 0.18;
export const WAVEFORM_SPEECH_BASE_LEVEL = 0.22;
export const WAVEFORM_SPEECH_WAVE_SIZE = 0.8;
export const WAVEFORM_SPEECH_BOOST = 3.2;
export const WAVEFORM_SPEECH_SMOOTHING = 0.58;
export const CAPSULE_CONTENT_PADDING_X = 18;
export const OVERLAY_WINDOW_BUFFER_X = 18;
export const OVERLAY_WINDOW_BUFFER_Y = 12;
export const OVERLAY_NOTICE_BUFFER_X = 14;
export const OVERLAY_NOTICE_BUFFER_Y = 12;
export const PREVIEW_MAX_HEIGHT = 60;
export const PREVIEW_GAP = 8;
export const CAPSULE_COLLAPSED_WIDTH = BASE_HEIGHT;
export const CAPSULE_EXPANDED_WIDTH = 176;
export const CAPSULE_BODY_WIDTH = 304;
export const CAPSULE_ICON_LEFT = CAPSULE_CONTENT_PADDING_X - 8;
export const CAPSULE_ICON_WAVEFORM_GAP = 7;
export const WAVEFORM_VISUAL_WIDTH =
  ICON_SIZE + CAPSULE_ICON_WAVEFORM_GAP + WAVEFORM_BAR_COUNT * WAVEFORM_BAR_WIDTH + (WAVEFORM_BAR_COUNT - 1) * WAVEFORM_BAR_GAP;
export const WAVEFORM_BAR_STRIP_WIDTH = WAVEFORM_VISUAL_WIDTH - ICON_SIZE - CAPSULE_ICON_WAVEFORM_GAP;
export const CAPSULE_CONTENT_WIDTH = CAPSULE_CONTENT_PADDING_X + WAVEFORM_VISUAL_WIDTH + CAPSULE_CONTENT_PADDING_X;
export const ICON_TRAVEL_DURATION = 0.28;
export const CAPSULE_EXPAND_DURATION = 0.28;
export const WAVEFORM_FADE_IN_DELAY = 0.02;
export const WAVEFORM_FADE_IN_DURATION = 0.16;
export const CAPSULE_COLLAPSE_DURATION = 0.34;
export const ICON_RETURN_DURATION = 0.28;

export function getCapsuleExpandedWidth() {
  return CAPSULE_CONTENT_WIDTH;
}

export function getOverlayCapsuleStageWidth() {
  return CAPSULE_CONTENT_WIDTH + OVERLAY_WINDOW_BUFFER_X * 2;
}

export function getOverlayCapsuleStageHeight() {
  return BASE_HEIGHT + OVERLAY_WINDOW_BUFFER_Y * 2;
}

export function getOverlayPreviewStageHeight() {
  return BASE_HEIGHT + (PREVIEW_MAX_HEIGHT + PREVIEW_GAP) * 2;
}

export function getOverlayNoticeStageWidth(noticeWidth: number) {
  return noticeWidth + OVERLAY_NOTICE_BUFFER_X * 2;
}

export function getOverlayNoticeStageHeight(noticeMinHeight: number) {
  return noticeMinHeight + OVERLAY_NOTICE_BUFFER_Y * 2;
}

export function getOverlayNoticeContentHeight(notice: { minHeight: number; detail?: string; text?: string }) {
  return notice.minHeight;
}

export function getIconLeftOffset() {
  return CAPSULE_ICON_LEFT;
}

export function getWaveformLeftOffset() {
  return getIconLeftOffset() + ICON_SIZE + CAPSULE_ICON_WAVEFORM_GAP;
}

export function getCapsuleAnimationWidth(progress: number) {
  return CAPSULE_COLLAPSED_WIDTH + (CAPSULE_EXPANDED_WIDTH - CAPSULE_COLLAPSED_WIDTH) * progress;
}

export function getIconTravelX(progress: number, stageWidth: number, capsuleWidth: number, iconSize = ICON_SIZE) {
  const startCenterX = stageWidth / 2;
  const endCenterX = (stageWidth - capsuleWidth) / 2 + getIconLeftOffset() + iconSize / 2;
  return startCenterX + (endCenterX - startCenterX) * progress;
}

export function getWaveformOpacity(progress: number) {
  if (progress <= 0) return 0;
  if (progress >= 1) return 1;
  return progress;
}

export function getWaveformPhaseOpacity(
  phase: "idle" | "expanding" | "settled" | "closing",
  elapsedMs: number,
) {
  const elapsed = Math.max(0, elapsedMs);

  switch (phase) {
    case "idle":
      return 0;
    case "expanding": {
      const fadeElapsed = elapsed - CAPSULE_EXPAND_DURATION * 1000 - WAVEFORM_FADE_IN_DELAY * 1000;
      return getWaveformOpacity(clamp01(fadeElapsed / (WAVEFORM_FADE_IN_DURATION * 1000)));
    }
    case "settled":
      return 1;
    case "closing":
      return 0;
  }
}

export function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function easeInCubic(value: number) {
  const clamped = clamp01(value);
  return clamped * clamped * clamped;
}

function easeInOutCubic(value: number) {
  const clamped = clamp01(value);
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
}

function easeOutCubic(value: number) {
  const clamped = clamp01(value);
  return 1 - Math.pow(1 - clamped, 3);
}

export function getPhaseAnimationProgress(
  phase: "idle" | "expanding" | "settled" | "closing",
  elapsedMs: number,
) {
  const elapsed = Math.max(0, elapsedMs);

  switch (phase) {
    case "idle":
      return 0;
    case "settled":
      return 1;
    case "expanding":
      return easeInCubic(elapsed / (CAPSULE_EXPAND_DURATION * 1000));
    case "closing":
      return 1 - easeOutCubic(elapsed / (CAPSULE_COLLAPSE_DURATION * 1000));
  }
}

export function getCapsuleWidthProgress(
  phase: "idle" | "expanding" | "settled" | "closing",
  elapsedMs: number,
) {
  const elapsed = Math.max(0, elapsedMs);

  switch (phase) {
    case "idle":
      return 0;
    case "settled":
      return 1;
    case "expanding":
      return easeInOutCubic(elapsed / (CAPSULE_EXPAND_DURATION * 1000));
    case "closing":
      return 1 - easeOutCubic(elapsed / (CAPSULE_COLLAPSE_DURATION * 1000));
  }
}
