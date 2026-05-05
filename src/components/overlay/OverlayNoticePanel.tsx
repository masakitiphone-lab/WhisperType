import type { OverlayNoticeViewModel } from "@/lib/overlayNotice";

type OverlayNoticePanelProps = {
  notice: OverlayNoticeViewModel;
  reduceMotion: boolean;
  onClose: () => void;
  onOpenApp: () => void;
  onCopy?: () => void;
};

export function OverlayNoticePanel({ notice, reduceMotion, onClose, onOpenApp, onCopy }: OverlayNoticePanelProps) {
  const shellStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "22px",
    overflow: "hidden",
    padding: "16px",
    border: "1px solid rgba(255,255,255,0.70)",
    background:
      "linear-gradient(145deg, rgba(255,255,255,0.99) 0%, rgba(252,254,255,0.98) 52%, rgba(244,247,251,0.97) 100%)",
    backdropFilter: reduceMotion ? "blur(8px)" : "blur(14px)",
    WebkitBackdropFilter: reduceMotion ? "blur(8px)" : "blur(14px)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.98), inset 0 -1px 0 rgba(15,23,42,0.05)",
    color: "#0f172a",
    display: "flex",
    flexDirection: "column",
    gap: "13px",
    boxSizing: "border-box",
  } as const;

  const quietButtonStyle = {
    height: "30px",
    borderRadius: "999px",
    border: "1px solid rgba(15,23,42,0.10)",
    background: "rgba(255,255,255,0.68)",
    color: "#334155",
    padding: "0 12px",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
  } as const;

  const primaryButtonStyle = {
    height: "30px",
    borderRadius: "999px",
    border: "1px solid rgba(15,23,42,0.08)",
    background: "rgba(15,23,42,0.92)",
    color: "#ffffff",
    padding: "0 13px",
    fontSize: "11px",
    fontWeight: 800,
    boxShadow: "0 8px 22px rgba(15,23,42,0.18)",
    cursor: "pointer",
  } as const;

  return (
    <div style={shellStyle} role="alert" aria-live="polite">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "7px", flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              width: "fit-content",
              borderRadius: "999px",
              padding: "4px 9px",
              background: notice.kind === "error" ? "rgba(254,226,226,0.86)" : "rgba(224,242,254,0.86)",
              color: notice.kind === "error" ? "#b42318" : "#075985",
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {notice.badgeLabel}
          </div>
          <div style={{ fontSize: "15px", fontWeight: 760, lineHeight: 1.32 }}>{notice.title}</div>
          <div style={{ fontSize: "11px", lineHeight: 1.58, color: "#475569" }}>{notice.message}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={notice.closeLabel}
          style={{
            width: "24px",
            height: "24px",
            flexShrink: 0,
            borderRadius: "999px",
            border: "1px solid rgba(15,23,42,0.10)",
            background: "rgba(255,255,255,0.74)",
            color: "#64748b",
            fontSize: "15px",
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.88)",
            cursor: "pointer",
          }}
        >
          <span aria-hidden="true" style={{ lineHeight: 1, transform: "translateY(-0.5px)" }}>
            ×
          </span>
        </button>
      </div>

      {notice.detail ? (
        <div
          style={{
            borderRadius: "14px",
            border: "1px solid rgba(252,165,165,0.64)",
            background: "rgba(255,241,242,0.82)",
            padding: "9px 11px",
            fontSize: "10px",
            lineHeight: 1.5,
            color: "#9f1239",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            minHeight: 0,
            maxHeight: "70px",
            overflow: "auto",
          }}
        >
          {notice.detail}
        </div>
      ) : null}

      {notice.text ? (
        <div
          style={{
            borderRadius: "14px",
            border: "1px solid rgba(148,163,184,0.22)",
            background: "rgba(248,250,252,0.72)",
            padding: "9px 11px",
            fontSize: "10px",
            lineHeight: 1.6,
            color: "#334155",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            minHeight: 0,
            maxHeight: "86px",
            overflow: "auto",
          }}
        >
          {notice.text}
        </div>
      ) : null}

      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: "8px", marginTop: "auto" }}>
        {notice.copyLabel && notice.text && onCopy ? (
          <button type="button" onClick={onCopy} style={quietButtonStyle}>
            {notice.copyLabel}
          </button>
        ) : null}
        <button type="button" onClick={onOpenApp} style={primaryButtonStyle}>
          {notice.openLabel}
        </button>
      </div>
    </div>
  );
}
