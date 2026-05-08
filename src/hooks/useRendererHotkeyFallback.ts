import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { normalizeHotkeyForDisplay } from "@/lib/hotkeys";
import { readAppSettings } from "@/lib/appSettings";

function getRendererHotkeyToken(event: KeyboardEvent) {
  if (event.key === "Control") return "Ctrl";
  if (event.key === "Alt" || event.key === "AltGraph") return "Alt";
  if (event.key === "Shift") return "Shift";
  if (event.key === "Meta" || event.key === "OS") return "Meta";
  if (event.key === " ") return "Space";
  if (event.code.startsWith("Key")) return event.code.slice(3).toUpperCase();
  if (event.code.startsWith("Digit")) return event.code.slice(5);
  return event.key.length === 1 ? event.key.toUpperCase() : event.key;
}

function readRendererHotkeyParts() {
  return new Set(
    normalizeHotkeyForDisplay(readAppSettings().hotkey || "Ctrl+Alt")
      .split("+")
      .map((part) => part.trim())
      .filter(Boolean),
  );
}

function eventIsInsideHotkeyRecorder(event: KeyboardEvent) {
  return event.target instanceof HTMLElement && Boolean(event.target.closest("[data-hotkey-recorder='true']"));
}

export function useRendererHotkeyFallback() {
  const pressedHotkeyPartsRef = useRef<Set<string>>(new Set());
  const hotkeyActiveRef = useRef(false);

  useEffect(() => {
    const stopRendererRecording = () => {
      pressedHotkeyPartsRef.current.clear();
      if (!hotkeyActiveRef.current) {
        return;
      }
      hotkeyActiveRef.current = false;
      void invoke("stop_recording").catch((error) => {
        console.warn("Renderer hotkey stop failed:", error);
      });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (eventIsInsideHotkeyRecorder(event)) return;
      const token = getRendererHotkeyToken(event);
      const hotkeyParts = readRendererHotkeyParts();
      if (!hotkeyParts.has(token)) return;

      event.preventDefault();
      pressedHotkeyPartsRef.current.add(token);

      const hotkeyMatched = Array.from(hotkeyParts).every((part) =>
        pressedHotkeyPartsRef.current.has(part),
      );

      if (hotkeyMatched && !hotkeyActiveRef.current) {
        hotkeyActiveRef.current = true;
        void invoke("start_recording").catch((error) => {
          hotkeyActiveRef.current = false;
          pressedHotkeyPartsRef.current.clear();
          console.warn("Renderer hotkey start failed:", error);
        });
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (eventIsInsideHotkeyRecorder(event)) return;
      const token = getRendererHotkeyToken(event);
      const hotkeyParts = readRendererHotkeyParts();
      if (!hotkeyParts.has(token)) return;

      event.preventDefault();
      pressedHotkeyPartsRef.current.delete(token);

      if (hotkeyActiveRef.current) {
        stopRendererRecording();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stopRendererRecording();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    window.addEventListener("blur", stopRendererRecording);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
      window.removeEventListener("blur", stopRendererRecording);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
}
