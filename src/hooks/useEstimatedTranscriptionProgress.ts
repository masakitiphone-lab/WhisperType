import { useCallback, useRef, useState } from "react";

const MAX_ESTIMATED_PROGRESS = 90;
const MIN_ESTIMATED_MS = 2200;
const MAX_ESTIMATED_MS = 16000;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function estimateTranscriptionMs(byteSize: number) {
  return clamp(1800 + byteSize / 90, MIN_ESTIMATED_MS, MAX_ESTIMATED_MS);
}

function easeOutCubic(value: number) {
  const clamped = clamp(value, 0, 1);
  return 1 - Math.pow(1 - clamped, 3);
}

export function useEstimatedTranscriptionProgress() {
  const [progress, setProgress] = useState(0);
  const frameRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setProgress(0);
  }, [stop]);

  const start = useCallback((byteSize: number) => {
    stop();
    const startedAt = performance.now();
    const estimatedMs = estimateTranscriptionMs(byteSize);

    const tick = () => {
      const elapsedRatio = (performance.now() - startedAt) / estimatedMs;
      setProgress(Math.round(easeOutCubic(elapsedRatio) * MAX_ESTIMATED_PROGRESS));
      if (elapsedRatio < 1) {
        frameRef.current = window.requestAnimationFrame(tick);
      }
    };

    setProgress(1);
    frameRef.current = window.requestAnimationFrame(tick);
  }, [stop]);

  const complete = useCallback(() => {
    stop();
    setProgress(100);
  }, [stop]);

  return { progress, start, complete, reset };
}
