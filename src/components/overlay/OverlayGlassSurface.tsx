"use client";

import { motion } from "motion/react";
import { getLiquidGlassBaseStyle } from "@/components/overlay/liquidGlass";
import { getLiquidGlassTintStyle } from "@/components/overlay/liquidGlass";
import { getLiquidGlassAccentStyle } from "@/components/overlay/liquidGlassAccent";

type OverlayGlassSurfaceProps = {
  height: number;
  radius: number;
  targetWidth: number;
  reduceMotion: boolean;
  animateOpacity?: number;
  initialOpacity?: number;
  children?: React.ReactNode;
};

const TRANSITION_EASE = [0.25, 0.1, 0.25, 1] as const;

export function OverlayGlassSurface({
  height,
  radius,
  targetWidth,
  reduceMotion,
  animateOpacity = 1,
  initialOpacity = 0,
  children,
}: OverlayGlassSurfaceProps) {
  const liquidGlassStyle = getLiquidGlassBaseStyle("dark", reduceMotion);
  const liquidGlassAccent = getLiquidGlassAccentStyle("dark");
  const widthTransition = { type: "spring" as const, stiffness: 180, damping: 26, mass: 0.86, bounce: 0.06 };
  const borderRadiusTransition = { type: "spring" as const, stiffness: 220, damping: 28, mass: 0.74, bounce: 0.04 };

  return (
    <motion.div
      initial={{
        opacity: initialOpacity,
        width: `${height}px`,
        borderRadius: radius,
      }}
      animate={{
        opacity: animateOpacity,
        width: `${targetWidth}px`,
        borderRadius: radius,
        transition: {
          opacity: { duration: reduceMotion ? 0.16 : 0.24, ease: TRANSITION_EASE },
          width: reduceMotion ? { duration: 0.3, ease: TRANSITION_EASE } : widthTransition,
          borderRadius: reduceMotion ? { duration: 0.26, ease: TRANSITION_EASE } : borderRadiusTransition,
        },
      }}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: `${height}px`,
        height: `${height}px`,
        transform: "translate(-50%, -50%)",
        transformOrigin: "50% 50%",
        willChange: "width, border-radius, opacity",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          borderRadius: `${radius}px`,
          zIndex: 0,
          ...liquidGlassStyle,
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ borderRadius: "inherit", zIndex: 1, ...getLiquidGlassTintStyle("dark") }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            borderRadius: "inherit",
            zIndex: 1,
            boxShadow: `${liquidGlassAccent.highlightBorder}, ${liquidGlassAccent.shadowBorder}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            overflow: "hidden",
          }}
        >
          {children}
        </div>
      </div>
    </motion.div>
  );
}
