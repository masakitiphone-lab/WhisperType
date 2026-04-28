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

export const RECORDING_SPEECH_THRESHOLD = 0.06;
export const RECORDING_SPEECH_RAW_THRESHOLD = 0.09;
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
