import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AppShell } from "@/components/AppShell";
import type { AppLocale } from "@/lib/appLocale";
import { DEFAULT_APP_SETTINGS, readAppSettings, writeAppSettings, type AppSettings } from "@/lib/appSettings";
import { normalizeHotkeyForDisplay, normalizeHotkeyForNative } from "@/lib/hotkeys";
import { DEFAULT_HOTKEY, getUiCopy, type HotkeyBackendInfo } from "@/pages/settingsPageData";
import { MainPageSettingsSection } from "@/pages/MainPageSettingsSection";

export default function MainPage({ appLocale, onAppLocaleChange }: { appLocale: AppLocale; onAppLocaleChange: (locale: AppLocale) => void }) {
  const [settings, setSettings] = useState<AppSettings>({ ...DEFAULT_APP_SETTINGS, ...readAppSettings() });
  const [hotkey, setHotkey] = useState(normalizeHotkeyForDisplay(settings.hotkey || DEFAULT_HOTKEY));
  const [backend, setBackend] = useState<HotkeyBackendInfo | null>(null);
  const [status, setStatus] = useState("");
  const ui = getUiCopy(appLocale);

  useEffect(() => { void invoke<HotkeyBackendInfo>("get_hotkey_backend_info").then(setBackend).catch(() => {}); }, []);
  useEffect(() => { writeAppSettings({ ...settings, hotkey }); }, [settings, hotkey]);

  return <AppShell appLocale={appLocale}><div className="mb-6"><h1 className="text-3xl font-semibold">{appLocale === "ja" ? "設定" : "Settings"}</h1><p className="mt-2 text-sm text-slate-500">{appLocale === "ja" ? "Groq APIキーを設定して始めます。" : "Add your Groq API key to get started."}</p></div>
    <MainPageSettingsSection appLocale={appLocale} audioInputs={[]} deleteAccountCopy={{ open: "" }} hotkey={hotkey} hotkeyBackendInfo={backend} hotkeyStatusMessage={status} micState="available" micTestLevel={0} micTestState="idle" sectionAccent={null} sectionHeaderClass="hidden" sectionIconClass="" sectionTitleClass="" settings={settings} setSettings={setSettings} ui={ui} onDeleteAccountOpen={() => {}} onHotkeyChange={(next) => { setHotkey(next); void invoke("set_global_shortcut", { shortcut: normalizeHotkeyForNative(next) }); }} onHotkeyInvalid={setStatus} onMicTestStart={() => {}} onMicTestStop={() => {}} onPreferredAudioInputDeviceChange={(deviceId) => setSettings((current) => ({ ...current, preferredAudioInputDeviceId: deviceId }))} setSectionRef={() => {}} />
    <div className="mt-6 flex gap-2 text-sm"><button className="rounded-lg border px-3 py-2" onClick={() => onAppLocaleChange("ja")}>日本語</button><button className="rounded-lg border px-3 py-2" onClick={() => onAppLocaleChange("en")}>English</button><a className="rounded-lg border px-3 py-2" href="#/privacy">Privacy</a><a className="rounded-lg border px-3 py-2" href="#/terms">Terms</a></div>
  </AppShell>;
}
