import React from "react";
import ReactDOM from "react-dom/client";
import { invoke } from "@tauri-apps/api/core";
import OverlayPage from "./pages/OverlayPage";
import { RecordingControllerProvider } from "./hooks/RecordingControllerContext";
import "./index.css";
import "./overlay.css";

void invoke("overlay_ready").catch((error) => {
  console.error("overlay_ready failed:", error);
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RecordingControllerProvider>
      <OverlayPage />
    </RecordingControllerProvider>
  </React.StrictMode>
);
