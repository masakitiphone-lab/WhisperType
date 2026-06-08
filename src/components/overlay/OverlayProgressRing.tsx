type OverlayProgressRingProps = {
  size: number;
  progress: number;
  visible: boolean;
};

const RING_STROKE = 3;

const RAINBOW_STOPS = [
  { offset: "0%", color: "#e8b4b4" },
  { offset: "16%", color: "#e8c4a8" },
  { offset: "33%", color: "#e8dca8" },
  { offset: "50%", color: "#a8d4b4" },
  { offset: "66%", color: "#a4bce8" },
  { offset: "83%", color: "#c0b8e8" },
  { offset: "100%", color: "#d4b8e8" },
] as const;

export function OverlayProgressRing({ size, progress, visible }: OverlayProgressRingProps) {
  const radius = (size - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const dashOffset = circumference * (1 - clampedProgress / 100);

  if (!visible) {
    return null;
  }

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${size} ${size}`}
      style={{
        position: "absolute",
        inset: 0,
        width: `${size}px`,
        height: `${size}px`,
        transform: "rotate(-90deg)",
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      <defs>
        <linearGradient id="rainbow" x1="0%" y1="0%" x2="100%" y2="100%">
          {RAINBOW_STOPS.map((s) => (
            <stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#rainbow)"
        strokeLinecap="round"
        strokeWidth={RING_STROKE}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        style={{ transition: "stroke-dashoffset 180ms ease-out" }}
      />
    </svg>
  );
}
