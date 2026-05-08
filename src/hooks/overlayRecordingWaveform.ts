import type { MutableRefObject } from "react";
import {
  WAVEFORM_BAR_COUNT,
  WAVEFORM_FLOW_SPEED,
  WAVEFORM_IDLE_BASE_LEVEL,
  WAVEFORM_IDLE_WAVE_SIZE,
  WAVEFORM_PHASE_STEP,
  WAVEFORM_SPEECH_BASE_LEVEL,
  WAVEFORM_SPEECH_BOOST,
  WAVEFORM_SPEECH_SMOOTHING,
  WAVEFORM_SPEECH_WAVE_SIZE,
  WAVEFORM_VISUAL_GAIN,
} from "@/lib/overlayLayout";

export type CapsulePhase = "idle" | "expanding" | "settled" | "closing";
export type CapturePhase = "idle" | "arming" | "capturing" | "transcribing";

export type ActiveRecording = {
  id: number;
  startedAtMs: number;
  lastSpeechAtMs: number | null;
  mediaRecorder: MediaRecorder;
  stream: MediaStream;
  audioContext: AudioContext;
  analyser: AnalyserNode;
  dataArray: Float32Array;
  waveformAnimation: number | null;
  mimeType: string;
  chunks: Blob[];
  hadSpeech: boolean;
};

export const RECORDING_SPEECH_THRESHOLD = 0.14;
export const RECORDING_SPEECH_RAW_THRESHOLD = 0.26;
export const WAVEFORM_SMOOTHING = WAVEFORM_SPEECH_SMOOTHING;
export const WAVEFORM_GAIN = WAVEFORM_VISUAL_GAIN;

export const createEmptyWaveformLevels = () => Array.from({ length: WAVEFORM_BAR_COUNT }, () => 0);

const getWaveEdgeMuffler = (index: number) => Math.sin(((index + 0.5) / WAVEFORM_BAR_COUNT) * Math.PI);

export const createDisplayWaveformLevels = (time: number, speechLevel: number) =>
  Array.from({ length: WAVEFORM_BAR_COUNT }, (_, index) => {
    const phase = (index - time * WAVEFORM_FLOW_SPEED) * WAVEFORM_PHASE_STEP;
    const baseWave = Math.sin(phase) * WAVEFORM_IDLE_WAVE_SIZE;
    const activeWave = (Math.sin(phase) * 0.5 + 0.5) * WAVEFORM_SPEECH_WAVE_SIZE + WAVEFORM_SPEECH_BASE_LEVEL;
    const edgeMuffler = getWaveEdgeMuffler(index);
    const speechWave = speechLevel * activeWave * WAVEFORM_SPEECH_BOOST;
    const level = (WAVEFORM_IDLE_BASE_LEVEL + baseWave + speechWave) * edgeMuffler;
    return Math.max(0.02, Math.min(1, level));
  });

type RecordingState = "idle" | "recording" | "transcribing" | "finished";

type RecordingWaveformAnimationOptions = {
  currentRecordingRef: MutableRefObject<ActiveRecording | null>;
  speechLevelRef: MutableRefObject<number>;
  stateRef: MutableRefObject<RecordingState>;
  waveformAnimationRef: MutableRefObject<number | null>;
  waveformTimeRef: MutableRefObject<number>;
  setWaveformLevels: (levels: number[]) => void;
};

export function startRecordingWaveformAnimation(
  activeRecording: ActiveRecording,
  {
    currentRecordingRef,
    speechLevelRef,
    stateRef,
    waveformAnimationRef,
    waveformTimeRef,
    setWaveformLevels,
  }: RecordingWaveformAnimationOptions,
) {
  const updateWaveform = () => {
    if (stateRef.current !== "recording" || currentRecordingRef.current?.id !== activeRecording.id) {
      return;
    }

    activeRecording.analyser.getFloatTimeDomainData(activeRecording.dataArray);
    waveformTimeRef.current += 1;
    let sumSquares = 0;
    let peak = 0;
    for (const sample of activeRecording.dataArray) {
      const value = sample ?? 0;
      const absolute = Math.abs(value);
      sumSquares += value * value;
      if (absolute > peak) peak = absolute;
    }

    const rms = Math.sqrt(sumSquares / activeRecording.dataArray.length);
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
  };

  updateWaveform();
}
