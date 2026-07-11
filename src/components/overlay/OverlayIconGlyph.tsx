"use client";

import { motion } from "motion/react";
import iconImage from "@/assets/overlay-transparent.png";

type OverlayIconGlyphProps = {
  innerSize: number;
  reduceMotion: boolean;
  rotate?: boolean;
  center?: boolean;
  opacity?: number;
};

export function OverlayIconGlyph({ innerSize, reduceMotion, rotate = false, center = false, opacity = 1 }: OverlayIconGlyphProps) {
  return (
    <motion.img
      src={iconImage}
      alt="WhisperType"
      draggable={false}
      aria-hidden="true"
      animate={rotate ? { rotate: 360 } : { rotate: 0 }}
      transition={
        rotate
          ? {
              duration: reduceMotion ? 1.8 : 4.8,
              repeat: Infinity,
              ease: "linear",
            }
          : { duration: reduceMotion ? 0.12 : 0.18, ease: [0.25, 0.1, 0.25, 1] }
      }
      style={{
        opacity,
        width: `${innerSize}px`,
        height: `${innerSize}px`,
        objectFit: "contain",
        display: "block",
        transformOrigin: "50% 50%",
        willChange: "transform",
        transform: center ? "translateZ(0)" : "translateZ(0)",
        position: "relative",
        zIndex: 4,
      }}
    />
  );
}
