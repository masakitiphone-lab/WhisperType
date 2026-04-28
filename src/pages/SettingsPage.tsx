import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { Keyboard, Paintbrush, Wand2 } from "lucide-react";
import { HotkeyRecorder } from "@/components/HotkeyRecorder";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/useAuth";
import { normalizeHotkeyForDisplay, normalizeHotkeyForNative } from "@/lib/hotkeys";
import { getAppCopy, type AppLocale } from "@/lib/appLocale";
import { DEFAULT_APP_SETTINGS, readAppSettings, writeAppSettings, type AppSettings } from "@/lib/appSettings";
import { readOverlayScale, writeOverlayScale } from "@/lib/uiPreferences";
import {
  DEFAULT_TRANSCRIPTION_PROMPT,
  ENGLISH_TRANSCRIPTION_PROMPT,
  JAPANESE_TRANSCRIPTION_PROMPT,
  LEGACY_DEFAULT_TRANSCRIPTION_PROMPT,
} from "@/lib/transcription";
import { requestPreferredAudioStream } from "@/lib/audioCapture";
import { DEFAULT_HOTKEY, LANGUAGE_OPTIONS, MODEL_OPTIONS, getUiCopy, type HotkeyBackendInfo } from "@/pages/settingsPageData";

type Settings = AppSettings;

const DEFAULT_SETTINGS: Settings = {
  ...DEFAULT_APP_SETTINGS,
  hotkey: DEFAULT_HOTKEY,
  overlayScale: readOverlayScale(),
};
export default function SettingsPage({ appLocale }: { appLocale: AppLocale; onAppLocaleChange: (locale: AppLocale) => void; }) {
  const { user, isLoading } = useAuth();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [hotkeyStatus, setHotkeyStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [hotkeyStatusMessage, setHotkeyStatusMessage] = useState("");
  const [hotkeyBackendInfo, setHotkeyBackendInfo] = useState<HotkeyBackendInfo | null>(null);
  const settingsLoadedRef = useRef(false);
  const copy = getAppCopy(appLocale);
  const ui = useMemo(() => getUiCopy(appLocale), [appLocale]);
  const displayUi =
    appLocale === "ja"
      ? {
          ...ui,
          interfaceTitle: "文字起こし設定",
          interfaceDescription: "言語やモデルなど、よく使う設定をここでまとめて調整できます。",
          hotkeyTitle: "ショートカット",
          hotkeyDescription: "作業を止めずに録音を始められるショートカットを設定します。",
          hotkeyIdleHint: "カードをクリックして、設定したいキーを押し、すべて離すと保存されます。",
          overlayTitle: "オーバーレイとサウンド",
          overlayDescription: "録音中に表示されるオーバーレイとサウンドの動作を調整します。",
          promptTitle: "プロンプト",
          promptDescription: "固有名詞や文体の補助が必要なときだけ設定してください。",
          autoInsert: "自動で入力する",
          soundVolume: "サウンド音量",
          backend: "ショートカット互換性",
        }
      : appLocale === "es"
        ? {
            ...ui,
            interfaceDescription: "Ajusta idioma y modelo en un solo lugar.",
            hotkeyTitle: "Atajo",
            hotkeyDescription: "Configura un atajo claro para empezar a dictar al instante mientras trabajas.",
            hotkeyIdleHint: "Haz clic en la tarjeta, pulsa la combinacion y suelta todas las teclas para guardarla.",
            overlayDescription: "Controla la UI flotante y el comportamiento del sonido durante la grabacion.",
            promptDescription: "Usalo solo cuando necesites ayudar con nombres, estilo o contexto.",
            autoInsert: "Insertar automaticamente",
            backend: "Compatibilidad del atajo",
          }
        : {
            ...ui,
            interfaceDescription: "Adjust language and model in one place.",
            hotkeyDescription: "Choose a shortcut that lets you start dictation instantly while you work.",
            hotkeyIdleHint: "Click the card, press the shortcut, then release all keys to save it.",
            overlayDescription: "Control the floating UI and sound behavior during recording.",
            promptDescription: "Use this only when you need help with names, style, or context.",
            autoInsert: "Insert automatically",
            backend: "Shortcut compatibility",
          };
  const hotkeyRecorderLabels = useMemo(() => {
    if (appLocale === "ja") {
      return {
        listening: "入力を待っています",
        currentHotkey: "現在のショートカット",
        pressNow: "ショートカットを押してください",
        helper: "カードをクリックして、設定したいショートカットを押し、すべてのキーを離すと保存されます。",
        unsupportedMouseButtons: "現在の設定ではマウスボタンをショートカットに登録できません。",
        unidentifiedInput: "この入力は識別できなかったため、ショートカットとして登録できませんでした。",
      };
    }

    if (appLocale === "es") {
      return {
        listening: "Esperando entrada",
        currentHotkey: "Atajo actual",
        pressNow: "Pulsa el atajo ahora",
        helper: "Haz clic en la tarjeta, pulsa el atajo que quieras y suelta todas las teclas para guardarlo.",
        unsupportedMouseButtons: "Los botones del raton no se pueden usar como atajo con la configuracion actual.",
        unidentifiedInput: "No se pudo identificar esta entrada, por lo que no puede registrarse como atajo.",
      };
    }

    return {
      listening: "Listening",
      currentHotkey: "Current shortcut",
      pressNow: "Press the shortcut now",
      helper: "Click the card, press the shortcut you want, then release all keys to save it.",
      unsupportedMouseButtons: "Mouse buttons are not available for shortcuts in the current setup.",
      unidentifiedInput: "This input could not be identified, so it cannot be registered as a shortcut.",
    };
  }, [appLocale]);

  useEffect(() => {
    const parsed = readAppSettings();
    setSettings({
      ...DEFAULT_SETTINGS,
      ...parsed,
      hotkey: normalizeHotkeyForDisplay(parsed.hotkey || DEFAULT_SETTINGS.hotkey),
      prompt:
        typeof parsed.prompt === "string" && parsed.prompt !== LEGACY_DEFAULT_TRANSCRIPTION_PROMPT
          ? parsed.prompt
          : DEFAULT_SETTINGS.prompt,
    });
    settingsLoadedRef.current = true;
  }, []);

  useEffect(() => {
    if (!settingsLoadedRef.current) return;
    const timeout = window.setTimeout(() => {
      writeAppSettings(settings);
      writeOverlayScale(settings.overlayScale);
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [settings]);

  useEffect(() => {
    requestPreferredAudioStream()
      .then((stream) => stream.getTracks().forEach((track) => track.stop()))
      .catch((error) => console.warn("Microphone permission was denied or not available:", error));
  }, []);

  useEffect(() => {
    invoke<HotkeyBackendInfo>("get_hotkey_backend_info")
      .then((info) => setHotkeyBackendInfo(info))
      .catch((error) => console.warn("Failed to read hotkey backend info:", error));
  }, []);

  const handleHotkeyChange = async (hotkey: string) => {
    const previousHotkey = normalizeHotkeyForDisplay(settings.hotkey);
    const nextHotkey = normalizeHotkeyForDisplay(hotkey);
    setSettings((current) => ({ ...current, hotkey: nextHotkey }));
    setHotkeyStatus("saving");
    setHotkeyStatusMessage(copy.settingsHotkeyUpdating);

    try {
      await invoke<string>("set_global_shortcut", {
        shortcut: normalizeHotkeyForNative(nextHotkey),
      });
      setSettings((current) => ({ ...current, hotkey: nextHotkey }));
      writeAppSettings({ ...settings, hotkey: nextHotkey });
      setHotkeyStatus("saved");
      setHotkeyStatusMessage(copy.settingsHotkeyUpdated);
      window.setTimeout(() => setHotkeyStatus("idle"), 1200);
    } catch (error) {
      console.error("Failed to save global shortcut:", error);
      setSettings((current) => ({ ...current, hotkey: previousHotkey }));
      setHotkeyStatus("error");
      setHotkeyStatusMessage(appLocale === "ja" ? "\u30b7\u30e7\u30fc\u30c8\u30ab\u30c3\u30c8\u3092\u66f4\u65b0\u3067\u304d\u307e\u305b\u3093\u3067\u3057\u305f\u3002\u3082\u3046\u4e00\u5ea6\u304a\u8a66\u3057\u304f\u3060\u3055\u3044\u3002" : appLocale === "es" ? "No se pudo actualizar el atajo. Intentalo de nuevo." : "Shortcut could not be updated. Please try again.");
      window.setTimeout(() => setHotkeyStatus("idle"), 1600);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{copy.settingsLoading}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const toggleRows: Array<{ key: keyof Settings; label: string }> = [
    { key: "showOverlay", label: displayUi.showOverlay },
    { key: "showWaveform", label: displayUi.showWaveform },
    { key: "playStartSound", label: displayUi.playStartSound },
    { key: "playStopSound", label: displayUi.playStopSound },
    { key: "autoInsert", label: displayUi.autoInsert },
  ];

  return (
    <div className="space-y-6">
      <Card className="rounded-[24px] border-black/8 bg-white/88 shadow-sm dark:border-white/8 dark:bg-[#141518]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Paintbrush className="w-4 h-4 text-slate-800 dark:text-slate-100" />
            {displayUi.interfaceTitle}
          </CardTitle>
          <CardDescription>{displayUi.interfaceDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 rounded-[18px] border border-black/6 bg-[#fcfcfb] p-4 dark:border-white/8 dark:bg-[#18191d]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{displayUi.transcriptionLanguage}</p>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map((option) => (
                <Button key={option.value} type="button" variant="outline" size="sm" onClick={() => setSettings((current) => ({ ...current, language: option.value }))} className={settings.language === option.value ? "rounded-full border-black bg-black text-white hover:bg-black/90 dark:border-white dark:bg-white dark:text-black" : "rounded-full border-black/10 bg-transparent hover:bg-black/[0.04] dark:border-white/10 dark:hover:bg-white/[0.04]"}>
                  {option.labels[appLocale]}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-[18px] border border-black/6 bg-[#fcfcfb] p-4 dark:border-white/8 dark:bg-[#18191d]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{displayUi.model}</p>
            <div className="flex flex-wrap gap-2">
              {MODEL_OPTIONS.map((option) => (
                <Button key={option.value} type="button" variant="outline" size="sm" onClick={() => setSettings((current) => ({ ...current, model: option.value }))} className={settings.model === option.value ? "rounded-full border-black bg-black text-white hover:bg-black/90 dark:border-white dark:bg-white dark:text-black" : "rounded-full border-black/10 bg-transparent hover:bg-black/[0.04] dark:border-white/10 dark:hover:bg-white/[0.04]"}>
                  {option.labels[appLocale]}
                </Button>
              ))}
            </div>
          </div>

        </CardContent>
      </Card>

      <Card className="rounded-[24px] border-black/8 bg-white/88 shadow-sm dark:border-white/8 dark:bg-[#141518]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-slate-800 dark:text-slate-100" />
            {displayUi.hotkeyTitle}
          </CardTitle>
          <CardDescription>{displayUi.hotkeyDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <HotkeyRecorder
            value={settings.hotkey}
            allowModifierOnly={hotkeyBackendInfo?.supports_modifier_only ?? false}
            allowMouseButtons={hotkeyBackendInfo?.supports_mouse_buttons ?? false}
            labels={hotkeyRecorderLabels}
            onChange={(hotkey) => void handleHotkeyChange(hotkey)}
            onInvalid={(message) => {
              setHotkeyStatus("error");
              setHotkeyStatusMessage(message);
              window.setTimeout(() => setHotkeyStatus("idle"), 1600);
            }}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">{hotkeyStatus === "idle" ? displayUi.hotkeyIdleHint : hotkeyStatusMessage}</p>
          {hotkeyBackendInfo?.platform === "macos" ? (
            <div className="rounded-2xl border border-white/45 bg-white/55 px-4 py-3 text-xs leading-5 text-slate-600 dark:border-white/10 dark:bg-white/8 dark:text-slate-300">
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-full border border-white/45 bg-white/55 px-3 py-1 dark:border-white/10 dark:bg-white/10">
                  {displayUi.inputMonitoring}: {displayUi.checking}
                </span>
                <span className="rounded-full border border-white/45 bg-white/55 px-3 py-1 dark:border-white/10 dark:bg-white/10">
                  {displayUi.nativeRuntime}: {displayUi.checking}
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                {displayUi.backend}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-[24px] border-black/8 bg-white/88 shadow-sm dark:border-white/8 dark:bg-[#141518]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Paintbrush className="w-4 h-4 text-slate-800 dark:text-slate-100" />
            {displayUi.overlayTitle}
          </CardTitle>
          <CardDescription>{displayUi.overlayDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {toggleRows.map((item) => (
              <div key={item.key} className="flex items-center justify-between rounded-[18px] border border-black/6 bg-[#fcfcfb] px-4 py-3 text-sm dark:border-white/8 dark:bg-[#18191d]">
                <span className="font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
                <Switch checked={Boolean(settings[item.key])} onClick={() => setSettings((current) => ({ ...current, [item.key]: !Boolean(current[item.key]) }))} />
              </div>
            ))}
          </div>
          <div className="space-y-2 rounded-[18px] border border-black/6 bg-[#fcfcfb] p-4 dark:border-white/8 dark:bg-[#18191d]">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-600 dark:text-slate-300">{displayUi.soundVolume}</span>
              <span className="rounded-full border border-black/8 bg-white px-3 py-1 text-xs font-semibold dark:border-white/8 dark:bg-[#101114]">{Math.round(settings.soundVolume * 100)}%</span>
            </div>
            <input type="range" min="0" max="1" step="0.05" value={settings.soundVolume} onChange={(event) => setSettings((current) => ({ ...current, soundVolume: Number.parseFloat(event.target.value) }))} className="w-full accent-black dark:accent-white" />
          </div>
          <div className="space-y-2 rounded-[18px] border border-black/6 bg-[#fcfcfb] p-4 dark:border-white/8 dark:bg-[#18191d]">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-600 dark:text-slate-300">{displayUi.overlayScale}</span>
              <span className="rounded-full border border-black/8 bg-white px-3 py-1 text-xs font-semibold dark:border-white/8 dark:bg-[#101114]">{settings.overlayScale.toFixed(2)}x</span>
            </div>
            <input type="range" min="0.8" max="2" step="0.05" value={settings.overlayScale} onChange={(event) => setSettings((current) => ({ ...current, overlayScale: Number.parseFloat(event.target.value) }))} className="w-full accent-black dark:accent-white" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[24px] border-black/8 bg-white/88 shadow-sm dark:border-white/8 dark:bg-[#141518]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-slate-800 dark:text-slate-100" />
            {displayUi.promptTitle}
          </CardTitle>
          <CardDescription>{displayUi.promptDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea value={settings.prompt} onChange={(event) => setSettings((current) => ({ ...current, prompt: event.target.value }))} rows={6} className="w-full resize-y rounded-2xl border border-black/8 bg-[#fcfcfb] px-4 py-3 text-sm text-slate-800 shadow-sm dark:border-white/8 dark:bg-[#18191d] dark:text-slate-100" />
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setSettings((current) => ({ ...current, prompt: DEFAULT_TRANSCRIPTION_PROMPT }))}>{displayUi.clearPrompt}</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setSettings((current) => ({ ...current, prompt: JAPANESE_TRANSCRIPTION_PROMPT }))}>{displayUi.presetJapanese}</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setSettings((current) => ({ ...current, prompt: ENGLISH_TRANSCRIPTION_PROMPT }))}>{displayUi.presetEnglish}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




