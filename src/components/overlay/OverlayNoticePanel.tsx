import { GlassButton } from "@/components/einui/glass-button";
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
    borderRadius: "20px",
    overflow: "hidden",
    padding: "14px",
    border: "1px solid rgba(226,232,240,0.92)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.96) 100%)",
    backdropFilter: reduceMotion ? "blur(8px)" : "blur(12px)",
    WebkitBackdropFilter: reduceMotion ? "blur(8px)" : "blur(12px)",
    boxShadow: "0 16px 40px rgba(15,23,42,0.16), 0 2px 10px rgba(15,23,42,0.08)",
    color: "#0f172a",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  } as const;

  const actionStripStyle = {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: "8px",
    marginTop: "2px",
  } as const;

  return (
    <div style={shellStyle} role="alert" aria-live="polite">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "6px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              width: "fit-content",
              borderRadius: "999px",
              padding: "4px 8px",
              background: notice.kind === "error" ? "#fef2f2" : "#eef2ff",
              color: notice.kind === "error" ? "#b42318" : "#334155",
              fontSize: "8px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {notice.badgeLabel}
          </div>
          <div style={{ fontSize: "13px", fontWeight: 700, lineHeight: 1.35 }}>{notice.title}</div>
          <div style={{ fontSize: "10px", lineHeight: 1.5, color: "#475569" }}>{notice.message}</div>
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
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            color: "#64748b",
            fontSize: "14px",
            lineHeight: 1,
            display: "grid",
            placeItems: "center",
            boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
            cursor: "pointer",
          }}
        >
          ×
        </button>
      </div>

      {notice.text ? (
        <div
          style={{
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
            padding: "8px 10px",
            fontSize: "9px",
            lineHeight: 1.6,
            color: "#334155",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            maxHeight: "72px",
            overflow: "auto",
          }}
        >
          {notice.text}
        </div>
      ) : null}

      <div style={actionStripStyle}>
        {notice.copyLabel && notice.text && onCopy ? (
          <GlassButton type="button" onClick={onCopy} variant="outline" size="sm" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
            {notice.copyLabel}
          </GlassButton>
        ) : null}
        <GlassButton
          type="button"
          onClick={onOpenApp}
          variant="primary"
          size="sm"
          className="border-slate-900 bg-slate-900 text-white shadow-[0_8px_20px_rgba(15,23,42,0.18)] hover:bg-slate-800 hover:shadow-[0_10px_24px_rgba(15,23,42,0.22)] before:hidden"
        >
          {notice.openLabel}
        </GlassButton>
      </div>
    </div>
  );
}
