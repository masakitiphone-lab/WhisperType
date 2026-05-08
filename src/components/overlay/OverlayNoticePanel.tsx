import type { OverlayNoticeViewModel } from "@/lib/overlayNotice";

type OverlayNoticePanelProps = {
  notice: OverlayNoticeViewModel;
  reduceMotion: boolean;
  onClose: () => void;
  onOpenApp: () => void;
  onCopy?: () => void;
};

export function OverlayNoticePanel({ notice, reduceMotion, onClose, onOpenApp, onCopy }: OverlayNoticePanelProps) {
  const buttonStyle = {
    height: "22px",
    borderRadius: "999px",
    border: "1px solid rgba(15,23,42,0.10)",
    padding: "0 9px",
    fontSize: "9px",
    fontWeight: 760,
    cursor: "pointer",
  } as const;

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "16px",
        overflow: "hidden",
        padding: "10px",
        border: "1px solid rgba(255,255,255,0.70)",
        background: "rgba(255,255,255,0.98)",
        backdropFilter: reduceMotion ? "blur(8px)" : "blur(14px)",
        WebkitBackdropFilter: reduceMotion ? "blur(8px)" : "blur(14px)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.98), inset 0 -1px 0 rgba(15,23,42,0.05)",
        color: "#0f172a",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "7px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "inline-flex",
              width: "fit-content",
              borderRadius: "999px",
              padding: "2px 6px",
              background: notice.kind === "error" ? "rgba(254,226,226,0.86)" : "rgba(224,242,254,0.86)",
              color: notice.kind === "error" ? "#b42318" : "#075985",
              fontSize: "7px",
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {notice.badgeLabel}
          </div>
          <div style={{ fontSize: "11px", fontWeight: 760, lineHeight: 1.25 }}>{notice.title}</div>
          <div style={{ fontSize: "8.5px", lineHeight: 1.42, color: "#475569" }}>{notice.message}</div>
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
            border: "1px solid rgba(15,23,42,0.10)",
            background: "rgba(255,255,255,0.74)",
            color: "#64748b",
            fontSize: "12px",
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <span aria-hidden="true" style={{ lineHeight: 1 }}>
            x
          </span>
        </button>
      </div>

      {notice.text ? (
        <div
          style={{
            borderRadius: "10px",
            border: "1px solid rgba(148,163,184,0.22)",
            background: "rgba(248,250,252,0.72)",
            padding: "6px 8px",
            fontSize: "8px",
            lineHeight: 1.4,
            color: "#334155",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            maxHeight: "42px",
            overflow: "auto",
          }}
        >
          {notice.text}
        </div>
      ) : null}

      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: "5px", marginTop: "auto" }}>
        {notice.copyLabel && notice.text && onCopy ? (
          <button
            type="button"
            onClick={onCopy}
            style={{
              ...buttonStyle,
              background: "rgba(255,255,255,0.72)",
              color: "#334155",
            }}
          >
            {notice.copyLabel}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onOpenApp}
          style={{
            ...buttonStyle,
            border: "1px solid rgba(15,23,42,0.08)",
            background: "rgba(15,23,42,0.92)",
            color: "#ffffff",
            boxShadow: "0 5px 14px rgba(15,23,42,0.16)",
          }}
        >
          {notice.openLabel}
        </button>
      </div>
    </div>
  );
}
