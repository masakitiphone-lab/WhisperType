import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Mic, MousePointerClick, Settings2 } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { HotkeyRecorder } from "@/components/HotkeyRecorder";
import { requestPreferredAudioStream } from "@/lib/audioCapture";
import { readAppSettings, writeAppSettings } from "@/lib/appSettings";
import { normalizeHotkeyForDisplay, normalizeHotkeyForNative } from "@/lib/hotkeys";
import type { AppLocale } from "@/lib/appLocale";

type Copy = {
  eyebrow: string;
  title: string;
  micTitle: string;
  micHint: string;
  micAction: string;
  micReady: string;
  hotkeyTitle: string;
  hotkeyHint: string;
  hotkeyAction: string;
  practiceTitle: string;
  practiceHint: string;
  success: string;
  finish: string;
  skip: string;
};

type AudioInput = { deviceId: string; label: string };

function getCopy(locale: AppLocale): Copy {
  if (locale === "ja") {
    return {
      eyebrow: "TRY IT ONCE",
      title: "はじめの1回を試してください",
      micTitle: "マイクを選ぶ",
      micHint: "使う入力マイクを選択してから確認します。",
      micAction: "マイクを確認",
      micReady: "マイクを確認しました",
      hotkeyTitle: "ショートカット確認",
      hotkeyHint: "今のショートカットを確認して、必要ならここで変更します。",
      hotkeyAction: "次へ進む",
      practiceTitle: "練習用入力欄",
      practiceHint: "ショートカットを押して、ホールドして、入力を開始してください。",
      success: "入力を確認しました",
      finish: "チュートリアルを完了",
      skip: "あとでやる",
    };
  }

  if (locale === "es") {
    return {
      eyebrow: "TRY IT ONCE",
      title: "Prueba la primera vez",
      micTitle: "Elegir microfono",
      micHint: "Selecciona el microfono de entrada y verificalo.",
      micAction: "Comprobar microfono",
      micReady: "Microfono verificado",
      hotkeyTitle: "Shortcut check",
      hotkeyHint: "Revisa y ajusta tu atajo si hace falta.",
      hotkeyAction: "Continuar",
      practiceTitle: "Campo de practica",
      practiceHint: "Pulsa el atajo, mantenlo y empieza a dictar.",
      success: "Entrada detectada",
      finish: "Terminar tutorial",
      skip: "Mas tarde",
    };
  }

  return {
    eyebrow: "TRY IT ONCE",
    title: "Try the first run once",
    micTitle: "Pick a mic",
    micHint: "Choose the input mic you want to use, then verify it.",
    micAction: "Check mic",
    micReady: "Mic verified",
    hotkeyTitle: "Shortcut check",
    hotkeyHint: "Review your shortcut and change it if needed.",
    hotkeyAction: "Continue",
    practiceTitle: "Practice input",
    practiceHint: "Press the shortcut, hold it, then start typing.",
    success: "Input detected",
    finish: "Finish tutorial",
    skip: "Do this later",
  };
}

const SAMPLE_TEXTS = {
  en: [
    "The paper cup sat beside the blue lamp.",
    "A quiet breeze moved the curtains at noon.",
    "Tomorrow we will test the shortcut again.",
  ],
  ja: [
    "青いカップの横にノートを置いた。",
    "午後の風がカーテンを少し揺らした。",
    "明日もう一度ショートカットを試します。",
  ],
  es: [
    "La taza azul quedo junto a la mesa.",
    "Una brisa suave movio las cortinas al mediodia.",
    "Manana probaremos el atajo otra vez.",
  ],
} as const;

function getSampleText(locale: AppLocale) {
  const pool = SAMPLE_TEXTS[locale] ?? SAMPLE_TEXTS.en;
  return pool[Math.floor(Math.random() * pool.length)] ?? pool[0];
}

export default function TutorialPracticeModal({
  initialLocale,
  onComplete,
  onSkip,
}: {
  initialLocale: AppLocale;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [value, setValue] = useState("");
  const [step, setStep] = useState<"mic" | "hotkey" | "practice">("mic");
  const [micChecked, setMicChecked] = useState(false);
  const [audioInputs, setAudioInputs] = useState<AudioInput[]>([]);
  const [selectedMicId, setSelectedMicId] = useState(readAppSettings().preferredAudioInputDeviceId || "");
  const [hotkey, setHotkey] = useState(() => normalizeHotkeyForDisplay(readAppSettings().hotkey));
  const micCheckRanRef = useRef(false);
  const copy = getCopy(initialLocale);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const sampleText = useMemo(() => getSampleText(initialLocale), [initialLocale]);
  const selectedMicLabel =
    audioInputs.find((item) => item.deviceId === selectedMicId)?.label ||
    (initialLocale === "ja" ? "デフォルトのマイク" : initialLocale === "es" ? "Microfono predeterminado" : "Default mic");

  useEffect(() => {
    if (step === "practice") {
      textAreaRef.current?.focus();
    }
  }, [step]);

  useEffect(() => {
    if (step !== "mic" || micCheckRanRef.current) return;
    micCheckRanRef.current = true;
    void handleMicCheck().catch(() => {
      micCheckRanRef.current = false;
    });
  }, [step]);

  useEffect(() => {
    const loadDevices = async () => {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices
        .filter((device) => device.kind === "audioinput")
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || (initialLocale === "ja" ? `マイク ${index + 1}` : initialLocale === "es" ? `Microfono ${index + 1}` : `Mic ${index + 1}`),
        }));
      setAudioInputs(inputs);
      if (!selectedMicId && inputs.length > 0) {
        setSelectedMicId(inputs[0]?.deviceId ?? "");
      }
    };

    void loadDevices();
  }, [initialLocale, selectedMicId]);

  const handleMicCheck = async () => {
    await invoke("log_to_terminal", {
      msg: `[Tutorial] mic_check_start selectedMicId=${selectedMicId || "default"}`,
    }).catch(() => undefined);
    const stream = await requestPreferredAudioStream(selectedMicId || undefined);
    stream.getTracks().forEach((track) => track.stop());
    setMicChecked(true);
    await invoke("log_to_terminal", {
      msg: `[Tutorial] mic_check_complete selectedMicId=${selectedMicId || "default"}`,
    }).catch(() => undefined);
  };

  const handleHotkeyChange = async (nextHotkey: string) => {
    const normalized = normalizeHotkeyForDisplay(nextHotkey);
    setHotkey(normalized);
    writeAppSettings({ hotkey: normalized });
    try {
      await invoke<string>("set_global_shortcut", { shortcut: normalizeHotkeyForNative(normalized) });
    } catch {
      // keep the local value; user can still continue in tutorial
    }
  };

  const handleMicNext = () => {
    if (!micChecked) return;
    void invoke("log_to_terminal", {
      msg: `[Tutorial] mic_next selectedMicId=${selectedMicId || "default"}`,
    }).catch(() => undefined);
    writeAppSettings({ preferredAudioInputDeviceId: selectedMicId });
    setStep("hotkey");
  };

  const handleHotkeyNext = () => {
    void invoke("log_to_terminal", {
      msg: `[Tutorial] hotkey_next currentHotkey=${hotkey}`,
    }).catch(() => undefined);
    setStep("practice");
  };

  return (
    <div className="fixed inset-0 z-[121] flex items-center justify-center bg-slate-950/42 px-4 py-6 backdrop-blur-sm">
      <Card className="w-full max-w-4xl rounded-[28px] border-black/8 bg-white/98 shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
        <CardHeader className="space-y-3 border-b border-black/6 px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{copy.eyebrow}</p>
          <CardTitle className="text-2xl tracking-tight text-slate-950">{copy.title}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5 px-6 py-6">
          {step === "mic" ? (
            <div className="rounded-[24px] border border-black/6 bg-[#fbfaf7] p-5">
              <div className="flex items-start gap-3">
                <Mic className="mt-1 h-5 w-5 shrink-0 text-slate-600" />
                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{copy.micTitle}</p>
                    <p className="text-sm leading-6 text-slate-600">{copy.micHint}</p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="outline" className="w-full justify-between rounded-2xl">
                        <span className="truncate">{selectedMicLabel}</span>
                        <span className="text-xs text-slate-400">{audioInputs.length ? `${audioInputs.length}` : ""}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-[320px] overflow-auto">
                      {audioInputs.length > 0 ? (
                        audioInputs.map((device) => (
                          <DropdownMenuItem
                            key={device.deviceId}
                            onSelect={() => setSelectedMicId(device.deviceId)}
                            className={selectedMicId === device.deviceId ? "bg-black/[0.06] font-semibold dark:bg-white/10" : ""}
                          >
                            <span className="truncate">{device.label}</span>
                            {selectedMicId === device.deviceId ? <Check className="h-4 w-4" /> : null}
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-slate-500">No input devices found.</div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="flex items-center justify-between gap-3">
                    <Button type="button" className="rounded-2xl" onClick={() => void handleMicCheck()}>
                      {copy.micAction}
                    </Button>
                    {micChecked ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                        <Check className="h-4 w-4" />
                        {copy.micReady}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex justify-end">
                    <Button type="button" className="rounded-2xl px-5" onClick={handleMicNext} disabled={!micChecked}>
                      {initialLocale === "ja" ? "次へ" : initialLocale === "es" ? "Siguiente" : "Next"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {step === "hotkey" ? (
            <div className="rounded-[24px] border border-black/6 bg-[#fbfaf7] p-5">
              <div className="flex items-start gap-3">
                <Settings2 className="mt-1 h-5 w-5 shrink-0 text-slate-600" />
                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{copy.hotkeyTitle}</p>
                    <p className="text-sm leading-6 text-slate-600">{copy.hotkeyHint}</p>
                  </div>
                  <HotkeyRecorder
                    value={hotkey}
                    onChange={(next) => {
                      void handleHotkeyChange(next);
                    }}
                    className="w-full"
                  />
                  <div className="flex justify-end">
                    <Button type="button" className="rounded-2xl px-5" onClick={handleHotkeyNext}>
                      {copy.hotkeyAction}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {step === "practice" ? (
            <div className="rounded-[24px] border border-black/6 bg-[#fbfaf7] p-5">
              <div className="flex items-start gap-3">
                <MousePointerClick className="mt-1 h-5 w-5 shrink-0 text-slate-600" />
                <div className="min-w-0 flex-1 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{copy.practiceTitle}</p>
                    <p className="text-sm leading-6 text-slate-600">{copy.practiceHint}</p>
                  </div>
                  <div className="rounded-2xl border border-black/6 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
                    {sampleText}
                  </div>
                  <textarea
                    ref={textAreaRef}
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    autoFocus
                    onMouseDown={(event) => event.currentTarget.focus()}
                    onClick={(event) => event.currentTarget.focus()}
                    rows={10}
                    aria-label={copy.practiceTitle}
                    className="min-h-[320px] w-full resize-none rounded-2xl border border-black/8 bg-white px-4 py-4 text-sm leading-6 text-slate-800 shadow-sm outline-none ring-0 transition focus:border-slate-400"
                  />
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex min-h-[44px] items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              {value.trim().length > 0 ? <Check className="h-4 w-4" /> : null}
              {value.trim().length > 0 ? copy.success : ""}
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                className="rounded-2xl text-slate-500 hover:bg-black/[0.04] hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/[0.05] dark:hover:text-slate-100"
                onClick={onSkip}
              >
                {copy.skip}
              </Button>
              <Button
                type="button"
                className="rounded-2xl px-5"
                onClick={() => {
                  void invoke("log_to_terminal", {
                    msg: `[Tutorial] complete text_len=${value.trim().length}`,
                  }).catch(() => undefined);
                  onComplete();
                }}
                disabled={value.trim().length === 0}
              >
                {copy.finish}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
