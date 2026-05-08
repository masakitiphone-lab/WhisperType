import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { normalizeHotkeyForDisplay } from "@/lib/hotkeys";
import { readAppSettings } from "@/lib/appSettings";

function getHotkeyToken(event: KeyboardEvent) {
  if (event.key === "Control") return "Ctrl";
  if (event.key === "Alt" || event.key === "AltGraph") return "Alt";
  if (event.key === "Shift") return "Shift";
  if (event.key === "Meta" || event.key === "OS") return "Meta";
  if (event.key === " ") return "Space";
  if (event.code.startsWith("Key")) return event.code.slice(3).toUpperCase();
  if (event.code.startsWith("Digit")) return event.code.slice(5);
  return event.key.length === 1 ? event.key.toUpperCase() : event.key;
}

function readHotkeyParts() {
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

export function useMainWindowHotkeySensor() {
  const pressedPartsRef = useRef<Set<string>>(new Set());
  const activeRef = useRef(false);

  useEffect(() => {
    const stopFromMainWindow = () => {
      pressedPartsRef.current.clear();
      if (!activeRef.current) return;
      activeRef.current = false;
      void invoke("stop_recording_from_main_window").catch((error) => {
        console.warn("Main window hotkey stop failed:", error);
      });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || eventIsInsideHotkeyRecorder(event)) return;

      const token = getHotkeyToken(event);
      const hotkeyParts = readHotkeyParts();
      if (!hotkeyParts.has(token)) return;

      event.preventDefault();
      pressedPartsRef.current.add(token);

      const matched = Array.from(hotkeyParts).every((part) => pressedPartsRef.current.has(part));
      if (!matched || activeRef.current) return;

      activeRef.current = true;
      void invoke("start_recording_from_main_window").catch((error) => {
        activeRef.current = false;
        pressedPartsRef.current.clear();
        console.warn("Main window hotkey start failed:", error);
      });
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (eventIsInsideHotkeyRecorder(event)) return;

      const token = getHotkeyToken(event);
      const hotkeyParts = readHotkeyParts();
      if (!hotkeyParts.has(token)) return;

      event.preventDefault();
      pressedPartsRef.current.delete(token);
      stopFromMainWindow();
    };

    const resetPressedParts = () => {
      pressedPartsRef.current.clear();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stopFromMainWindow();
      } else {
        resetPressedParts();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    window.addEventListener("blur", stopFromMainWindow);
    window.addEventListener("focus", resetPressedParts);
    window.addEventListener("pageshow", resetPressedParts);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
      window.removeEventListener("blur", stopFromMainWindow);
      window.removeEventListener("focus", resetPressedParts);
      window.removeEventListener("pageshow", resetPressedParts);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
}
