import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { OverlayNoticePanel } from "@/components/overlay/OverlayNoticePanel";
import type { OverlayNoticeViewModel } from "@/lib/overlayNotice";
import "./index.css";
import "./overlay.css";

function OverlayNoticeApp() {
  const [notice, setNotice] = useState<OverlayNoticeViewModel | null>(null);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    void invoke<OverlayNoticeViewModel | null>("get_overlay_notice")
      .then(setNotice)
      .catch((error) => console.error("get_overlay_notice failed:", error));
    void listen<OverlayNoticeViewModel>("overlay-notice-updated", (event) => {
      setNotice(event.payload);
    }).then((listener) => {
      unlisten = listener;
    });
    void invoke("overlay_notice_ready").catch((error) => {
      console.error("overlay_notice_ready failed:", error);
    });
    return () => unlisten?.();
  }, []);

  const closeNotice = async () => {
    setNotice(null);
    await invoke("hide_overlay_notice_window").catch((error) => {
      console.error("hide_overlay_notice_window failed:", error);
    });
  };

  if (!notice) {
    return null;
  }

  return (
    <div style={{ width: "100vw", height: "100vh", background: "transparent" }}>
      <OverlayNoticePanel
        notice={notice}
        reduceMotion={false}
        onClose={() => {
          void closeNotice();
        }}
        onOpenApp={() => {
          void invoke("show_settings_window").finally(closeNotice);
        }}
        onCopy={
          notice.copyLabel && notice.text
            ? () => {
                void navigator.clipboard.writeText(notice.text ?? "").finally(closeNotice);
              }
            : undefined
        }
      />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <OverlayNoticeApp />
  </React.StrictMode>,
);
