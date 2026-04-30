import { COPY, type Copy } from "@/lib/appCopyData";

export type AppLocale = "en" | "ja" | "es";

export const DEFAULT_APP_LOCALE: AppLocale = "en";

export const APP_LOCALE_OPTIONS: Array<{ value: AppLocale; label: string }> = [
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
  { value: "es", label: "Español" },
];

export function readAppLocale(): AppLocale {
  if (typeof window === "undefined") return DEFAULT_APP_LOCALE;

  try {
    const raw = localStorage.getItem("whispertype-settings");
    if (!raw) return DEFAULT_APP_LOCALE;

    const parsed = JSON.parse(raw) as { appLocale?: unknown };
    if (parsed.appLocale === "en" || parsed.appLocale === "ja" || parsed.appLocale === "es") {
      return parsed.appLocale;
    }
  } catch {
    return DEFAULT_APP_LOCALE;
  }

  return DEFAULT_APP_LOCALE;
}

export function writeAppLocale(locale: AppLocale) {
  const raw = localStorage.getItem("whispertype-settings");
  const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  localStorage.setItem(
    "whispertype-settings",
    JSON.stringify({
      ...parsed,
      appLocale: locale,
    }),
  );
}

export function getAppCopy(locale: AppLocale): Copy {
  return COPY[locale];
}
