"use client";

import { motion } from "motion/react";
import { OverlayIconGlyph } from "@/components/overlay/OverlayIconGlyph";

type TransitioningOverlayIconProps = {
  phase: "idle" | "expanding" | "settled" | "closing";
  spinnerPhase: "hidden" | "closing" | "visible";
  x: number;
  height: number;
  iconSize: number;
  innerSize: number;
  reduceMotion: boolean;
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
}: TransitioningOverlayIconProps) {
  const isClosing = phase === "closing";
  const isExpanding = phase === "expanding";
  const show = phase !== "idle" || spinnerPhase !== "hidden";
  const rotateInfinite = spinnerPhase === "visible";
  const travelRotate = phase === "idle" ? 0 : phase === "closing" ? 0 : -360;

  return (
    <motion.div
      initial={false}
      animate={{
        x,
        y: 0,
        rotate: travelRotate,
        opacity: 1,
      }}
      transition={{
        x: { duration: reduceMotion ? 0.24 : isClosing ? 0.11 : isExpanding ? 0.28 : 0.16, ease: TRANSITION_EASE },
        rotate: { duration: reduceMotion ? 0.24 : isClosing ? 0.11 : isExpanding ? 0.28 : 0.16, ease: TRANSITION_EASE },
        y: { duration: reduceMotion ? 0.1 : 0.14, ease: TRANSITION_EASE },
        opacity: { duration: 0, ease: TRANSITION_EASE },
      }}
      style={{
        position: "absolute",
        left: "0px",
        top: "50%",
        width: `${iconSize}px`,
        height: `${height}px`,
        display: "grid",
        placeItems: "center",
        zIndex: 12,
        willChange: "transform, opacity",
        transform: "translateZ(0)",
        marginTop: `${-height / 2}px`,
      }}
    >
      {show ? <OverlayIconGlyph innerSize={innerSize} reduceMotion={reduceMotion} rotate={rotateInfinite} center opacity={1} /> : null}
    </motion.div>
  );
}
