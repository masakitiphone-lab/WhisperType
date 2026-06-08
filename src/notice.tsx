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

function NoticePage() {
  const [notice, setNotice] = React.useState<OverlayNoticeViewModel | null>(null);
  const [reduceMotion, setReduceMotion] = React.useState(false);

  React.useEffect(() => {
    let unlisten: (() => void) | undefined;
    listen<ShowNoticeEvent>("show-notice", (event) => {
      const { locale, ...payload } = event.payload;
      setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      setNotice(buildOverlayNotice(locale as AppLocale, payload as OverlayNoticePayload));
    }).then((fn) => { unlisten = fn; });
    return () => unlisten?.();
  }, []);

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
      <div style={{ width: `${notice.width}px` }}>
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
