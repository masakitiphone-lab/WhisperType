import { createContext, createElement, useContext } from "react";
import { useOverlayRecordingController } from "@/hooks/useOverlayRecordingController";

const RecordingControllerContext = createContext<ReturnType<typeof useOverlayRecordingController> | null>(null);

export function RecordingControllerProvider({ children }: { children: React.ReactNode }) {
  const controller = useOverlayRecordingController();
  return createElement(RecordingControllerContext.Provider, { value: controller }, children);
}

export function useRecordingController() {
  const value = useContext(RecordingControllerContext);
  if (!value) {
    throw new Error("useRecordingController must be used within RecordingControllerProvider");
  }
  return value;
}
