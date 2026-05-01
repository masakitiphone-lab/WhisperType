import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  getPreferredRecordingAudioBitsPerSecond,
  getPreferredRecordingMimeType,
  requestPreferredAudioStream,
} from "@/lib/audioCapture";
import { readAppLocale, type AppLocale } from "@/lib/appLocale";
import { readAppSettings } from "@/lib/appSettings";
import { buildOverlayNotice, classifyOverlayError, type OverlayNoticePayload, type OverlayNoticeViewModel } from "@/lib/overlayNotice";
import { prefetchTranscriptionReadiness, transcribeAudio } from "@/services/transcription";
import { useRecordingSounds } from "@/hooks/useRecordingSounds";
import { createDisplayWaveformLevels, createEmptyWaveformLevels, RECORDING_SPEECH_RAW_THRESHOLD, RECORDING_SPEECH_THRESHOLD, WAVEFORM_GAIN, WAVEFORM_SMOOTHING, type ActiveRecording, type CapsulePhase, type CapturePhase } from "@/hooks/overlayRecordingWaveform";
import { BASE_HEIGHT, CAPSULE_COLLAPSE_DURATION, CAPSULE_CONTENT_WIDTH, CAPSULE_EXPAND_DURATION, OVERLAY_WINDOW_BUFFER_X, OVERLAY_HEIGHT, OVERLAY_WIDTH } from "@/lib/overlayLayout";

export function useOverlayRecordingController() {
  const [recordingState, setState] = useState<"idle" | "recording" | "transcribing" | "finished">("idle");
  const [overlayNotice, setOverlayNotice] = useState<OverlayNoticeViewModel | null>(null);
  const [capsulePhase, setCapsulePhase] = useState<CapsulePhase>("idle");
  const [capsuleMounted, setCapsuleMounted] = useState(false);
  const [spinnerPhase, setSpinnerPhase] = useState<"hidden" | "closing" | "visible">("hidden");
  const [overlayLayoutMode, setOverlayLayoutMode] = useState<"capsule" | "spinner" | "notice">("capsule");
  const [overlayPresentationVersion, setOverlayPresentationVersion] = useState(0);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [capsulePhaseStartedAt, setCapsulePhaseStartedAt] = useState(() => Date.now());
  const [waveformLevels, setWaveformLevels] = useState<number[]>(() => createEmptyWaveformLevels());
  const [overlayScale, setOverlayScale] = useState(readAppSettings().overlayScale);
  const waveformAnimationRef = useRef<number | null>(null);
  const waveformTimeRef = useRef(0);
  const speechLevelRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Float32Array | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isStartingRef = useRef(false);
  const capturePhaseRef = useRef<CapturePhase>("idle");
  const currentRecordingRef = useRef<ActiveRecording | null>(null);
  const recordingSessionActiveRef = useRef(false);
  const activeRecordingIdRef = useRef(0);
  const processedRecordingIdsRef = useRef<Set<number>>(new Set());
  const pendingTranscriptionsRef = useRef(0);
  const pendingPasteTextRef = useRef("");
  const overlayNoticeRef = useRef<OverlayNoticeViewModel | null>(null);
  const stateRef = useRef(recordingState);
  const finishTimeoutRef = useRef<number | null>(null);
  const spinnerHideTimeoutRef = useRef<number | null>(null);
  const noticeDismissTimeoutRef = useRef<number | null>(null);
  const { startSoundRef, stopSoundRef } = useRecordingSounds();
  const uiSettingsRef = useRef(readAppSettings());
  const appLocaleRef = useRef<AppLocale>(readAppLocale());
  const shouldReduceMotion = !!useReducedMotion();
  overlayNoticeRef.current = overlayNotice;
  const updateState = (nextState: typeof recordingState) => {
    stateRef.current = nextState;
    setState(nextState);
  };
  const updateCapsulePhase = (nextPhase: CapsulePhase) => {
    setCapsulePhase(nextPhase);
    setCapsulePhaseStartedAt(Date.now());
  };
  const clearOverlayNotice = async (immediate = false) => {
    if (noticeDismissTimeoutRef.current) window.clearTimeout(noticeDismissTimeoutRef.current);
    noticeDismissTimeoutRef.current = null;
    if (immediate) {
      setOverlayNotice(null);
      setIsOverlayVisible(false);
      await invoke("hide_overlay_window");
      return;
    }
    setIsOverlayVisible(false);
    noticeDismissTimeoutRef.current = window.setTimeout(async () => {
      setOverlayNotice(null);
      await invoke("hide_overlay_window");
      noticeDismissTimeoutRef.current = null;
    }, shouldReduceMotion ? 80 : 180);
  };
  const replayTranscriptionPresentation = () => {
    if (finishTimeoutRef.current) window.clearTimeout(finishTimeoutRef.current);
    if (spinnerHideTimeoutRef.current) window.clearTimeout(spinnerHideTimeoutRef.current);
    finishTimeoutRef.current = null;
    spinnerHideTimeoutRef.current = null;
    setSpinnerPhase("hidden");
    setOverlayLayoutMode("capsule");
    setOverlayPresentationVersion((current) => current + 1);
    setIsOverlayVisible(true);
  };
  const openAppFromOverlay = async () => invoke("show_settings_window");
  const showOverlayNotice = async (payload: OverlayNoticePayload) => {
    if (finishTimeoutRef.current) window.clearTimeout(finishTimeoutRef.current);
    if (spinnerHideTimeoutRef.current) window.clearTimeout(spinnerHideTimeoutRef.current);
    if (noticeDismissTimeoutRef.current) window.clearTimeout(noticeDismissTimeoutRef.current);
    finishTimeoutRef.current = null;
    spinnerHideTimeoutRef.current = null;
    noticeDismissTimeoutRef.current = null;
    setCapsuleMounted(false);
    setSpinnerPhase("hidden");
    updateCapsulePhase("idle");
    setOverlayNotice(buildOverlayNotice(appLocaleRef.current, payload));
    setOverlayLayoutMode("notice");
    updateState("idle");
    setIsOverlayVisible(true);
  };
  const beginTranscriptionTransition = () => {
    if (finishTimeoutRef.current) window.clearTimeout(finishTimeoutRef.current);
    if (spinnerHideTimeoutRef.current) window.clearTimeout(spinnerHideTimeoutRef.current);
    finishTimeoutRef.current = null;
    spinnerHideTimeoutRef.current = null;
    updateCapsulePhase("closing");
    setSpinnerPhase("visible");
    setOverlayLayoutMode("spinner");
    updateState("transcribing");
  };
  const stageWidth =
    overlayLayoutMode === "spinner" && capsuleMounted && capsulePhase === "idle"
      ? OVERLAY_WIDTH
      : overlayNotice
        ? overlayNotice.width
        : CAPSULE_CONTENT_WIDTH + OVERLAY_WINDOW_BUFFER_X * 2;
  const stageHeight =
    overlayLayoutMode === "spinner"
      ? OVERLAY_HEIGHT
      : overlayNotice
        ? overlayNotice.minHeight
        : Math.max(OVERLAY_HEIGHT, BASE_HEIGHT + 8);
  useEffect(() => {
    const syncSettings = () => {
      uiSettingsRef.current = readAppSettings();
      setOverlayScale(uiSettingsRef.current.overlayScale);
      appLocaleRef.current = readAppLocale();
    };
    syncSettings();
    window.addEventListener("storage", syncSettings);
    window.addEventListener("focus", syncSettings);
    return () => {
      window.removeEventListener("storage", syncSettings);
      window.removeEventListener("focus", syncSettings);
    };
  }, [setOverlayScale]);

  const cleanupAudioResources = async (
    stream: MediaStream | null = mediaStreamRef.current,
    audioContext: AudioContext | null = audioContextRef.current,
    waveformAnimation = waveformAnimationRef.current,
    resetVisualState = true,
  ) => {
    const isCurrentStream = mediaStreamRef.current === stream;
    const isCurrentAudioContext = audioContextRef.current === audioContext;
    const isCurrentWaveformAnimation = waveformAnimationRef.current === waveformAnimation;
    stream?.getTracks().forEach((track) => track.stop());
    if (waveformAnimation) cancelAnimationFrame(waveformAnimation);
    if (audioContext) await audioContext.close().catch(console.error);
    if (isCurrentStream) mediaStreamRef.current = null;
    if (isCurrentAudioContext) audioContextRef.current = null;
    if (isCurrentWaveformAnimation) waveformAnimationRef.current = null;
    if (isCurrentAudioContext) {
      analyserRef.current = null;
      dataArrayRef.current = null;
    }
    if (resetVisualState) {
      waveformTimeRef.current = 0;
      speechLevelRef.current = 0;
      setWaveformLevels(createEmptyWaveformLevels());
    }
  };

  const isOverlayJobActive = () =>
    isStartingRef.current ||
    capturePhaseRef.current !== "idle" ||
    currentRecordingRef.current !== null ||
    pendingTranscriptionsRef.current > 0 ||
    stateRef.current === "recording";

  useEffect(() => {
    const scheduleOverlayHideIfIdle = () => {
      if (finishTimeoutRef.current) window.clearTimeout(finishTimeoutRef.current);
      if (spinnerHideTimeoutRef.current) window.clearTimeout(spinnerHideTimeoutRef.current);
      if (overlayNoticeRef.current && !overlayNoticeRef.current.autoDismiss) {
        return;
      }
      if (isOverlayJobActive()) {
        return;
      }
      finishTimeoutRef.current = window.setTimeout(() => {
        if (isOverlayJobActive()) {
          return;
        }
        updateState("idle");
        spinnerHideTimeoutRef.current = window.setTimeout(async () => {
          if (isOverlayJobActive()) {
            return;
          }
          setIsOverlayVisible(false);
          updateCapsulePhase("idle");
          setCapsuleMounted(false);
          setSpinnerPhase("hidden");
          await invoke("hide_overlay_window");
        }, shouldReduceMotion ? 220 : CAPSULE_COLLAPSE_DURATION * 1000 + 160);
      }, shouldReduceMotion ? 180 : CAPSULE_COLLAPSE_DURATION * 1000);
    };

    const flushPastedTranscriptions = async () => {
      const combinedText = pendingPasteTextRef.current.trim();
      if (!combinedText) {
        return;
      }
      try {
        const pasteResult = await invoke<string>("type_text", { text: `${combinedText} `, useClipboardPaste: true });
        await invoke("log_to_terminal", {
          msg: `[Paste Result] ${pasteResult}`,
        }).catch((err) => console.error("log_to_terminal failed:", err));
      } catch (error) {
        await invoke("log_to_terminal", {
          msg: `[Paste Flush Error] ${error}`,
        }).catch((err) => console.error("log_to_terminal failed:", err));
        throw error;
      } finally {
        pendingPasteTextRef.current = "";
      }
    };

    const MAX_PENDING_PASTE_LENGTH = 5000;

    const queueTranscriptionPaste = (text: string) => {
      const normalizedText = text.trim();
      if (!normalizedText) {
        return;
      }
      const nextText = pendingPasteTextRef.current
        ? `${pendingPasteTextRef.current} ${normalizedText}`
        : normalizedText;
      pendingPasteTextRef.current =
        nextText.length > MAX_PENDING_PASTE_LENGTH
          ? nextText.slice(-MAX_PENDING_PASTE_LENGTH)
          : nextText;
    };

    const processTranscriptionJob = async (recording: ActiveRecording) => {
      if (processedRecordingIdsRef.current.has(recording.id)) {
        return;
      }
      processedRecordingIdsRef.current.add(recording.id);
      let keepOverlayVisible = false;
      capturePhaseRef.current = "transcribing";
      recordingSessionActiveRef.current = false;
      pendingTranscriptionsRef.current += 1;
      uiSettingsRef.current = readAppSettings();
      if (stopSoundRef.current) stopSoundRef.current.volume = uiSettingsRef.current.soundVolume;
      if (uiSettingsRef.current.playStopSound) void stopSoundRef.current?.play().catch((err) => console.error("Stop sound play failed:", err));
      const activeStream = recording.stream;
      const activeAudioContext = recording.audioContext;
      const activeWaveformAnimation = recording.waveformAnimation;
      let recordedBlob: Blob | null = null;
      if (recording.mediaRecorder.state !== "inactive") {
        recordedBlob = await new Promise<Blob>((resolve, reject) => {
          recording.mediaRecorder.onstop = () => {
            resolve(new Blob(recording.chunks, { type: recording.mimeType || recording.mediaRecorder.mimeType || "audio/webm" }));
          };
          recording.mediaRecorder.onerror = (event) => reject((event as ErrorEvent).error ?? new Error("MediaRecorder failed"));
          recording.mediaRecorder.stop();
        });
      }
      try {
        if (!recordedBlob || recordedBlob.size === 0 || !recording.hadSpeech) throw new Error("silent_audio");
        await invoke("start_transcription");
        const text = await transcribeAudio(recordedBlob);
        queueTranscriptionPaste(text);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.toLowerCase() === "silent_audio") {
          return;
        }
        if (errorMessage.toLowerCase() === "empty_transcription") {
          return;
        }
        if (errorMessage.toLowerCase() === "transcription_timeout") {
          return;
        }
        if (errorMessage.toLowerCase().includes("invalid_audio")) {
          return;
        }
        const overlayError = classifyOverlayError(errorMessage);
        const showableErrorCodes = new Set([
          "auth_required",
          "insufficient_credits",
          "ctrl_v_send_failed",
          "profile_unavailable",
          "provider_unavailable",
          "history_store_failed",
        ]);
        if (showableErrorCodes.has(overlayError.code)) {
          keepOverlayVisible = true;
          await showOverlayNotice(overlayError);
        }
        return;
      } finally {
        pendingTranscriptionsRef.current = Math.max(0, pendingTranscriptionsRef.current - 1);
        await cleanupAudioResources(
          activeStream,
          activeAudioContext,
          activeWaveformAnimation,
          !isOverlayJobActive(),
        );
      await invoke("finish_transcription").catch((err) => console.error("finish_transcription failed:", err));
      if (!currentRecordingRef.current && !isStartingRef.current && pendingTranscriptionsRef.current === 0) {
        capturePhaseRef.current = "idle";
      }
      if (!currentRecordingRef.current && !isStartingRef.current && pendingTranscriptionsRef.current === 0 && pendingPasteTextRef.current.trim()) {
        await flushPastedTranscriptions().catch((error) => {
          console.error("Failed to flush pending transcription text:", error);
        });
      }
      if (!keepOverlayVisible && !currentRecordingRef.current && !isStartingRef.current && pendingTranscriptionsRef.current === 0) {
        updateState("idle");
        updateCapsulePhase("idle");
        setCapsuleMounted(false);
        setSpinnerPhase("hidden");
        setOverlayLayoutMode("capsule");
        setIsOverlayVisible(false);
        await invoke("hide_overlay_window").catch((err) => console.error("hide_overlay_window failed:", err));
        return;
      }
      scheduleOverlayHideIfIdle();
      }
    };
    const startRealRecording = async () => {
      if (isStartingRef.current || currentRecordingRef.current || recordingSessionActiveRef.current) return;
      isStartingRef.current = true;
      capturePhaseRef.current = "arming";
      uiSettingsRef.current = readAppSettings();
      if (finishTimeoutRef.current) window.clearTimeout(finishTimeoutRef.current);
      if (spinnerHideTimeoutRef.current) window.clearTimeout(spinnerHideTimeoutRef.current);
      setOverlayNotice(null);
      setOverlayLayoutMode("capsule");
      setSpinnerPhase("hidden");
      setCapsuleMounted(true);
      updateCapsulePhase("expanding");
      updateState("recording");
      setIsOverlayVisible(uiSettingsRef.current.showOverlay);
      if (uiSettingsRef.current.playStartSound) {
        void startSoundRef.current?.play().catch((err) => console.error("Start sound play failed:", err));
      }
      window.setTimeout(() => {
        if (stateRef.current === "recording") {
          updateCapsulePhase("settled");
        }
      }, shouldReduceMotion ? 80 : CAPSULE_EXPAND_DURATION * 1000);
      await invoke("resize_overlay_window_command", {
        width: stageWidth * uiSettingsRef.current.overlayScale,
        height: (OVERLAY_HEIGHT + 12) * uiSettingsRef.current.overlayScale,
      });
      try {
        const stream = await requestPreferredAudioStream();
        mediaStreamRef.current = stream;
        if (stateRef.current === "idle" || stateRef.current === "finished") return;
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.82;
        analyserRef.current = analyser;
        audioContext.createMediaStreamSource(stream).connect(analyser);
        const dataArray = new Float32Array(analyser.fftSize);
        dataArrayRef.current = dataArray;
        const mimeType = getPreferredRecordingMimeType();
        const audioBitsPerSecond = getPreferredRecordingAudioBitsPerSecond();
        const mediaRecorder = mimeType
          ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond })
          : new MediaRecorder(stream, { audioBitsPerSecond });
        const recordingId = ++activeRecordingIdRef.current;
        const activeRecording: ActiveRecording = {
          id: recordingId,
          startedAtMs: Date.now(),
          lastSpeechAtMs: null,
          mediaRecorder,
          stream,
          audioContext,
          analyser,
          dataArray,
          waveformAnimation: null,
          mimeType: mediaRecorder.mimeType || mimeType || "audio/webm",
          chunks: [],
          hadSpeech: false,
        };
        recordingSessionActiveRef.current = true;
        currentRecordingRef.current = activeRecording;
        capturePhaseRef.current = "capturing";
        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) activeRecording.chunks.push(event.data);
        };
        mediaRecorder.start();
        const updateWaveform = () => {
          if (stateRef.current === "recording" && currentRecordingRef.current?.id === recordingId) {
            analyser.getFloatTimeDomainData(dataArray);
            waveformTimeRef.current += 1;
            let sumSquares = 0;
            let peak = 0;
            for (const sample of dataArray) {
              const absolute = Math.abs(sample ?? 0);
              sumSquares += (sample ?? 0) * (sample ?? 0);
              if (absolute > peak) peak = absolute;
            }
            const rms = Math.sqrt(sumSquares / dataArray.length);
            const activityLevel = rms * 0.72 + peak * 0.28;
            const rawLevel = activityLevel * WAVEFORM_GAIN;
            speechLevelRef.current = speechLevelRef.current * (1 - WAVEFORM_SMOOTHING) + Math.max(0, Math.min(1, rawLevel)) * WAVEFORM_SMOOTHING;
            const hasSpeech = speechLevelRef.current > RECORDING_SPEECH_THRESHOLD || rawLevel > RECORDING_SPEECH_RAW_THRESHOLD;
            if (hasSpeech) {
              activeRecording.hadSpeech = true;
              activeRecording.lastSpeechAtMs = Date.now();
            }
            setWaveformLevels(createDisplayWaveformLevels(waveformTimeRef.current, speechLevelRef.current));
            activeRecording.waveformAnimation = requestAnimationFrame(updateWaveform);
            waveformAnimationRef.current = activeRecording.waveformAnimation;
          }
        };
        updateWaveform();
      } catch (error) {
        console.error("Microphone start failed:", error);
        capturePhaseRef.current = "idle";
        await invoke("finish_transcription").catch((err) => console.error("finish_transcription failed:", err));
        isStartingRef.current = false;
        await showOverlayNotice({ kind: "error", code: "microphone_unavailable" } as OverlayNoticePayload);
      } finally {
        if (!currentRecordingRef.current && capturePhaseRef.current === "arming") {
          capturePhaseRef.current = "idle";
        }
        isStartingRef.current = false;
      }
    };
    let unlistenRecordingStarted: (() => void) | undefined;
    let unlistenRecordingStopped: (() => void) | undefined;
    let unlistenTranscriptionPrefetch: (() => void) | undefined;
    void (async () => {
      unlistenRecordingStarted = await listen("recording-started", () => {
        void startRealRecording();
      });
      unlistenTranscriptionPrefetch = await listen("transcription-prefetch", () => {
        void prefetchTranscriptionReadiness().catch((error) => {
          console.warn("Failed to prefetch transcription readiness:", error);
        });
      });
      unlistenRecordingStopped = await listen("recording-stopped", () => {
        if (!currentRecordingRef.current) {
          return;
        }
        const finishedRecording = currentRecordingRef.current;
        recordingSessionActiveRef.current = false;
        currentRecordingRef.current = null;
        mediaStreamRef.current = null;
        audioContextRef.current = null;
        analyserRef.current = null;
        dataArrayRef.current = null;
        waveformAnimationRef.current = null;
        beginTranscriptionTransition();
        void processTranscriptionJob(finishedRecording);
      });
    })();
    return () => {
      unlistenRecordingStarted?.();
      unlistenTranscriptionPrefetch?.();
      unlistenRecordingStopped?.();
      if (currentRecordingRef.current) {
        currentRecordingRef.current = { ...currentRecordingRef.current, lastSpeechAtMs: null };
      }
      processedRecordingIdsRef.current.clear();
      recordingSessionActiveRef.current = false;
      void cleanupAudioResources();
    };
  }, []);

  return {
    recordingState,
    capsulePhaseStartedAt,
    overlayNotice,
    overlayPresentationVersion,
    isOverlayVisible,
    waveformLevels,
    capsulePhase,
    capsuleMounted,
    spinnerPhase,
    overlayLayoutMode,
    overlayScale,
    setOverlayNotice,
    clearOverlayNotice,
    openAppFromOverlay,
    replayTranscriptionPresentation,
    stageWidth,
    stageHeight,
    setCapsulePhase,
    setCapsuleMounted,
    setSpinnerPhase,
    setOverlayLayoutMode,
    setOverlayPresentationVersion,
    setIsOverlayVisible,
    setWaveformLevels,
    setOverlayScale,
    shouldReduceMotion,
    uiSettingsRef,
  };
}
