import { invoke } from "@tauri-apps/api/core";
import { classifyOverlayError, type OverlayNoticePayload } from "@/lib/overlayNotice";
import type { ActiveRecording } from "@/hooks/overlayRecordingWaveform";

type VadDetectionResult = {
  has_speech: boolean;
  total_frames: number;
  speech_frames: number;
};

const SHOWABLE_ERROR_CODES = new Set([
  "transcription_failed",
  "transcription_timeout",
  "empty_transcription",
  "invalid_audio",
  "auth_required",
  "insufficient_credits",
  "ctrl_v_send_failed",
  "profile_unavailable",
  "provider_unavailable",
  "history_store_failed",
]);

export async function stopRecordingAndCreateBlob(recording: ActiveRecording) {
  if (recording.mediaRecorder.state === "inactive") {
    return null;
  }

  return new Promise<Blob>((resolve, reject) => {
    recording.mediaRecorder.onstop = () => {
      resolve(new Blob(recording.chunks, { type: recording.mimeType || recording.mediaRecorder.mimeType || "audio/webm" }));
    };
    recording.mediaRecorder.onerror = (event) => reject((event as ErrorEvent).error ?? new Error("MediaRecorder failed"));
    recording.mediaRecorder.stop();
  });
}

export async function assertRecordingHasSpeech(recordedBlob: Blob | null, hadSpeech: boolean): Promise<Blob> {
  if (!recordedBlob || recordedBlob.size === 0 || !hadSpeech) {
    await invoke("log_to_terminal", {
      msg: `[Transcription] skipped silent_audio hadSpeech=${hadSpeech} bytes=${recordedBlob?.size ?? 0}`,
    }).catch((err) => console.error("log_to_terminal failed:", err));
    throw new Error("silent_audio");
  }

  const vadResult = await invoke<VadDetectionResult>("detect_speech_with_vad", {
    bytes: Array.from(new Uint8Array(await recordedBlob.arrayBuffer())),
  });
  if (!vadResult.has_speech) {
    await invoke("log_to_terminal", {
      msg: `[Transcription] skipped vad_rejected frames=${vadResult.speech_frames}/${vadResult.total_frames} bytes=${recordedBlob.size}`,
    }).catch((err) => console.error("log_to_terminal failed:", err));
    throw new Error("silent_audio");
  }

  await invoke("log_to_terminal", {
    msg: `[Transcription] API request vad=${vadResult.speech_frames}/${vadResult.total_frames} bytes=${recordedBlob.size}`,
  }).catch((err) => console.error("log_to_terminal failed:", err));

  return recordedBlob;
}

export function buildTranscriptionOverlayNotice(errorMessage: string): OverlayNoticePayload | null {
  const normalizedError = errorMessage.toLowerCase();
  if (normalizedError === "silent_audio") {
    return null;
  }

  const overlayError = classifyOverlayError(errorMessage);
  return SHOWABLE_ERROR_CODES.has(overlayError.code) ? overlayError : null;
}
