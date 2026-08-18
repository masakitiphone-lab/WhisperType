"use client";

import { useEffect, useRef } from "react";
import { getLiquidGlassAccentStyle } from "@/components/overlay/liquidGlassAccent";
import {
  getLiquidGlassBaseStyle,
  getLiquidGlassTintStyle,
} from "@/components/overlay/liquidGlass";
import { BASE_HEIGHT, PREVIEW_GAP, PREVIEW_MAX_HEIGHT } from "@/lib/overlayLayout";

type TranscriptionPreviewPanelProps = {
  text: string;
  reduceMotion: boolean;
};

export function TranscriptionPreviewPanel({ text, reduceMotion }: TranscriptionPreviewPanelProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = scrollRef.current;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [text]);

  const baseStyle = getLiquidGlassBaseStyle("dark", reduceMotion);
  const accentStyle = getLiquidGlassAccentStyle("dark");

  return (
    <div
      aria-live="polite"
      style={{
        position: "absolute",
        left: "50%",
        bottom: `calc(50% - ${BASE_HEIGHT / 2 + PREVIEW_GAP}px)`,
        transform: "translateX(-50%)",
        width: "calc(100% - 24px)",
        height: `${PREVIEW_MAX_HEIGHT}px`,
        borderRadius: "14px",
        overflow: "hidden",
        zIndex: 2,
        ...baseStyle,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          ...getLiquidGlassTintStyle("dark"),
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          boxShadow: `${accentStyle.highlightBorder}, ${accentStyle.shadowBorder}`,
        }}
      />
      <div
        ref={scrollRef}
        style={{
          position: "absolute",
          inset: 0,
          overflowY: "auto",
          padding: "8px 10px",
          fontSize: "10px",
          lineHeight: 1.45,
          color: "rgba(255,255,255,0.92)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          scrollbarWidth: "thin",
          boxSizing: "border-box",
        }}
      >
        {text}
      </div>
    </div>
  );
}
