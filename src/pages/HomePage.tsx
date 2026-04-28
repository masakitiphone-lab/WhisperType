import { useEffect, useMemo, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { Copy, Coins, History, Keyboard, Languages } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { HotkeyRecorder } from "@/components/HotkeyRecorder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/useAuth";
import { getAppCopy, type AppLocale } from "@/lib/appLocale";
import { normalizeHotkeyForDisplay, normalizeHotkeyForNative } from "@/lib/hotkeys";
import { DEFAULT_TRANSCRIPTION_SETTINGS, readTranscriptionSettings } from "@/lib/transcription";
import { readAppSettings } from "@/lib/appSettings";
import { supabase } from "@/lib/supabase";

type HomeHistoryItem = {
  id: string;
  transcribed_text: string;
  created_at: string;
  credits_used: number;
};

type HotkeyBackendInfo = {
  supports_modifier_only: boolean;
  supports_mouse_buttons: boolean;
};

const HOME_LOCALE_OPTIONS: Array<{ value: AppLocale; label: string; shortLabel: string }> = [
  { value: "en", label: "English", shortLabel: "EN" },
  { value: "ja", label: "Japanese", shortLabel: "JP" },
  { value: "es", label: "Spanish", shortLabel: "ES" },
];

export default function HomePage({
  appLocale,
  onAppLocaleChange,
}: {
  appLocale: AppLocale;
  onAppLocaleChange: (locale: AppLocale) => void;
}) {
  const { profile, user } = useAuth();
   const [hotkey, setHotkey] = useState("Ctrl+Alt");
  const [transcriptionSettings, setTranscriptionSettings] = useState(DEFAULT_TRANSCRIPTION_SETTINGS);
  const [recentHistory, setRecentHistory] = useState<HomeHistoryItem[]>([]);
  const [hotkeyStatusMessage, setHotkeyStatusMessage] = useState("");
  const [isLocaleMenuOpen, setIsLocaleMenuOpen] = useState(false);
  const [hotkeyBackendInfo, setHotkeyBackendInfo] = useState<HotkeyBackendInfo | null>(null);
  const copy = getAppCopy(appLocale);
  const currentLocaleOption = HOME_LOCALE_OPTIONS.find((option) => option.value === appLocale);
  const historySectionRef = useRef<HTMLDivElement | null>(null);

  const hotkeyRecorderLabels = useMemo(
    () => ({
      listening: appLocale === "ja" ? "入力を待っています" : appLocale === "es" ? "Esperando entrada" : "Listening",
      currentHotkey: appLocale === "ja" ? "現在のショートカット" : appLocale === "es" ? "Atajo actual" : "Current shortcut",
      pressNow: appLocale === "ja" ? "ショートカットを押してください" : appLocale === "es" ? "Pulsa el atajo ahora" : "Press the shortcut now",
      helper:
        appLocale === "ja"
          ? "カードをクリックして、登録したいショートカットを押し、すべてのキーを離すと保存されます。"
          : appLocale === "es"
            ? "Haz clic en la tarjeta, pulsa el atajo que quieras y suelta todas las teclas para guardarlo."
            : "Click the card, press the shortcut you want, then release all keys to save it.",
      unsupportedMouseButtons:
        appLocale === "ja"
          ? "現在の設定では、マウスボタンをショートカットに登録できません。"
          : appLocale === "es"
            ? "Los botones del raton no se pueden usar como atajo con la configuracion actual."
            : "Mouse buttons are not available for shortcuts in the current setup.",
      unidentifiedInput:
        appLocale === "ja"
          ? "この入力は識別できなかったため、ショートカットとして登録できませんでした。"
          : appLocale === "es"
            ? "No se pudo identificar esta entrada, por lo que no puede registrarse como atajo."
            : "This input could not be identified, so it cannot be registered as a shortcut.",
    }),
    [appLocale],
  );

  useEffect(() => {
    try {
      const settings = readAppSettings();
       setHotkey(normalizeHotkeyForDisplay(settings.hotkey || "Ctrl+Alt"));
    } catch (error) {
      console.warn("Failed to read hotkey setting:", error);
    }
    setTranscriptionSettings(readTranscriptionSettings());
  }, []);

  useEffect(() => {
    invoke<HotkeyBackendInfo>("get_hotkey_backend_info")
      .then((info) => setHotkeyBackendInfo(info))
      .catch((error) => {
        console.warn("Failed to read hotkey backend info on home screen:", error);
      });
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchRecentHistory = async () => {
      const { data, error } = await supabase
        .from("transcription_history")
        .select("id, transcribed_text, created_at, credits_used")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error fetching recent home history:", error);
        return;
      }

      setRecentHistory(data || []);
    };

    void fetchRecentHistory();
    let unlistenFinished: (() => void) | undefined;
    listen("transcription-finished", () => {
      void fetchRecentHistory();
    }).then((fn) => {
      unlistenFinished = fn;
    });

    return () => {
      unlistenFinished?.();
    };
  }, [user]);

  const scrollToSection = (id: string) => {
    if (id === "history") {
      historySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleHotkeyChange = async (nextHotkey: string) => {
    const previousHotkey = normalizeHotkeyForDisplay(hotkey);
    const normalized = normalizeHotkeyForDisplay(nextHotkey);
    setHotkey(normalized);
    setHotkeyStatusMessage(copy.settingsHotkeyUpdating);

    try {
      await invoke<string>("set_global_shortcut", { shortcut: normalizeHotkeyForNative(normalized) });
      const currentRaw = localStorage.getItem("whispertype-settings");
      const currentParsed = currentRaw ? (JSON.parse(currentRaw) as Record<string, unknown>) : {};
      localStorage.setItem(
        "whispertype-settings",
        JSON.stringify({ ...currentParsed, ...transcriptionSettings, hotkey: normalized, appLocale }),
      );
      setHotkeyStatusMessage(copy.settingsHotkeyUpdated);
      window.setTimeout(() => setHotkeyStatusMessage(""), 1200);
    } catch (error) {
      console.error("Failed to save global shortcut:", error);
      setHotkey(previousHotkey);
      setHotkeyStatusMessage(
        appLocale === "ja"
          ? "ショートカットを更新できませんでした。もう一度お試しください。"
          : appLocale === "es"
            ? "No se pudo actualizar el atajo. Intentalo de nuevo."
            : "Shortcut could not be updated. Please try again.",
      );
    }
  };

  return (
    <AppShell
      eyebrow={copy.shellEyebrowHome}
      title={copy.shellTitle}
      description={copy.shellDescription}
      appLocale={appLocale}
      navItems={[
        { id: "home", label: copy.navHome },
        { id: "history", label: copy.recent },
        { id: "settings", label: copy.navSettings },
        { id: "plan", label: copy.navBilling },
      ]}
      activeNavId="home"
      onNavItemClick={scrollToSection}
      headerActions={
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsLocaleMenuOpen((current) => !current)}
            className="h-10 rounded-full border-black/8 bg-white/88 px-3 shadow-sm dark:border-white/10 dark:bg-[#141518]/80"
            aria-label={appLocale === "ja" ? "アプリの言語" : appLocale === "es" ? "Idioma" : "App language"}
            title={appLocale === "ja" ? "アプリの言語" : appLocale === "es" ? "Idioma" : "App language"}
          >
            <Languages className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-[0.14em]">
              {currentLocaleOption?.shortLabel ?? "EN"}
            </span>
          </Button>
          {isLocaleMenuOpen ? (
            <div className="absolute right-0 top-11 z-20 min-w-[170px] rounded-2xl border border-black/8 bg-white/96 p-2 shadow-[0_20px_40px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-[#151619]/96">
              {HOME_LOCALE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onAppLocaleChange(option.value);
                    setIsLocaleMenuOpen(false);
                  }}
                  className={[
                    "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-all duration-150 ease-out hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.985] motion-reduce:transform-none",
                    appLocale === option.value
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "text-slate-700 hover:bg-black/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.05]",
                  ].join(" ")}
                >
                  <span>{option.label}</span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-70">
                    {option.shortLabel}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <Card className="overflow-hidden rounded-[24px] border-black/8 bg-white/88 shadow-sm dark:border-white/8 dark:bg-[#141518]">
          <CardHeader className="gap-4 px-6 pb-2 pt-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 dark:border-white/8 dark:bg-[#1a1b1f] dark:text-slate-200">
                  <Keyboard className="h-3.5 w-3.5" />
                  {hotkey}
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                    {copy.homeStatusTitle}
                  </CardTitle>
                  <CardDescription className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {appLocale === "ja"
                      ? `${hotkey} を押して文字起こしを開始`
                      : appLocale === "es"
                        ? `Pulsa ${hotkey} para empezar a dictar`
                        : `Press ${hotkey} to start dictating`}
                  </CardDescription>
                </div>
              </div>
              <div className="min-w-[160px] rounded-[20px] border border-black/8 bg-white px-4 py-3 text-right shadow-sm dark:border-white/8 dark:bg-[#1a1b1f]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  {copy.creditsBalance}
                </p>
                <div className="mt-1 flex items-center justify-end gap-2">
                  <Coins className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                    {profile?.credits ?? copy.accessSyncing}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            <div className="rounded-[20px] border border-black/6 bg-[#fcfcfb] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:border-white/8 dark:bg-[#18191d]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-[16px] border border-black/8 bg-white shadow-sm dark:border-white/8 dark:bg-[#111214]">
                    <div className="absolute inset-0 rounded-[18px] bg-[linear-gradient(135deg,rgba(255,0,128,0.12),rgba(255,184,0,0.12),rgba(58,134,255,0.12))]" />
                    <img src="/icon.ico" alt="WhisperType" className="relative h-6 w-6 rounded-full object-cover" draggable={false} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{copy.holdToTalk}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{copy.recordTranscribeInsert}</p>
                  </div>
                </div>
                <span className="rounded-full border border-black/8 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-[#111214] dark:text-slate-200">
                  {copy.activeShortcut}: {hotkey}
                </span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-[16px] border border-black/6 bg-white/80 px-4 py-3 dark:border-white/8 dark:bg-[#101114]/70">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                    {copy.accountLabel}
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {profile?.name || user?.email || copy.signedIn}
                  </p>
                  <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                    {user?.email || profile?.email || copy.noEmail}
                  </p>
                </div>
                <div className="rounded-[16px] border border-black/6 bg-white/80 px-4 py-3 dark:border-white/8 dark:bg-[#101114]/70">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                    {copy.transcriptionLanguage}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {transcriptionSettings.language}
                  </p>
                </div>
                <div className="rounded-[16px] border border-black/6 bg-white/80 px-4 py-3 dark:border-white/8 dark:bg-[#101114]/70">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                    {copy.model}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {transcriptionSettings.model}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card ref={historySectionRef} className="rounded-[24px] border-black/8 bg-white/88 shadow-sm dark:border-white/8 dark:bg-[#141518]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Keyboard className="h-4 w-4 text-slate-700 dark:text-slate-200" />
              {copy.shortcutCardTitle}
            </CardTitle>
            <CardDescription>{copy.shortcutCardDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[22px] border border-black/6 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,255,255,0.84),rgba(250,245,255,0.98))] p-4 shadow-[0_16px_35px_rgba(15,23,42,0.06)] dark:border-white/8 dark:bg-[linear-gradient(135deg,rgba(24,25,29,0.98),rgba(20,21,24,0.96),rgba(28,20,36,0.98))]">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{copy.shortcutRecorderTitle}</span>
                <span className="rounded-full border border-black/8 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:border-white/10 dark:bg-[#101114] dark:text-slate-200">
                  {hotkey}
                </span>
              </div>
              <HotkeyRecorder
                value={hotkey}
                allowModifierOnly={hotkeyBackendInfo?.supports_modifier_only ?? false}
                allowMouseButtons={hotkeyBackendInfo?.supports_mouse_buttons ?? false}
                onChange={(nextHotkey) => {
                  void handleHotkeyChange(nextHotkey);
                }}
                onInvalid={(message) => setHotkeyStatusMessage(message)}
                labels={hotkeyRecorderLabels}
                className="w-full"
              />
            </div>
            {hotkeyStatusMessage ? <p className="text-xs text-slate-500 dark:text-slate-400">{hotkeyStatusMessage}</p> : null}
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border-black/8 bg-white/88 shadow-sm dark:border-white/8 dark:bg-[#141518]">
          <CardHeader className="px-6 pb-3 pt-5">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-slate-700 dark:text-slate-200" />
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">{copy.recent}</CardTitle>
            </div>
            <CardDescription className="text-sm text-slate-500 dark:text-slate-400">{copy.recentDescription}</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {recentHistory.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/8 bg-[#fcfcfb] px-4 py-6 text-sm text-slate-500 dark:border-white/10 dark:bg-[#18191d] dark:text-slate-400">
                {copy.noRecent}
              </div>
            ) : (
              <div className="space-y-3">
                {recentHistory.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-black/6 bg-[#fcfcfb] px-4 py-3 shadow-sm dark:border-white/8 dark:bg-[#18191d]">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 flex-1 text-sm leading-6 text-slate-700 dark:text-slate-200">
                        {item.transcribed_text || copy.noTextReturned}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          await navigator.clipboard.writeText(item.transcribed_text || "");
                        }}
                        className="h-8 shrink-0 rounded-full px-3 text-xs"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {copy.copy}
                      </Button>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{new Date(item.created_at).toLocaleString()}</p>
                      <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:border-white/10 dark:bg-[#101114] dark:text-slate-300">
                        -{item.credits_used}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
