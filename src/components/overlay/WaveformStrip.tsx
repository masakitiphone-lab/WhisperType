"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { WAVEFORM_BAR_STRIP_WIDTH, getWaveformLeftOffset } from "@/lib/overlayLayout";
import waveformGradientImage from "@/assets/waveform-gradient.png";

type WaveformStripProps = {
  show: boolean;
  showContent: boolean;
  isClosing: boolean;
  opacity: number;
  capsuleWidth: number;
  barWidth: number;
  barGap: number;
  barCount: number;
  barViewHeight: number;
  levels: number[];
  reduceMotion: boolean;
};

const TRANSITION_EASE = [0.25, 0.1, 0.25, 1] as const;
const WAVE_HISTORY_STEP_MS = 54;
const WAVE_MIN_LEVEL = 0.04;
const WAVE_SMOOTHING = 0.16;

type WaveBar = {
  amplitude: number;
};

export function WaveformStrip({
  show,
  showContent,
  isClosing,
  opacity,
  capsuleWidth,
  barWidth,
  barGap,
  barCount,
  barViewHeight,
  levels,
  reduceMotion,
}: WaveformStripProps) {
  const initialBars = useMemo(
    () => Array.from({ length: barCount }, () => ({ amplitude: WAVE_MIN_LEVEL })),
    [barCount],
  );
  const [waveBars, setWaveBars] = useState<WaveBar[]>(initialBars);
  const lastFrameRef = useRef(performance.now());
  const accumulatorRef = useRef(0);
  const waveTargetRef = useRef<WaveBar[]>(initialBars);
  const lastEnergyRef = useRef(0);
  const lastPeakRef = useRef(0);

  const energy = useMemo(() => {
    if (!levels.length) return 0;
    const sum = levels.reduce((acc, value) => acc + value, 0);
    return sum / levels.length;
  }, [levels]);

  useEffect(() => {
    const peak = levels.reduce((max, value) => Math.max(max, value), 0);
    const rising = Math.max(0, energy - lastEnergyRef.current);
    lastEnergyRef.current = energy;
    lastPeakRef.current = peak;

    const sourceLevel = Math.max(WAVE_MIN_LEVEL, Math.min(1, WAVE_MIN_LEVEL + energy * 0.9 + peak * 0.18 + rising * 2.8));

    const target = waveTargetRef.current.length ? waveTargetRef.current.slice() : initialBars.slice();
    target[0] = { amplitude: Math.max(target[0]?.amplitude ?? WAVE_MIN_LEVEL, sourceLevel) };
    waveTargetRef.current = target;
  }, [energy, initialBars, levels]);

  useEffect(() => {
    if (reduceMotion) {
      setWaveBars(initialBars);
      waveTargetRef.current = initialBars;
      return;
    }

    let frame = 0;
    const tick = () => {
      const now = performance.now();
      const delta = now - lastFrameRef.current;
      lastFrameRef.current = now;
      accumulatorRef.current += delta;

      const shiftCount = Math.floor(accumulatorRef.current / WAVE_HISTORY_STEP_MS);
      if (shiftCount > 0) {
        accumulatorRef.current -= shiftCount * WAVE_HISTORY_STEP_MS;
        waveTargetRef.current = waveTargetRef.current.length ? waveTargetRef.current.slice() : initialBars.slice();
        for (let step = 0; step < shiftCount; step += 1) {
          const next = waveTargetRef.current.slice();
          for (let index = next.length - 1; index > 0; index -= 1) {
            next[index] = {
              amplitude: Math.max(WAVE_MIN_LEVEL, next[index - 1]?.amplitude ?? WAVE_MIN_LEVEL),
            };
          }
          next[0] = {
            amplitude: Math.max(
              WAVE_MIN_LEVEL,
              Math.min(1, WAVE_MIN_LEVEL + lastPeakRef.current * 0.24 + lastEnergyRef.current * 0.18),
            ),
          };
          waveTargetRef.current = next;
        }
      }

      setWaveBars((current) => {
        const target = waveTargetRef.current.length ? waveTargetRef.current : initialBars;
        const next = current.length ? current.slice() : initialBars.slice();
        for (let index = 0; index < next.length; index += 1) {
          const targetLevel = target[index]?.amplitude ?? WAVE_MIN_LEVEL;
          const currentLevel = next[index]?.amplitude ?? WAVE_MIN_LEVEL;
          next[index] = {
            amplitude: currentLevel + (targetLevel - currentLevel) * WAVE_SMOOTHING,
          };
        }
        return next;
      });

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [initialBars, reduceMotion]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 3,
        width: "100%",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: `${capsuleWidth}px`,
          height: "100%",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: `${getWaveformLeftOffset(capsuleWidth, WAVEFORM_BAR_STRIP_WIDTH)}px`,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            width: `${WAVEFORM_BAR_STRIP_WIDTH}px`,
            height: `${barViewHeight}px`,
            gap: `${barGap}px`,
          }}
        >
          <motion.div
            initial={false}
            animate={{
              opacity: show && showContent && !isClosing ? opacity : 0,
              y: show && showContent && !isClosing ? 0 : 2,
              transition: { duration: reduceMotion ? 0.08 : 0.16, ease: TRANSITION_EASE },
            }}
            style={{
              position: "relative",
              flex: "1 1 auto",
              minWidth: 0,
              height: `${barViewHeight}px`,
              overflow: "hidden",
              zIndex: 4,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: "50% 0 auto 0",
                height: `${barViewHeight}px`,
                transform: "translateY(-50%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: `${barGap}px`,
              }}
            >
              {waveBars.map((bar, index) => {
                const level = show ? bar.amplitude : 0;
                const gradientX = waveBars.length <= 1 ? 0 : index / (waveBars.length - 1);
                return (
                  <div
                    key={`wave-bar-${index}`}
                    style={{
                      width: `${barWidth}px`,
                      height: `${barViewHeight}px`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 1,
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        height: `${Math.max(2, level * (barViewHeight - 2))}px`,
                        borderRadius: "999px",
                        backgroundImage: `url(${waveformGradientImage})`,
                        backgroundRepeat: "no-repeat",
                        backgroundSize: `${Math.max(100, waveBars.length * 100)}% 100%`,
                        backgroundPosition: `${gradientX * 100}% 50%`,
                        boxShadow:
                          "inset 0 1px 0 rgba(255,255,255,0.36), inset 0 -3px 8px rgba(0,0,0,0.05), 0 0 10px rgba(255,255,255,0.14)",
                        filter: "saturate(0.58) brightness(1.12) contrast(0.92)",
                      }}
                    >
                      <div
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: "inherit",
                          background:
                            "linear-gradient(180deg, rgba(255,255,255,0.46) 0%, rgba(255,255,255,0.22) 16%, rgba(255,255,255,0.06) 42%, rgba(255,255,255,0) 68%)",
                          mixBlendMode: "screen",
                          pointerEvents: "none",
                        }}
                      />
                      <div
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          inset: "0 auto auto 0",
                          width: "100%",
                          height: "38%",
                          borderRadius: "999px 999px 10px 10px",
                          background: `linear-gradient(180deg, rgba(255,255,255,0.52) 0%, rgba(255,255,255,0.26) 28%, rgba(255,255,255,0.08) 64%, rgba(255,255,255,0) 100%)`,
                          mixBlendMode: "screen",
                          pointerEvents: "none",
                        }}
                      />
                      <div
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          inset: "auto 0 0 0",
                          height: "34%",
                          borderRadius: "10px 10px 999px 999px",
                          background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.03) 100%)",
                          pointerEvents: "none",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
