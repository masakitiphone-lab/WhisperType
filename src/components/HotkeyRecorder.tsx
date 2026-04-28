import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HotkeyRecorderProps {
  value: string;
  onChange: (value: string) => void;
  onInvalid?: (message: string) => void;
  allowModifierOnly?: boolean;
  allowMouseButtons?: boolean;
  labels?: {
    listening: string;
    currentHotkey: string;
    pressNow: string;
    helper: string;
    unsupportedMouseButtons: string;
    unidentifiedInput: string;
  };
  className?: string;
}

const MODIFIER_KEYS = ["Control", "Shift", "Alt", "Meta", "AltGraph", "OS"];
const MODIFIER_LABELS = ["Control", "Ctrl", "Shift", "Alt", "Meta", "Command"];

function normalizeKeyLabel(key: string) {
  if (key === "AltGraph") return "Alt";
  if (key === "OS") return "Meta";
  if (key === "Meta") return "Meta";
  if (key === " ") return "Space";
  if (key.length === 1) return key.toUpperCase();
  return key;
}

function getNonModifierKeyToken(event: KeyboardEvent<HTMLInputElement>) {
  const { code, key } = event;

  if (key === "Unidentified" && (!code || code === "Unidentified")) {
    return null;
  }

  if (code.startsWith("Key")) {
    return code.slice(3).toUpperCase();
  }

  if (code.startsWith("Digit")) {
    return code.slice(5);
  }

  const knownCodes: Record<string, string> = {
    Space: "Space",
    Enter: "Enter",
    Tab: "Tab",
    Escape: "Escape",
    Backspace: "Backspace",
    Delete: "Delete",
    Insert: "Insert",
    Home: "Home",
    End: "End",
    PageUp: "PageUp",
    PageDown: "PageDown",
    ArrowUp: "ArrowUp",
    ArrowDown: "ArrowDown",
    ArrowLeft: "ArrowLeft",
    ArrowRight: "ArrowRight",
    ContextMenu: "ContextMenu",
    BrowserBack: "BrowserBack",
    BrowserForward: "BrowserForward",
    BrowserRefresh: "BrowserRefresh",
    BrowserStop: "BrowserStop",
    BrowserSearch: "BrowserSearch",
    BrowserFavorites: "BrowserFavorites",
    BrowserHome: "BrowserHome",
    AudioVolumeMute: "AudioVolumeMute",
    AudioVolumeDown: "AudioVolumeDown",
    AudioVolumeUp: "AudioVolumeUp",
    MediaTrackNext: "MediaTrackNext",
    MediaTrackPrevious: "MediaTrackPrevious",
    MediaStop: "MediaStop",
    MediaPlayPause: "MediaPlayPause",
    LaunchMail: "LaunchMail",
    LaunchApp1: "LaunchApp1",
    LaunchApp2: "LaunchApp2",
    Sleep: "Sleep",
    WakeUp: "WakeUp",
    Minus: "Minus",
    Equal: "Equal",
    BracketLeft: "BracketLeft",
    BracketRight: "BracketRight",
    Backslash: "Backslash",
    Semicolon: "Semicolon",
    Quote: "Quote",
    Comma: "Comma",
    Period: "Period",
    Slash: "Slash",
    Backquote: "Backquote",
  };

  if (knownCodes[code]) {
    return knownCodes[code];
  }

  if (code.startsWith("F")) {
    return code;
  }

  if (code.startsWith("Numpad")) {
    return code;
  }

  if (key === "Unidentified") {
    return null;
  }

  return normalizeKeyLabel(key);
}

function getEventToken(event: KeyboardEvent<HTMLInputElement>) {
  return MODIFIER_KEYS.includes(event.key)
    ? normalizeKeyLabel(event.key)
    : getNonModifierKeyToken(event);
}

function isModifierOnly(keys: string[]) {
  return keys.every((key) => MODIFIER_LABELS.includes(key));
}

function getMouseButtonToken(button: number) {
  switch (button) {
    case 0:
      return "MouseLeft";
    case 1:
      return "MouseMiddle";
    case 2:
      return "MouseRight";
    case 3:
      return "Mouse4";
    case 4:
      return "Mouse5";
    default:
      return null;
  }
}

export function HotkeyRecorder({
  value,
  onChange,
  onInvalid,
  allowModifierOnly = false,
  allowMouseButtons = false,
  labels,
  className,
}: HotkeyRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [keys, setKeys] = useState<string[]>([]);
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isRecording) {
      setKeys(value ? value.split("+") : []);
    }
  }, [isRecording, value]);

  useEffect(() => {
    if (isRecording) {
      inputRef.current?.focus();
    }
  }, [isRecording]);

  const handleStartCapture = useCallback(() => {
    setKeys([]);
    pressedKeysRef.current = new Set();
    setIsRecording(true);
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (!isRecording) {
      return;
     }

     event.preventDefault();

     const key = getEventToken(event);
     if (!key) {
      onInvalid?.(labels?.unidentifiedInput ?? "This input could not be identified, so it cannot be registered.");
      return;
     }
    pressedKeysRef.current.add(key);

    setKeys((previous) => {
      if (previous.includes(key)) {
        return previous;
      }

      return [...previous, key];
    });
  }, [isRecording, onInvalid]);

  const commitKeys = useCallback(() => {
    if (!keys.length) {
      pressedKeysRef.current = new Set();
      setIsRecording(false);
      inputRef.current?.blur();
      return;
    }

    if (!allowModifierOnly && isModifierOnly(keys)) {
      pressedKeysRef.current = new Set();
      setIsRecording(false);
      inputRef.current?.blur();
      onInvalid?.("Modifier keys alone cannot be used as a global shortcut.");
      return;
    }

    onChange(keys.join("+"));
    pressedKeysRef.current = new Set();
    setIsRecording(false);
    inputRef.current?.blur();
  }, [keys, onChange, onInvalid]);

  const handleKeyUp = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      event.preventDefault();
      const key = getEventToken(event);
      if (!key) {
        return;
      }
      pressedKeysRef.current.delete(key);

      if (pressedKeysRef.current.size === 0) {
        commitKeys();
      }
    },
    [commitKeys]
  );

  const handleBlur = useCallback(() => {
    if (!isRecording) return;
    if (keys.length) {
      commitKeys();
      return;
    }

    pressedKeysRef.current = new Set();
    setIsRecording(false);
  }, [commitKeys, isRecording, keys.length]);

  useEffect(() => {
    if (!isRecording) {
      return;
    }

    const handleMouseDown = (event: MouseEvent) => {
      const key = getMouseButtonToken(event.button);
      if (!key) {
        return;
      }

      if (!allowMouseButtons) {
        event.preventDefault();
        onInvalid?.(labels?.unsupportedMouseButtons ?? "Mouse buttons are not supported by the current shortcut setup.");
        pressedKeysRef.current = new Set();
        setKeys([]);
        setIsRecording(false);
        inputRef.current?.blur();
        return;
      }

      event.preventDefault();
      pressedKeysRef.current.add(key);
      setKeys((previous) => {
        if (previous.includes(key)) {
          return previous;
        }

        return [...previous, key];
      });
    };

    const handleMouseUp = (event: MouseEvent) => {
      const key = getMouseButtonToken(event.button);
      if (!key) {
        return;
      }

      event.preventDefault();
      pressedKeysRef.current.delete(key);

      if (pressedKeysRef.current.size === 0) {
        commitKeys();
      }
    };

    window.addEventListener("mousedown", handleMouseDown, true);
    window.addEventListener("mouseup", handleMouseUp, true);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown, true);
      window.removeEventListener("mouseup", handleMouseUp, true);
    };
  }, [allowMouseButtons, commitKeys, isRecording, onInvalid]);

  return (
    <div className={cn("space-y-3", className)}>
      <input
        ref={inputRef}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onBlur={handleBlur}
        className="pointer-events-none absolute h-0 w-0 opacity-0"
        aria-hidden="true"
      />

      <Button
        type="button"
        onClick={handleStartCapture}
        className={cn(
          "h-auto w-full justify-start rounded-3xl border border-white/55 bg-white/70 px-4 py-4 text-left text-slate-900 shadow-sm backdrop-blur transition dark:border-white/10 dark:bg-white/8 dark:text-slate-50",
          isRecording
            ? "ring-2 ring-cyan-400/70 ring-offset-2 ring-offset-transparent"
            : "hover:bg-white/80 dark:hover:bg-white/12"
        )}
      >
        <span className="flex w-full items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/60 bg-white/80 text-sky-700 dark:border-white/10 dark:bg-white/10 dark:text-cyan-200">
            <Keyboard className="h-4 w-4" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              {isRecording ? (labels?.listening ?? "Listening") : (labels?.currentHotkey ?? "Current hotkey")}
            </span>
            <span className="truncate font-mono text-sm font-semibold">
              {isRecording
                ? keys.length
                  ? keys.join(" + ")
                  : (labels?.pressNow ?? "Press the shortcut now")
                 : value || "Ctrl+Alt"}
            </span>
          </span>
        </span>
      </Button>

      <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
        {labels?.helper ??
          "Click the card, press the shortcut you want, then release all keys to save it."}
      </p>
    </div>
  );
}
