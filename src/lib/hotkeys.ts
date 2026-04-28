const DISPLAY_KEY_MAP: Record<string, string> = {
  Control: "Ctrl",
  Ctrl: "Ctrl",
  Shift: "Shift",
  Alt: "Alt",
  Meta: "Meta",
  Command: "Meta",
  " ": "Space",
  Spacebar: "Space",
};

const NATIVE_KEY_MAP: Record<string, string> = {
  Control: "ctrl",
  Ctrl: "ctrl",
  Shift: "shift",
  Alt: "alt",
  Meta: "super",
  Command: "super",
  " ": "space",
  Spacebar: "space",
};

function normalizePart(part: string, map: Record<string, string>) {
  const trimmed = part.trim();
  if (!trimmed) {
    return "";
  }

  const mapped = map[trimmed] ?? trimmed;
  if (mapped.length === 1) {
    return mapped.toUpperCase();
  }

  return mapped;
}

export function normalizeHotkeyForDisplay(shortcut: string) {
  return shortcut
    .split("+")
    .map((part) => normalizePart(part, DISPLAY_KEY_MAP))
    .filter(Boolean)
    .join("+");
}

export function normalizeHotkeyForNative(shortcut: string) {
  return shortcut
    .split("+")
    .map((part) => normalizePart(part, NATIVE_KEY_MAP).toLowerCase())
    .filter(Boolean)
    .join("+");
}
