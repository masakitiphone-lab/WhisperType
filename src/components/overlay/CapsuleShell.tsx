"use client";

import { OverlayGlassSurface } from "@/components/overlay/OverlayGlassSurface";

type CapsuleShellProps = {
  show: boolean;
  width: number;
  height: number;
  radius: number;
  reduceMotion: boolean;
  phase: "idle" | "expanding" | "settled" | "closing";
  contentVisible: boolean;
  children: React.ReactNode;
};

export function CapsuleShell({
  show,
  width,
  height,
  radius,
  reduceMotion,
  phase,
  contentVisible,
  children,
}: CapsuleShellProps) {
  if (!show) {
    return null;
  }

  const isClosing = phase === "closing";
  const collapsedWidth = height;
  const targetWidth = isClosing ? collapsedWidth : width;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: `${width}px`,
        height: `${height}px`,
        transform: "translate(-50%, -50%)",
        zIndex: 1,
        pointerEvents: "none",
      }}
    >
      <OverlayGlassSurface
        height={height}
        radius={radius}
        targetWidth={targetWidth}
        reduceMotion={reduceMotion}
        animateOpacity={isClosing ? 0.92 : 1}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: contentVisible ? 1 : 0,
            transform: contentVisible ? "translateY(0px)" : "translateY(2px)",
            transition: reduceMotion ? "opacity 60ms ease, transform 60ms ease" : "opacity 80ms ease, transform 80ms ease",
          }}
        >
          {children}
        </div>
      </OverlayGlassSurface>
    </div>
  );
}
