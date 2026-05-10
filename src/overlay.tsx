import React from "react";
import ReactDOM from "react-dom/client";
import OverlayPage from "./pages/OverlayPage";
import { RecordingControllerProvider } from "./hooks/RecordingControllerContext";
import "./index.css";
import "./overlay.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RecordingControllerProvider>
      <OverlayPage />
    </RecordingControllerProvider>
  </React.StrictMode>
);
