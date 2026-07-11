import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Check, ChevronDown, Mic, Play, SlidersHorizontal, Square, Trash2 } from "lucide-react";
import { HotkeyRecorder } from "@/components/HotkeyRecorder";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import type { AppLocale } from "@/lib/appLocale";
import type { AppSettings } from "@/lib/appSettings";
import { DEFAULT_TRANSCRIPTION_PROMPT, ENGLISH_TRANSCRIPTION_PROMPT, JAPANESE_TRANSCRIPTION_PROMPT } from "@/lib/transcription";
import { MainPageOverlaySettings } from "@/pages/MainPageOverlaySettings";
import { GLASS_CARD, GLASS_PANEL } from "@/pages/mainPageTypes";
import type { HotkeyBackendInfo, UiCopy } from "@/pages/settingsPageData";
import { getGroqApiKey, setGroqApiKey } from "@/services/transcription";

type AudioInput = {
  deviceId: string;
  label: string;
};

type DeleteAccountCopy = {
  open: string;
};

type MainPageSettingsSectionProps = {
  appLocale: AppLocale;
  audioInputs: AudioInput[];
  deleteAccountCopy: DeleteAccountCopy;
  hotkey: string;
  hotkeyBackendInfo: HotkeyBackendInfo | null;
  hotkeyStatusMessage: string;
  micState: "checking" | "available" | "missing" | "blocked";
  micTestLevel: number;
  micTestState: "idle" | "testing" | "error";
  sectionAccent: ReactNode;
  sectionHeaderClass: string;
  sectionIconClass: string;
  sectionTitleClass: string;
  settings: AppSettings;
  setSettings: Dispatch<SetStateAction<AppSettings>>;
  ui: UiCopy;
  onDeleteAccountOpen: () => void;
  onHotkeyChange: (nextHotkey: string) => void;
  onHotkeyInvalid: (message: string) => void;
  onMicTestStart: () => void;
  onMicTestStop: () => void;
  onPreferredAudioInputDeviceChange: (deviceId: string) => void;
  setSectionRef: (element: HTMLElement | null) => void;
};

export function MainPageSettingsSection({
  appLocale,
  audioInputs,
  deleteAccountCopy,
  hotkey,
  hotkeyBackendInfo,
  hotkeyStatusMessage,
  micState,
  micTestLevel,
  micTestState,
  sectionAccent,
  sectionHeaderClass,
  sectionIconClass,
  sectionTitleClass,
  settings,
  setSettings,
  ui,
  onDeleteAccountOpen,
  onHotkeyChange,
  onHotkeyInvalid,
  onMicTestStart,
  onMicTestStop,
  onPreferredAudioInputDeviceChange,
  setSectionRef,
}: MainPageSettingsSectionProps) {
  const micTestLevelBars = 44;
  const micTestActiveBars = Math.round(micTestLevel * micTestLevelBars);
  const [recentLogs, setRecentLogs] = useState<string[]>([]);
  const [groqApiKey, setGroqApiKeyState] = useState("");
  const [groqKeyStatus, setGroqKeyStatus] = useState("");

  useEffect(() => {
    void getGroqApiKey().then(setGroqApiKeyState).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    const refreshLogs = async () => {
      try {
        const logs = await invoke<string[]>("get_recent_logs");
        if (active) setRecentLogs(Array.isArray(logs) ? logs : []);
      } catch {
        if (active) setRecentLogs([]);
      }
    };

    void refreshLogs();
    const interval = window.setInterval(() => {
      void refreshLogs();
    }, 2000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <section ref={setSectionRef} id="settings" className="scroll-mt-8">
      <div className="mb-3">
        <div className={sectionHeaderClass}>
          <SlidersHorizontal className={sectionIconClass} />
          <p className={sectionTitleClass}>{appLocale === "ja" ? "設定" : "Settings"}</p>
          {sectionAccent}
        </div>
      </div>
      <Card className={GLASS_CARD}>
        <CardContent className="space-y-4 pt-6">
          <div className={GLASS_PANEL + " p-4"}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Groq API key</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {appLocale === "ja" ? "キーはこの端末の安全なストレージにのみ保存され、Groqへ直接送信されます。" : "Stored only in this device's secure storage and sent directly to Groq."}
            </p>
            <div className="mt-3 flex gap-2">
              <input
                type="password"
                value={groqApiKey}
                onChange={(event) => setGroqApiKeyState(event.target.value)}
                placeholder="gsk_..."
                className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-white/5"
              />
              <Button type="button" onClick={() => void setGroqApiKey(groqApiKey).then(() => setGroqKeyStatus("Saved"))}>
                Save
              </Button>
            </div>
            {groqKeyStatus ? <p className="mt-2 text-xs text-emerald-600">{groqKeyStatus}</p> : null}
          </div>
          <div className={GLASS_PANEL + " p-4"}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              {appLocale === "ja" ? "ショートカットキー" : "Shortcut key"}
            </p>
            <div className="mt-3">
              <HotkeyRecorder
                value={hotkey}
                allowModifierOnly={hotkeyBackendInfo?.supports_modifier_only ?? false}
                allowMouseButtons={hotkeyBackendInfo?.supports_mouse_buttons ?? false}
                labels={{
                  listening: appLocale === "ja" ? "入力中" : "Listening",
                  currentHotkey: appLocale === "ja" ? "現在のキー" : "Current",
                  pressNow: appLocale === "ja" ? "キーを押してください" : "Press now",
                  helper: appLocale === "ja" ? "カードをクリックして、キーを押して、離すと保存されます。" : "Click, press keys, then release to save.",
                  unsupportedMouseButtons: appLocale === "ja" ? "この環境ではマウスボタンは使えません。" : "Mouse buttons are not available.",
                  unidentifiedInput: appLocale === "ja" ? "入力を判別できませんでした。" : "Input could not be identified.",
                }}
                onChange={onHotkeyChange}
                onInvalid={onHotkeyInvalid}
                className="w-full"
              />
              {hotkeyStatusMessage ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">{hotkeyStatusMessage}</p> : null}
            </div>
          </div>

          <div className={GLASS_PANEL + " p-4"}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Mic className="h-4 w-4 text-slate-400" />
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  {appLocale === "ja" ? "入力マイク" : "Input microphone"}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={micState === "blocked" || micState === "missing"}
                onClick={() => {
                  if (micTestState === "testing") {
                    onMicTestStop();
                    return;
                  }
                  onMicTestStart();
                }}
                aria-label={micTestState === "testing" ? (appLocale === "ja" ? "停止" : "Stop") : appLocale === "ja" ? "再生" : "Play"}
              >
                {micTestState === "testing" ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" className="mt-3 w-full justify-between">
                  <span className="truncate">
                    {audioInputs.find((device) => device.deviceId === settings.preferredAudioInputDeviceId)?.label ||
                      (appLocale === "ja" ? "デフォルト" : "Default")}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[min(420px,calc(100vw-48px))]">
                <DropdownMenuItem onSelect={() => onPreferredAudioInputDeviceChange("")}>
                  {settings.preferredAudioInputDeviceId === "" ? <Check className="mr-2 h-4 w-4" /> : <span className="mr-2 h-4 w-4" />}
                  {appLocale === "ja" ? "デフォルト" : "Default"}
                </DropdownMenuItem>
                {audioInputs.map((device) => (
                  <DropdownMenuItem
                    key={device.deviceId}
                    onSelect={() => onPreferredAudioInputDeviceChange(device.deviceId)}
                  >
                    {settings.preferredAudioInputDeviceId === device.deviceId ? <Check className="mr-2 h-4 w-4" /> : <span className="mr-2 h-4 w-4" />}
                    <span className="truncate">{device.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="mt-4 rounded-[18px] border border-black/6 bg-white/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-white/8 dark:bg-white/4">
              <div className="flex gap-1">
                {Array.from({ length: micTestLevelBars }).map((_, index) => {
                  const isActive = index < micTestActiveBars;
                  return (
                    <div
                      key={index}
                      className={[
                        "h-4 flex-1 rounded-[3px] transition-colors duration-100 ease-out",
                        isActive
                          ? "bg-[linear-gradient(180deg,#9ef87a_0%,#50c878_48%,#1f8f59_100%)] shadow-[0_0_0_1px_rgba(80,200,120,0.18),0_0_14px_rgba(80,200,120,0.16)]"
                          : "bg-slate-200/95 dark:bg-white/10",
                      ].join(" ")}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <MainPageOverlaySettings appLocale={appLocale} settings={settings} setSettings={setSettings} ui={ui} />

          <div className="grid gap-3 md:grid-cols-2">
            {(["showOverlay", "showWaveform", "playStartSound", "playStopSound", "autoInsert"] as const).map((key) => (
              <div key={key} className={GLASS_PANEL + " flex items-center justify-between px-4 py-3"}>
                <span className="text-sm text-slate-700 dark:text-slate-200">{ui[key]}</span>
                <Switch
                  checked={Boolean(settings[key])}
                  onClick={() =>
                    setSettings((current) => ({
                      ...current,
                      [key]: !Boolean(current[key]),
                    }))
                  }
                  className="bg-transparent"
                />
              </div>
            ))}
          </div>

          <div className={GLASS_PANEL + " p-4"}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              {appLocale === "ja" ? "プロンプト" : "Prompt"}
            </p>
            <textarea
              value={settings.prompt}
              onChange={(event) => setSettings((current) => ({ ...current, prompt: event.target.value }))}
              rows={5}
              className="mt-3 w-full rounded-2xl border border-white/25 bg-white/75 px-4 py-3 text-sm text-slate-800 shadow-none outline-none dark:border-white/10 dark:bg-white/6 dark:text-slate-100"
            />
            <div className="mt-3 flex flex-wrap gap-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setSettings((current) => ({ ...current, prompt: DEFAULT_TRANSCRIPTION_PROMPT }))}>
                {appLocale === "ja" ? "初期値" : "Reset"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setSettings((current) => ({ ...current, prompt: JAPANESE_TRANSCRIPTION_PROMPT }))}>
                JP
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setSettings((current) => ({ ...current, prompt: ENGLISH_TRANSCRIPTION_PROMPT }))}>
                EN
              </Button>
            </div>
          </div>

          <div className={GLASS_PANEL + " p-4"}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{ui.recentLogsTitle}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{ui.recentLogsDescription}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  await invoke("clear_recent_logs").catch(() => {});
                  setRecentLogs([]);
                }}
              >
                {ui.clearLogs}
              </Button>
            </div>
            <div className="mt-4 max-h-60 space-y-2 overflow-auto rounded-[18px] border border-black/6 bg-white/70 p-3 text-xs leading-5 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-white/8 dark:bg-white/4 dark:text-slate-200">
              {recentLogs.length > 0 ? (
                recentLogs.map((line, index) => (
                  <div key={`${index}-${line}`} className="whitespace-pre-wrap break-words">
                    {line}
                  </div>
                ))
              ) : (
                <p className="text-slate-400 dark:text-slate-500">{appLocale === "ja" ? "まだログはありません。" : "No logs yet."}</p>
              )}
            </div>
          </div>

          <div className={GLASS_PANEL + " p-4"}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {appLocale === "ja" ? "アカウントデータ" : "Account data"}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {appLocale === "ja"
                    ? "プロフィールと文字起こし履歴を削除します。"
                    : "Delete your profile and transcription history."}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={onDeleteAccountOpen}
                className="justify-start border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-400/20 dark:text-rose-300 dark:hover:bg-rose-400/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deleteAccountCopy.open}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
