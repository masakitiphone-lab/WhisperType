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
import { readAppSettings, writeAppSettings } from "@/lib/appSettings";
import { buildOverlayNotice, type OverlayNoticePayload, type OverlayNoticeViewModel } from "@/lib/overlayNotice";
import { prefetchTranscriptionReadiness, transcribeAudio } from "@/services/transcription";
import { useRecordingSounds } from "@/hooks/useRecordingSounds";
import { createEmptyWaveformLevels, startRecordingWaveformAnimation, type ActiveRecording, type CapsulePhase, type CapturePhase } from "@/hooks/overlayRecordingWaveform";
import { assertRecordingHasSpeech, buildTranscriptionOverlayNotice, stopRecordingAndCreateBlob } from "@/hooks/overlayRecordingTranscription";
import { attachOverlayRecordingEventListeners } from "@/hooks/overlayRecordingEvents";
import { PasteFlushError, flushPastedTranscriptions, queueTranscriptionPaste } from "@/hooks/overlayRecordingPasteQueue";
import {
  CAPSULE_COLLAPSE_DURATION,
  CAPSULE_EXPAND_DURATION,
  getOverlayCapsuleStageHeight,
  getOverlayCapsuleStageWidth,
  getOverlayNoticeContentHeight,
  getOverlayNoticeStageHeight,
  getOverlayNoticeStageWidth,
} from "@/lib/overlayLayout";
import { readOverlayLayoutPreferences, resizeOverlayWindowForPreferences, type OverlayLayoutPreferences } from "@/lib/overlayLayoutPreferences";

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
  const isOverlayVisibleRef = useRef(false);
  const stageWidthRef = useRef(getOverlayCapsuleStageWidth());
  const stageHeightRef = useRef(getOverlayCapsuleStageHeight());
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
  const overlayGenerationRef = useRef(0);
  const pendingStopWhileStartingRef = useRef(false);
  const { startSoundRef, stopSoundRef } = useRecordingSounds();
  const uiSettingsRef = useRef(readAppSettings());
  const appLocaleRef = useRef<AppLocale>(readAppLocale());
  const shouldReduceMotion = !!useReducedMotion();
  overlayNoticeRef.current = overlayNotice;
  isOverlayVisibleRef.current = isOverlayVisible;
  const overlayGenerationIsCurrent = (generation: number) => generation === overlayGenerationRef.current;
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
    const hideGeneration = overlayGenerationRef.current;
    noticeDismissTimeoutRef.current = window.setTimeout(async () => {
      if (!overlayGenerationIsCurrent(hideGeneration)) {
        return;
      }
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
  const stageWidth = overlayNotice ? getOverlayNoticeStageWidth(overlayNotice.width) : getOverlayCapsuleStageWidth();
  const stageHeight = overlayNotice ? getOverlayNoticeStageHeight(getOverlayNoticeContentHeight(overlayNotice)) : getOverlayCapsuleStageHeight();
  stageWidthRef.current = stageWidth;
  stageHeightRef.current = stageHeight;
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
  useEffect(() => {
    let unlistenOverlaySettingsChanged: (() => void) | undefined;
    let isListenerSetupCancelled = false;
    void (async () => {
      const overlaySettingsChangedListener = await listen<OverlayLayoutPreferences>("overlay-settings-changed", async (event) => {
        writeAppSettings(event.payload);
        uiSettingsRef.current = {
          ...readAppSettings(),
          ...event.payload,
        };
        setOverlayScale(uiSettingsRef.current.overlayScale);
        if (!isOverlayVisibleRef.current) {
          return;
        }
        await resizeOverlayWindowForPreferences(
          stageWidthRef.current,
          stageHeightRef.current,
          uiSettingsRef.current,
        ).catch((err) => console.error("resize_overlay_window_command failed:", err));
      });
      if (isListenerSetupCancelled) {
        overlaySettingsChangedListener();
        return;
      }
      unlistenOverlaySettingsChanged = overlaySettingsChangedListener;
    })();
    return () => {
      isListenerSetupCancelled = true;
      unlistenOverlaySettingsChanged?.();
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
      const hideGeneration = overlayGenerationRef.current;
      if (overlayNoticeRef.current && !overlayNoticeRef.current.autoDismiss) {
        return;
      }
      if (isOverlayJobActive()) {
        return;
      }
      finishTimeoutRef.current = window.setTimeout(() => {
        if (!overlayGenerationIsCurrent(hideGeneration) || isOverlayJobActive()) {
          return;
        }
        updateState("idle");
        spinnerHideTimeoutRef.current = window.setTimeout(async () => {
          if (!overlayGenerationIsCurrent(hideGeneration) || isOverlayJobActive()) {
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
    const showOverlayWindowForCurrentSettings = async (generation: number) => {
      const overlayLayoutPreferences = await readOverlayLayoutPreferences();
      uiSettingsRef.current = {
        ...readAppSettings(),
        ...overlayLayoutPreferences,
      };
      if (!uiSettingsRef.current.showOverlay || !overlayGenerationIsCurrent(generation)) {
        return;
      }
      await resizeOverlayWindowForPreferences(
        stageWidth,
        stageHeight,
        uiSettingsRef.current,
      ).catch((err) => console.error("resize_overlay_window_command failed:", err));
      if (!overlayGenerationIsCurrent(generation)) {
        return;
      }
      await invoke("show_overlay_window").catch((err) => console.error("show_overlay_window failed:", err));
    };
    const processTranscriptionJob = async (recording: ActiveRecording) => {
      if (processedRecordingIdsRef.current.has(recording.id)) {
        return;
      }
      const jobOverlayGeneration = overlayGenerationRef.current;
      processedRecordingIdsRef.current.add(recording.id);
      let keepOverlayVisible = false;
      capturePhaseRef.current = "transcribing";
      recordingSessionActiveRef.current = false;
      pendingTranscriptionsRef.current += 1;
      uiSettingsRef.current = readAppSettings();
      const activeStream = recording.stream;
      const activeAudioContext = recording.audioContext;
      const activeWaveformAnimation = recording.waveformAnimation;
      const recordedBlob = await stopRecordingAndCreateBlob(recording);
      await cleanupAudioResources(activeStream, activeAudioContext, activeWaveformAnimation, false);
      try {
        const transcribableBlob = await assertRecordingHasSpeech(recordedBlob, recording.hadSpeech);
        await invoke("start_transcription");
        const text = await transcribeAudio(transcribableBlob);
        queueTranscriptionPaste(pendingPasteTextRef, text);
        void prefetchTranscriptionReadiness().catch((err) => {
          console.warn("Post-transcription prefetch failed:", err);
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Transcription job failed:", {
          errorMessage,
          errorName: error instanceof Error ? error.name : typeof error,
          rawError: error,
        });
        const overlayError = buildTranscriptionOverlayNotice(errorMessage);
        if (overlayError) {
          keepOverlayVisible = true;
          await showOverlayNotice(overlayError);
        }
        return;
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
        await flushPastedTranscriptions(pendingPasteTextRef).then(() => {
          uiSettingsRef.current = readAppSettings();
          if (stopSoundRef.current) stopSoundRef.current.volume = uiSettingsRef.current.soundVolume;
          if (uiSettingsRef.current.playStopSound) void stopSoundRef.current?.play().catch((err) => console.error("Success sound play failed:", err));
        }).catch(async (error) => {
          console.error("Failed to flush pending transcription text:", error);
          if (error instanceof PasteFlushError) {
            keepOverlayVisible = true;
            await showOverlayNotice({
              kind: "manual_copy",
              code: error.message || "paste_failed",
              text: error.text,
            });
          }
        });
      }
      if (
        overlayGenerationIsCurrent(jobOverlayGeneration) &&
        !keepOverlayVisible &&
        !currentRecordingRef.current &&
        !isStartingRef.current &&
        pendingTranscriptionsRef.current === 0
      ) {
        scheduleOverlayHideIfIdle();
        return;
      }
      if (keepOverlayVisible) {
        return;
      }
      scheduleOverlayHideIfIdle();
      }
    };
    const startRealRecording = async () => {
      if (isStartingRef.current || currentRecordingRef.current || recordingSessionActiveRef.current) {
        const activeGeneration = overlayGenerationRef.current;
        setIsOverlayVisible(readAppSettings().showOverlay);
        await showOverlayWindowForCurrentSettings(activeGeneration);
        return;
      }
      const recordingGeneration = overlayGenerationRef.current + 1;
      overlayGenerationRef.current = recordingGeneration;
      pendingStopWhileStartingRef.current = false;
      isStartingRef.current = true;
      capturePhaseRef.current = "arming";
      uiSettingsRef.current = readAppSettings();
      if (finishTimeoutRef.current) window.clearTimeout(finishTimeoutRef.current);
      if (spinnerHideTimeoutRef.current) window.clearTimeout(spinnerHideTimeoutRef.current);
      if (noticeDismissTimeoutRef.current) window.clearTimeout(noticeDismissTimeoutRef.current);
      finishTimeoutRef.current = null;
      spinnerHideTimeoutRef.current = null;
      noticeDismissTimeoutRef.current = null;
      setOverlayNotice(null);
      setOverlayLayoutMode("capsule");
      setSpinnerPhase("hidden");
      setCapsuleMounted(true);
      updateCapsulePhase("expanding");
      updateState("recording");
      setIsOverlayVisible(uiSettingsRef.current.showOverlay);
      await showOverlayWindowForCurrentSettings(recordingGeneration);
      if (uiSettingsRef.current.playStartSound) {
        void startSoundRef.current?.play().catch((err) => console.error("Start sound play failed:", err));
      }
      window.setTimeout(() => {
        if (stateRef.current === "recording") {
          updateCapsulePhase("settled");
        }
      }, shouldReduceMotion ? 80 : CAPSULE_EXPAND_DURATION * 1000);
      try {
        const preferredAudioInputDeviceId = uiSettingsRef.current.preferredAudioInputDeviceId.trim();
        const stream = await requestPreferredAudioStream(preferredAudioInputDeviceId || undefined);
        mediaStreamRef.current = stream;
        if (stateRef.current === "idle" || stateRef.current === "finished") {
          await cleanupAudioResources(stream);
          return;
        }
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
        if (pendingStopWhileStartingRef.current) {
          pendingStopWhileStartingRef.current = false;
          recordingSessionActiveRef.current = false;
          currentRecordingRef.current = null;
          beginTranscriptionTransition();
          void processTranscriptionJob(activeRecording);
          return;
        }
        startRecordingWaveformAnimation(activeRecording, {
          currentRecordingRef,
          speechLevelRef,
          stateRef,
          waveformAnimationRef,
          waveformTimeRef,
          setWaveformLevels,
        });
      } catch (error) {
        console.error("Microphone start failed:", error);
        capturePhaseRef.current = "idle";
        pendingStopWhileStartingRef.current = false;
        await cleanupAudioResources();
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
    return attachOverlayRecordingEventListeners(
      {
        beginTranscriptionTransition,
        cleanupAudioResources: () => cleanupAudioResources(),
        processTranscriptionJob,
        startRealRecording,
      },
      {
        capturePhaseRef,
        currentRecordingRef,
        isStartingRef,
        pendingStopWhileStartingRef,
        processedRecordingIdsRef,
        recordingSessionActiveRef,
      },
    );
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
