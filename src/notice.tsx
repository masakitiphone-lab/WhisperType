import React from "react";
import ReactDOM from "react-dom/client";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { OverlayNoticePanel } from "@/components/overlay/OverlayNoticePanel";
import { buildOverlayNotice, type OverlayNoticePayload, type OverlayNoticeViewModel } from "@/lib/overlayNotice";
import type { AppLocale } from "@/lib/appLocale";
import "./index.css";
import "./overlay.css";

type ShowNoticeEvent = OverlayNoticePayload & { locale: string };

const NOTICE_AUTO_DISMISS_MS = 4000;

function NoticePage() {
  const [notice, setNotice] = React.useState<OverlayNoticeViewModel | null>(null);
  const [reduceMotion, setReduceMotion] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let unlisten: (() => void) | undefined;
    listen<ShowNoticeEvent>("show-notice", (event) => {
      const { locale, ...payload } = event.payload;
      setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      setNotice(buildOverlayNotice(locale as AppLocale, payload as OverlayNoticePayload));
    }).then((fn) => { unlisten = fn; });
    return () => unlisten?.();
  }, []);

  React.useEffect(() => {
    if (!notice || !contentRef.current) return;
    const raf = requestAnimationFrame(() => {
      if (!contentRef.current) return;
      const rect = contentRef.current.getBoundingClientRect();
      const padding = 12;
      void invoke("resize_notice_window", {
        width: Math.ceil(rect.width + padding),
        height: Math.ceil(rect.height + padding),
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [notice]);

  // Transient notices (errors) close themselves after a few seconds so the
  // always-on-top notice window does not keep blocking clicks underneath.
  React.useEffect(() => {
    if (!notice || !notice.autoDismiss) return;
    const dismissTimer = window.setTimeout(() => {
      setNotice(null);
      void invoke("hide_notice_window");
    }, NOTICE_AUTO_DISMISS_MS);
    return () => window.clearTimeout(dismissTimer);
  }, [notice]);

  const clear = () => {
    setNotice(null);
    void invoke("hide_notice_window");
  };

  if (!notice) return null;

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
      }}
    >
      <div ref={contentRef} style={{ width: `${notice.width}px` }}>
        <OverlayNoticePanel
          notice={notice}
          reduceMotion={reduceMotion}
          onClose={() => clear()}
          onOpenApp={async () => {
            await invoke("show_settings_window");
            await clear();
          }}
          onCopy={
            notice.copyLabel && notice.text
              ? async () => {
                  await navigator.clipboard.writeText(notice.text ?? "");
                  await clear();
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <NoticePage />
  </React.StrictMode>
);
