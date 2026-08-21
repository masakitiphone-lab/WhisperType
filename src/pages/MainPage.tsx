import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AppShell } from "@/components/AppShell";
import type { AppLocale } from "@/lib/appLocale";
import { DEFAULT_APP_SETTINGS, readAppSettings, writeAppSettings, type AppSettings } from "@/lib/appSettings";
import { normalizeHotkeyForDisplay, normalizeHotkeyForNative } from "@/lib/hotkeys";
import { DEFAULT_HOTKEY, getUiCopy, type HotkeyBackendInfo } from "@/pages/settingsPageData";
import { MainPageSettingsSection } from "@/pages/MainPageSettingsSection";
import { MainPageHomeSection } from "@/pages/MainPageHomeSection";
import { MainPageHistorySection } from "@/pages/MainPageHistorySection";
import { LANGUAGE_OPTIONS, MODEL_OPTIONS } from "@/pages/settingsPageData";
import { requestPreferredAudioStream } from "@/lib/audioCapture";

type AudioInput = {
  deviceId: string;
  label: string;
};

export default function MainPage({ appLocale, onAppLocaleChange }: { appLocale: AppLocale; onAppLocaleChange: (locale: AppLocale) => void }) {
  const [settings, setSettings] = useState<AppSettings>({ ...DEFAULT_APP_SETTINGS, ...readAppSettings() });
  const [hotkey, setHotkey] = useState(normalizeHotkeyForDisplay(settings.hotkey || DEFAULT_HOTKEY));
  const [backend, setBackend] = useState<HotkeyBackendInfo | null>(null);
  const [status, setStatus] = useState("");
  const [micState, setMicState] = useState<"checking" | "available" | "missing" | "blocked">("checking");
  const [audioInputs, setAudioInputs] = useState<AudioInput[]>([]);
  const micTestState: "idle" | "testing" | "error" = "idle";
  const micTestLevel = 0;
  const ui = getUiCopy(appLocale);

  useEffect(() => { void invoke<HotkeyBackendInfo>("get_hotkey_backend_info").then(setBackend).catch(() => {}); }, []);
  useEffect(() => {
    const stored = readAppSettings();
    writeAppSettings({
      ...settings,
      hotkey,
      onboardingCompleted: stored.onboardingCompleted,
      tutorialCompleted: stored.tutorialCompleted,
    });
  }, [settings, hotkey]);

  useEffect(() => {
    const checkMicrophone = async () => {
      if (!navigator.mediaDevices?.getUserMedia) { setMicState("missing"); return; }
      try {
        const currentSettings = readAppSettings();
        const stream = await requestPreferredAudioStream(currentSettings.preferredAudioInputDeviceId || undefined);
        stream.getTracks().forEach((track) => track.stop());
        const devices = await navigator.mediaDevices.enumerateDevices();
        setAudioInputs(devices.filter((d) => d.kind === "audioinput").map((d, i) => ({ deviceId: d.deviceId, label: d.label || (appLocale === "ja" ? `マイク ${i + 1}` : `Microphone ${i + 1}`) })));
        setMicState(devices.some((d) => d.kind === "audioinput") ? "available" : "missing");
      } catch (error) {
        setMicState(error instanceof DOMException && error.name === "NotAllowedError" ? "blocked" : "missing");
      }
    };
    void checkMicrophone();
  }, [appLocale]);

  const languageLabel = LANGUAGE_OPTIONS.find((o) => o.value === settings.language)?.labels[appLocale] ?? settings.language;
  const modelLabel = MODEL_OPTIONS.find((o) => o.value === settings.model)?.labels[appLocale] ?? settings.model;

  return <AppShell appLocale={appLocale}>
    <MainPageHomeSection
      appLocale={appLocale}
      language={settings.language}
      languageLabel={languageLabel}
      micState={micState}
      model={settings.model}
      modelLabel={modelLabel}
      shortcutLabel={hotkey}
      onLanguageChange={(language) => setSettings((current) => ({ ...current, language }))}
      onModelChange={(model) => setSettings((current) => ({ ...current, model }))}
    />
    <div className="mt-8 mb-6">
      <h1 className="text-3xl font-semibold">{appLocale === "ja" ? "設定" : "Settings"}</h1>
      <p className="mt-2 text-sm text-slate-500">{appLocale === "ja" ? "Groq APIキーを設定して始めます。" : "Add your Groq API key to get started."}</p>
    </div>
    <MainPageSettingsSection
      appLocale={appLocale}
      audioInputs={audioInputs}
      hotkey={hotkey}
      hotkeyBackendInfo={backend}
      hotkeyStatusMessage={status}
      micState={micState}
      micTestLevel={micTestLevel}
      micTestState={micTestState}
      settings={settings}
      setSettings={setSettings}
      ui={ui}
      onHotkeyChange={(next) => { setHotkey(next); void invoke("set_global_shortcut", { shortcut: normalizeHotkeyForNative(next) }); }}
      onHotkeyInvalid={setStatus}
      onMicTestStart={() => {}}
      onMicTestStop={() => {}}
      onPreferredAudioInputDeviceChange={(deviceId) => setSettings((current) => ({ ...current, preferredAudioInputDeviceId: deviceId }))}
    />
    <MainPageHistorySection appLocale={appLocale} />
    <div className="mt-6 flex gap-2 text-sm">
      <button className="rounded-lg border px-3 py-2" onClick={() => onAppLocaleChange("ja")}>日本語</button>
      <button className="rounded-lg border px-3 py-2" onClick={() => onAppLocaleChange("en")}>English</button>
    </div>
  </AppShell>;
}
