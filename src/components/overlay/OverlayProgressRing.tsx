type OverlayProgressRingProps = {
  size: number;
  progress: number;
  visible: boolean;
};

const RING_STROKE = 3;
const RING_COLOR = "#a3e635";

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
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(163, 230, 53, 0.18)"
        strokeWidth={RING_STROKE}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={RING_COLOR}
        strokeLinecap="round"
        strokeWidth={RING_STROKE}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        style={{ transition: "stroke-dashoffset 180ms ease-out" }}
      />
    </svg>
  );
}
