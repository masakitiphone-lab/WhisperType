import type { MutableRefObject } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { prefetchTranscriptionReadiness } from "@/services/transcription";
import type { ActiveRecording, CapturePhase } from "@/hooks/overlayRecordingWaveform";

type OverlayRecordingEventHandlers = {
  beginTranscriptionTransition: () => void;
  cleanupAudioResources: () => Promise<void>;
  processTranscriptionJob: (recording: ActiveRecording) => Promise<void>;
  startRealRecording: () => Promise<void>;
};

type OverlayRecordingEventRefs = {
  capturePhaseRef: MutableRefObject<CapturePhase>;
  currentRecordingRef: MutableRefObject<ActiveRecording | null>;
  isStartingRef: MutableRefObject<boolean>;
  pendingStopWhileStartingRef: MutableRefObject<boolean>;
  processedRecordingIdsRef: MutableRefObject<Set<number>>;
  recordingSessionActiveRef: MutableRefObject<boolean>;
};

export function attachOverlayRecordingEventListeners(
  handlers: OverlayRecordingEventHandlers,
  refs: OverlayRecordingEventRefs,
) {
  let unlistenRecordingStarted: (() => void) | undefined;
  let unlistenRecordingStopped: (() => void) | undefined;
  let unlistenTranscriptionPrefetch: (() => void) | undefined;
  let isListenerSetupCancelled = false;

  void (async () => {
    const recordingStartedListener = await listen("recording-started", () => {
      void handlers.startRealRecording();
    });
    if (isListenerSetupCancelled) {
      recordingStartedListener();
      return;
    }
    unlistenRecordingStarted = recordingStartedListener;

    const transcriptionPrefetchListener = await listen("transcription-prefetch", () => {
      void prefetchTranscriptionReadiness().catch((error) => {
        console.warn("Failed to prefetch transcription readiness:", error);
      });
    });
    if (isListenerSetupCancelled) {
      transcriptionPrefetchListener();
      return;
    }
    unlistenTranscriptionPrefetch = transcriptionPrefetchListener;

    const recordingStoppedListener = await listen("recording-stopped", () => {
      void invoke("log_to_terminal", {
        msg: `[JS] recording-stopped received current=${refs.currentRecordingRef.current ? "yes" : "no"} isStarting=${refs.isStartingRef.current} phase=${refs.capturePhaseRef.current}`,
      }).catch(() => {});
      if (!refs.currentRecordingRef.current) {
        if (refs.isStartingRef.current || refs.capturePhaseRef.current === "arming") {
          refs.pendingStopWhileStartingRef.current = true;
        }
        return;
      }

      const finishedRecording = refs.currentRecordingRef.current;
      refs.recordingSessionActiveRef.current = false;
      refs.currentRecordingRef.current = null;
      handlers.beginTranscriptionTransition();
      void invoke("log_to_terminal", {
        msg: `[JS] recording-stopped: starting transcription job id=${finishedRecording.id} state=${finishedRecording.mediaRecorder.state} mime=${finishedRecording.mimeType}`,
      }).catch(() => {});
      void handlers.processTranscriptionJob(finishedRecording);
    });
    if (isListenerSetupCancelled) {
      recordingStoppedListener();
      return;
    }
    unlistenRecordingStopped = recordingStoppedListener;

    await invoke("overlay_ready").catch((error) => {
      console.error("overlay_ready failed:", error);
    });
  })();

  return () => {
    isListenerSetupCancelled = true;
    unlistenRecordingStarted?.();
    unlistenTranscriptionPrefetch?.();
    unlistenRecordingStopped?.();
    if (refs.currentRecordingRef.current) {
      refs.currentRecordingRef.current = { ...refs.currentRecordingRef.current, lastSpeechAtMs: null };
    }
    refs.processedRecordingIdsRef.current.clear();
    refs.recordingSessionActiveRef.current = false;
    refs.pendingStopWhileStartingRef.current = false;
    void handlers.cleanupAudioResources();
  };
}
