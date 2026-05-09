"use client";

import { motion } from "motion/react";
import { OverlayIconGlyph } from "@/components/overlay/OverlayIconGlyph";
import { OverlayProgressRing } from "@/components/overlay/OverlayProgressRing";

type TransitioningOverlayIconProps = {
  phase: "idle" | "expanding" | "settled" | "closing";
  spinnerPhase: "hidden" | "closing" | "visible";
  x: number;
  height: number;
  iconSize: number;
  innerSize: number;
  reduceMotion: boolean;
  progress: number;
};

const TRANSITION_EASE = [0.25, 0.1, 0.25, 1] as const;

export function TransitioningOverlayIcon({
  phase,
  spinnerPhase,
  x,
  height,
  iconSize,
  innerSize,
  reduceMotion,
  progress,
}: TransitioningOverlayIconProps) {
  const isClosing = phase === "closing";
  const isExpanding = phase === "expanding";
  const show = phase !== "idle" || spinnerPhase !== "hidden";
  const travelRotate = phase === "idle" ? 0 : phase === "closing" ? 0 : -360;
  const showProgress = spinnerPhase === "visible" && progress > 0;

  return (
    <motion.div
      initial={false}
      animate={{
        left: x,
        y: 0,
        rotate: travelRotate,
        opacity: 1,
      }}
      transition={{
        left: { duration: reduceMotion ? 0.24 : isClosing ? 0.11 : isExpanding ? 0.28 : 0.16, ease: TRANSITION_EASE },
        rotate: { duration: reduceMotion ? 0.24 : isClosing ? 0.11 : isExpanding ? 0.28 : 0.16, ease: TRANSITION_EASE },
        y: { duration: reduceMotion ? 0.1 : 0.14, ease: TRANSITION_EASE },
        opacity: { duration: 0, ease: TRANSITION_EASE },
      }}
      style={{
        position: "absolute",
        left: `${x}px`,
        top: "50%",
        width: `${iconSize}px`,
        height: `${height}px`,
        display: "grid",
        placeItems: "center",
        zIndex: 12,
        willChange: "left, transform, opacity",
        x: "-50%",
        translateY: "-50%",
      }}
    >
      {show ? (
        <div style={{ position: "relative", width: `${iconSize}px`, height: `${iconSize}px`, display: "grid", placeItems: "center" }}>
          <OverlayProgressRing size={iconSize} progress={progress} visible={showProgress} />
          <OverlayIconGlyph innerSize={innerSize} reduceMotion={reduceMotion} center opacity={1} />
        </div>
      ) : null}
    </motion.div>
  );
}
