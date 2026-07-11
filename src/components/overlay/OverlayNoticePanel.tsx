import type { OverlayNoticeViewModel } from "@/lib/overlayNotice";

type OverlayNoticePanelProps = {
  notice: OverlayNoticeViewModel;
  reduceMotion: boolean;
  onClose: () => void;
  onOpenApp: () => void;
  onCopy?: () => void;
};

function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 4.5H6V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="5.5" cy="3.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path d="M5.5 2L9.5 9.5H1.5L5.5 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M5.5 4.5V6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="5.5" cy="7.8" r="0.45" fill="currentColor" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <rect x="3" y="3" width="6.5" height="6.5" rx="0.8" stroke="currentColor" strokeWidth="1" />
      <rect x="1.5" y="1.5" width="6.5" height="6.5" rx="0.8" stroke="currentColor" strokeWidth="1" fill="currentColor" opacity="0.25" />
    </svg>
  );
}

function OpenIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <rect x="1" y="3" width="9" height="7" rx="0.8" stroke="currentColor" strokeWidth="1" />
      <path d="M7 2H9V4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 2L5.5 5.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

const iconButton = {
  width: "20px",
  height: "20px",
  borderRadius: "999px",
  border: "1px solid rgba(15,23,42,0.10)",
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
} as const;

export function OverlayNoticePanel({ notice, reduceMotion, onClose, onOpenApp, onCopy }: OverlayNoticePanelProps) {
  const isManualCopy = notice.kind === "manual_copy";
  const isAccessibilityError = notice.code === "accessibility_permission_required";

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "14px",
        overflow: "hidden",
        padding: "8px",
        border: "1px solid rgba(255,255,255,0.70)",
        background: "rgba(255,255,255,0.98)",
        backdropFilter: reduceMotion ? "blur(8px)" : "blur(14px)",
        WebkitBackdropFilter: reduceMotion ? "blur(8px)" : "blur(14px)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.98), inset 0 -1px 0 rgba(15,23,42,0.05)",
        color: "#0f172a",
        display: "flex",
        flexDirection: "column",
        gap: "5px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px", flex: 1, minWidth: 0 }}>
          <span style={{
            flexShrink: 0,
            color: isAccessibilityError ? "#b45309" : isManualCopy ? "#075985" : "#b42318",
            display: "flex",
            alignItems: "center",
          }}>
            {isAccessibilityError ? <WarningIcon /> : isManualCopy ? <InfoIcon /> : <WarningIcon />}
          </span>
          <div style={{ fontSize: "10px", lineHeight: 1.35, color: "#334155" }}>{notice.message}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={notice.closeLabel}
          style={{
            width: "18px",
            height: "18px",
            flexShrink: 0,
            borderRadius: "999px",
            border: "none",
            background: "rgba(148,163,184,0.18)",
            color: "#64748b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <CloseIcon />
        </button>
      </div>

      {notice.title ? (
        <div style={{ fontSize: "10px", fontWeight: 700, lineHeight: 1.25 }}>{notice.title}</div>
      ) : null}

      {notice.text ? (
        <div
          style={{
            borderRadius: "8px",
            border: "1px solid rgba(148,163,184,0.18)",
            background: "rgba(248,250,252,0.72)",
            padding: "5px 7px",
            fontSize: "8.5px",
            lineHeight: 1.4,
            color: "#334155",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            maxHeight: "60px",
            overflow: "auto",
          }}
        >
          {notice.text}
        </div>
      ) : null}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "4px", marginTop: "auto" }}>
        {notice.text && onCopy ? (
          <button
            type="button"
            onClick={onCopy}
            aria-label={notice.copyLabel}
            style={{ ...iconButton, background: "rgba(255,255,255,0.72)", color: "#475569" }}
          >
            <CopyIcon />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onOpenApp}
          aria-label={notice.openLabel}
          style={{
            ...iconButton,
            border: "1px solid rgba(15,23,42,0.08)",
            background: "rgba(15,23,42,0.92)",
            color: "#ffffff",
            boxShadow: "0 5px 14px rgba(15,23,42,0.16)",
          }}
        >
          <OpenIcon />
        </button>
      </div>
    </div>
  );
}
