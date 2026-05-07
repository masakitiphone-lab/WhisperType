export const PREFERRED_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  channelCount: { ideal: 1 },
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
};

export async function requestPreferredAudioStream(deviceId?: string): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: deviceId
      ? {
          ...PREFERRED_AUDIO_CONSTRAINTS,
          deviceId: { exact: deviceId },
        }
      : PREFERRED_AUDIO_CONSTRAINTS,
  });
}

export function getPreferredRecordingMimeType(): string {
  if (typeof MediaRecorder === "undefined") {
    return "";
  }

  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];

  return candidates.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ?? "";
}

export function getPreferredRecordingAudioBitsPerSecond(): number {
  return 48_000;
}
