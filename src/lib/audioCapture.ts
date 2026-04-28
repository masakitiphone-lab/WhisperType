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

export function getAudioTrackDebugSummary(stream: MediaStream): string {
  const [track] = stream.getAudioTracks();
  if (!track) {
    return "No audio track";
  }

  const settings = track.getSettings();
  return JSON.stringify(
    {
      deviceId: settings.deviceId,
      channelCount: settings.channelCount,
      sampleRate: settings.sampleRate,
      sampleSize: settings.sampleSize,
      echoCancellation: settings.echoCancellation,
      noiseSuppression: settings.noiseSuppression,
      autoGainControl: settings.autoGainControl,
    },
    null,
    0
  );
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
