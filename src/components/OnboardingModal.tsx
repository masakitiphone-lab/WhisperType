import { useMemo, useState } from "react";
import { Check, Globe2, Languages, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AppLocale } from "@/lib/appLocale";
import {
  ENGLISH_TRANSCRIPTION_PROMPT,
  JAPANESE_TRANSCRIPTION_PROMPT,
  type TranscriptionLanguage,
  type TranscriptionModel,
} from "@/lib/transcription";

type PresetMode = "japanese" | "english";

type OnboardingResult = {
  appLocale: AppLocale;
  language: TranscriptionLanguage;
  model: TranscriptionModel;
  prompt: string;
};

type Copy = {
  eyebrow: string;
  title: string;
  description: string;
  steps: [string, string, string];
  next: string;
  back: string;
  finish: string;
  appLocale: string;
  appLocaleDescription: string;
  transcriptionLanguage: string;
  transcriptionLanguageDescription: string;
  model: string;
  modelDescription: string;
  preset: string;
  presetDescription: string;
  turbo: string;
  full: string;
  auto: string;
  japanese: string;
  english: string;
  spanish: string;
  japanesePreset: string;
  englishPreset: string;
};

function getCopy(locale: AppLocale): Copy {
  if (locale === "ja") {
    return {
      eyebrow: "QUICK SETUP",
      title: "最初の設定を整えましょう",
      description: "よく使う設定だけ先に選んでおくと、WhisperType をすぐに使い始められます。",
      steps: ["表示言語", "文字起こし設定", "プリセット"],
      next: "次へ",
      back: "戻る",
      finish: "この設定で始める",
      appLocale: "表示言語",
      appLocaleDescription: "アプリ全体の表示言語を選びます。",
      transcriptionLanguage: "文字起こし言語",
      transcriptionLanguageDescription: "主に話す言語を選んでください。",
      model: "モデル",
      modelDescription: "速度重視か、精度重視かを選べます。",
      preset: "プリセット",
      presetDescription: "文章の雰囲気や固有名詞に合わせた初期設定です。",
      turbo: "Turbo: 速度重視",
      full: "Full: 精度重視",
      auto: "自動",
      japanese: "日本語",
      english: "英語",
      spanish: "スペイン語",
      japanesePreset: "日本語プリセット",
      englishPreset: "英語プリセット",
    };
  }

  if (locale === "es") {
    return {
      eyebrow: "QUICK SETUP",
      title: "Configura lo esencial",
      description: "Elige solo lo importante una vez para empezar a usar WhisperType de inmediato.",
      steps: ["Idioma", "Transcripcion", "Preset"],
      next: "Siguiente",
      back: "Atras",
      finish: "Empezar con esta configuracion",
      appLocale: "Idioma de la app",
      appLocaleDescription: "Idioma principal de la interfaz.",
      transcriptionLanguage: "Idioma de transcripcion",
      transcriptionLanguageDescription: "Elige el idioma que usas con mas frecuencia.",
      model: "Modelo",
      modelDescription: "Elige entre velocidad y precision.",
      preset: "Preset",
      presetDescription: "Aplica una configuracion inicial para nombres y estilo.",
      turbo: "Turbo: prioriza velocidad",
      full: "Full: prioriza precision",
      auto: "Auto",
      japanese: "Japones",
      english: "Ingles",
      spanish: "Espanol",
      japanesePreset: "Preset japones",
      englishPreset: "Preset ingles",
    };
  }

  return {
    eyebrow: "QUICK SETUP",
    title: "Set up the basics",
    description: "Choose the essentials once so WhisperType feels ready from the start.",
    steps: ["Language", "Transcription", "Preset"],
    next: "Next",
    back: "Back",
    finish: "Start with these settings",
    appLocale: "App language",
    appLocaleDescription: "Primary interface language.",
    transcriptionLanguage: "Transcription language",
    transcriptionLanguageDescription: "Pick the language you use most often.",
    model: "Model",
    modelDescription: "Choose between speed and accuracy.",
    preset: "Preset",
    presetDescription: "Apply a starter prompt for names and writing style.",
    turbo: "Turbo: prioritize speed",
    full: "Full: prioritize accuracy",
    auto: "Auto",
    japanese: "Japanese",
    english: "English",
    spanish: "Spanish",
    japanesePreset: "Japanese preset",
    englishPreset: "English preset",
  };
}

function getPromptForPreset(preset: PresetMode) {
  return preset === "japanese" ? JAPANESE_TRANSCRIPTION_PROMPT : ENGLISH_TRANSCRIPTION_PROMPT;
}

function StepBadge({ active, children }: { active: boolean; children: string }) {
  return (
    <div
      className={
        active
          ? "rounded-full bg-slate-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white"
          : "rounded-full border border-black/8 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400"
      }
    >
      {children}
    </div>
  );
}

function OptionButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm",
        active
          ? "border-slate-950 bg-slate-950 font-semibold text-white shadow-[0_8px_24px_rgba(15,23,42,0.22)]"
          : "border-black/8 bg-white font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full",
          active ? "bg-white/16" : "border border-slate-300 bg-white"
        )}
      >
        {active ? <Check className="h-3.5 w-3.5" /> : null}
      </span>
      {label}
    </button>
  );
}

export default function OnboardingModal({
  initialLocale,
  onComplete,
}: {
  initialLocale: AppLocale;
  onComplete: (result: OnboardingResult) => void;
}) {
  const [step, setStep] = useState(0);
  const [selectedLocale, setSelectedLocale] = useState<AppLocale>(initialLocale);
  const [language, setLanguage] = useState<TranscriptionLanguage>(
    initialLocale === "ja" ? "ja" : initialLocale === "es" ? "es" : "auto",
  );
  const [model, setModel] = useState<TranscriptionModel>("whisper-large-v3");
  const [preset, setPreset] = useState<PresetMode>(initialLocale === "ja" ? "japanese" : "english");
  const copy = useMemo(() => getCopy(selectedLocale), [selectedLocale]);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/34 px-4 py-6 backdrop-blur-sm">
      <Card className="w-full max-w-2xl rounded-[28px] border-black/8 bg-white/98 shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
        <CardHeader className="space-y-4 border-b border-black/6 px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{copy.eyebrow}</p>
          <div className="space-y-2">
            <CardTitle className="text-2xl tracking-tight text-slate-950">{copy.title}</CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-6 text-slate-600">{copy.description}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {copy.steps.map((label, index) => (
              <StepBadge key={label} active={step === index}>
                {label}
              </StepBadge>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-5 px-6 py-6">
          {step === 0 ? (
            <div className="rounded-[24px] border border-black/6 bg-[#fbfaf7] p-5">
              <div className="flex items-start gap-3">
                <Globe2 className="mt-1 h-5 w-5 text-slate-600" />
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{copy.appLocale}</p>
                    <p className="text-sm leading-6 text-slate-600">{copy.appLocaleDescription}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {([
                      { value: "ja", label: "日本語" },
                      { value: "en", label: "English" },
                      { value: "es", label: "Español" },
                    ] as Array<{ value: AppLocale; label: string }>).map((option) => (
                      <OptionButton
                        key={option.value}
                        active={selectedLocale === option.value}
                        label={option.label}
                        onClick={() => setSelectedLocale(option.value)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-black/6 bg-[#fbfaf7] p-5">
                <div className="flex items-start gap-3">
                  <Languages className="mt-1 h-5 w-5 text-slate-600" />
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{copy.transcriptionLanguage}</p>
                      <p className="text-sm leading-6 text-slate-600">{copy.transcriptionLanguageDescription}</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {([
                        { value: "auto", label: copy.auto },
                        { value: "ja", label: copy.japanese },
                        { value: "en", label: copy.english },
                        { value: "es", label: copy.spanish },
                      ] as Array<{ value: TranscriptionLanguage; label: string }>).map((option) => (
                        <OptionButton
                          key={option.value}
                          active={language === option.value}
                          label={option.label}
                          onClick={() => setLanguage(option.value)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-black/6 bg-[#fbfaf7] p-5">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-1 h-5 w-5 text-slate-600" />
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{copy.model}</p>
                      <p className="text-sm leading-6 text-slate-600">{copy.modelDescription}</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <OptionButton
                        active={model === "whisper-large-v3-turbo"}
                        label={copy.turbo}
                        onClick={() => setModel("whisper-large-v3-turbo")}
                      />
                      <OptionButton
                        active={model === "whisper-large-v3"}
                        label={copy.full}
                        onClick={() => setModel("whisper-large-v3")}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="rounded-[24px] border border-black/6 bg-[#fbfaf7] p-5">
              <div className="flex items-start gap-3">
                <Wand2 className="mt-1 h-5 w-5 text-slate-600" />
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{copy.preset}</p>
                    <p className="text-sm leading-6 text-slate-600">{copy.presetDescription}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <OptionButton
                      active={preset === "japanese"}
                      label={copy.japanesePreset}
                      onClick={() => setPreset("japanese")}
                    />
                    <OptionButton
                      active={preset === "english"}
                      label={copy.englishPreset}
                      onClick={() => setPreset("english")}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="ghost"
              className="rounded-2xl text-slate-500 hover:bg-black/[0.04] hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/[0.05] dark:hover:text-slate-100"
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              disabled={step === 0}
            >
              {copy.back}
            </Button>

            {step < 2 ? (
              <Button
                type="button"
                className="rounded-2xl px-5"
                onClick={() => setStep((current) => Math.min(2, current + 1))}
              >
                {copy.next}
              </Button>
            ) : (
              <Button
                type="button"
                className="rounded-2xl px-5"
                onClick={() =>
                  onComplete({
                    appLocale: selectedLocale,
                    language,
                    model,
                    prompt: getPromptForPreset(preset),
                  })
                }
              >
                {copy.finish}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
