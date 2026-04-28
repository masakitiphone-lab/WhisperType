import { GlassButton } from "@/components/einui/glass-button";
import { getLiquidGlassAccentStyle } from "@/components/overlay/liquidGlassAccent";
import type { OverlayNoticeViewModel } from "@/lib/overlayNotice";

type OverlayNoticePanelProps = {
  notice: OverlayNoticeViewModel;
  reduceMotion: boolean;
  onClose: () => void;
  onOpenApp: () => void;
  onCopy?: () => void;
};

export function OverlayNoticePanel({ notice, reduceMotion, onClose, onOpenApp, onCopy }: OverlayNoticePanelProps) {
  const liquidGlassAccent = getLiquidGlassAccentStyle("default");
  const shellStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "18px",
    overflow: "hidden",
    padding: "12px",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.10) 18%, rgba(255,255,255,0.06) 52%, rgba(255,255,255,0.04) 100%)",
    backdropFilter: reduceMotion ? "blur(18px) saturate(1.25)" : "blur(24px) saturate(1.42)",
    WebkitBackdropFilter: reduceMotion ? "blur(18px) saturate(1.25)" : "blur(24px) saturate(1.42)",
    boxShadow: `0 14px 28px rgba(15,23,42,0.16), ${liquidGlassAccent.highlightBorder}, ${liquidGlassAccent.shadowBorder}`,
    color: "#0f172a",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  } as const;

  const actionStripStyle = {
    display: "flex",
    justifyContent: "flex-end",
    gap: "5px",
    marginTop: "1px",
    padding: "5px 7px",
    borderRadius: "14px",
    background: "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(246,248,250,0.10))",
    border: "1px solid rgba(255,255,255,0.16)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45), 0 6px 14px rgba(15,23,42,0.06)",
    backdropFilter: reduceMotion ? "blur(4px) saturate(1.0)" : "blur(6px) saturate(1.0)",
    WebkitBackdropFilter: reduceMotion ? "blur(4px) saturate(1.0)" : "blur(6px) saturate(1.0)",
  } as const;

  return (
    <div style={shellStyle}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "6px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              width: "fit-content",
              borderRadius: "999px",
              padding: "2px 7px",
              background: notice.kind === "error" ? "rgba(248,113,113,0.14)" : "rgba(15,23,42,0.08)",
              color: notice.kind === "error" ? "#b91c1c" : "#334155",
              fontSize: "8px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {notice.badgeLabel}
          </div>
          <div style={{ fontSize: "10px", fontWeight: 650, lineHeight: 1.2 }}>{notice.title}</div>
          <div style={{ fontSize: "8.5px", lineHeight: 1.35, color: "#475569" }}>{notice.message}</div>
        </div>
        <div style={{ width: "18px", height: "18px", flexShrink: 0 }} />
      </div>

      {notice.text ? (
        <div
          style={{
            borderRadius: "12px",
            border: "1px solid rgba(15,23,42,0.08)",
            background: "rgba(255,255,255,0.42)",
            padding: "6px 8px",
            fontSize: "9px",
            lineHeight: 1.65,
            color: "#334155",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            maxHeight: "30px",
            overflow: "auto",
          }}
        >
          {notice.text}
        </div>
      ) : null}

      <div style={actionStripStyle}>
        <GlassButton type="button" onClick={onClose} variant="outline" size="sm">
          {notice.closeLabel}
        </GlassButton>
        {notice.copyLabel && notice.text && onCopy ? (
          <GlassButton type="button" onClick={onCopy} variant="outline" size="sm">
            {notice.copyLabel}
          </GlassButton>
        ) : null}
        <GlassButton type="button" onClick={onOpenApp} variant="primary" size="sm">
          {notice.openLabel}
        </GlassButton>
      </div>
    </div>
  );
}
