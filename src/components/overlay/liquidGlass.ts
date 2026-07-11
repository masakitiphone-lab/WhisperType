"use client";

export type LiquidGlassTone = "dark" | "default";

export function getLiquidGlassBaseStyle(tone: LiquidGlassTone, reduceMotion: boolean) {
  if (tone === "dark") {
    return {
      border: "1px solid rgba(255,255,255,0.22)",
      background:
        "rgba(206,206,206,0.14)",
      backdropFilter: reduceMotion ? "blur(4px)" : "blur(5px)",
      WebkitBackdropFilter: reduceMotion ? "blur(4px)" : "blur(5px)",
      boxShadow:
        "0 6px 10px rgba(0,0,0,0.18), 0 0 20px rgba(0,0,0,0.10)",
    } as const;
  }

  return {
    border: "1px solid rgba(255,255,255,0.24)",
    background: "rgba(255,255,255,0.25)",
    backdropFilter: reduceMotion ? "blur(4px)" : "blur(5px)",
    WebkitBackdropFilter: reduceMotion ? "blur(4px)" : "blur(5px)",
    boxShadow:
      "0 6px 10px rgba(0,0,0,0.20), 0 0 20px rgba(0,0,0,0.10)",
  } as const;
}

export function getLiquidGlassTintStyle(tone: LiquidGlassTone) {
  if (tone === "dark") {
    return {
      background: "rgba(176,176,176,0.20)",
    } as const;
  }

  return {
    background: "rgba(232,232,232,0.22)",
  } as const;
}
