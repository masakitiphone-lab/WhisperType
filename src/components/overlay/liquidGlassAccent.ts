"use client";

export function getLiquidGlassAccentStyle(tone: "dark" | "default") {
  const highlight = tone === "dark" ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.82)";
  const shadow = tone === "dark" ? "rgba(0,0,0,0.30)" : "rgba(0,0,0,0.24)";

  return {
    topLight:
      `linear-gradient(180deg, ${highlight} 0%, rgba(255,255,255,0.22) 5%, rgba(255,255,255,0.10) 12%, rgba(255,255,255,0) 24%)`,
    leftContour:
      `radial-gradient(80% 140% at 0% 52%, ${shadow} 0%, rgba(0,0,0,0.16) 8%, rgba(0,0,0,0.08) 14%, rgba(0,0,0,0) 26%)`,
    rightContour:
      `radial-gradient(80% 140% at 100% 52%, ${shadow} 0%, rgba(0,0,0,0.16) 8%, rgba(0,0,0,0.08) 14%, rgba(0,0,0,0) 26%)`,
    bottomContour:
      `linear-gradient(0deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.06) 10%, rgba(0,0,0,0) 26%)`,
    innerRim:
      `inset 0 1px 0 rgba(255,255,255,0.30), inset 0 -1px 0 rgba(0,0,0,0.10), inset 0 0 0 1px rgba(255,255,255,0.06)`,
    highlightBorder:
      `inset 0 1px 0 ${highlight}, inset 0 0 0 1px rgba(255,255,255,0.08)`,
    shadowBorder:
      `inset 0 -1px 0 ${shadow}, inset 0 0 0 1px rgba(0,0,0,0.08)`,
  } as const;
}
