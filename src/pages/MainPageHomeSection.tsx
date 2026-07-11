import type { ReactNode } from "react";
import { Check, ChevronDown, Home, Plus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { AppLocale } from "@/lib/appLocale";
import type { AppSettings } from "@/lib/appSettings";
import { LANGUAGE_OPTIONS, MODEL_OPTIONS } from "@/pages/settingsPageData";
import { GLASS_PANEL } from "@/pages/mainPageTypes";

type MainPageHomeSectionProps = {
  appLocale: AppLocale;
  bonusCreditCount: number | null;
  creditSummaryLabel: string;
  currentPlan: "free" | "plus";
  currentPlanLabel: string;
  language: AppSettings["language"];
  languageLabel: string;
  micState: "checking" | "available" | "missing" | "blocked";
  model: AppSettings["model"];
  modelLabel: string;
  sectionAccent: ReactNode;
  sectionHeaderClass: string;
  sectionIconClass: string;
  sectionLabelClass: string;
  sectionTitleClass: string;
  sectionValueClass: string;
  shortcutLabel: string;
  onLanguageChange: (language: AppSettings["language"]) => void;
  onModelChange: (model: AppSettings["model"]) => void;
  setSectionRef: (element: HTMLElement | null) => void;
};

export function MainPageHomeSection({
  appLocale,
  bonusCreditCount,
  creditSummaryLabel,
  currentPlan,
  currentPlanLabel,
  language,
  languageLabel,
  micState,
  model,
  modelLabel,
  sectionAccent,
  sectionHeaderClass,
  sectionIconClass,
  sectionLabelClass,
  sectionTitleClass,
  sectionValueClass,
  shortcutLabel,
  onLanguageChange,
  onModelChange,
  setSectionRef,
}: MainPageHomeSectionProps) {
  return (
    <section ref={setSectionRef} id="home" className="scroll-mt-8">
      <div className="space-y-6">
        <div className={sectionHeaderClass}>
          <Home className={sectionIconClass} />
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <p className={sectionTitleClass}>{appLocale === "ja" ? "ホーム" : "Home"}</p>
              {sectionAccent}
            </div>
          </div>
        </div>

        <div className="grid gap-5 overflow-hidden rounded-[30px] border border-white/35 bg-[linear-gradient(135deg,rgba(248,250,252,0.86),rgba(244,247,252,0.92),rgba(248,250,252,0.86))] px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] transition-all duration-200 ease-out dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03),rgba(255,255,255,0.05))] lg:min-h-[430px] lg:grid-cols-[0.82fr_1.18fr] lg:items-stretch">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                {appLocale === "ja" ? "音声入力の準備ができています" : "Voice input is ready"}
              </p>
              <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                {appLocale === "ja" ? `${shortcutLabel} を押して開始` : `Press ${shortcutLabel} to start`}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-700 dark:text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {micState === "available"
                  ? appLocale === "ja"
                    ? "マイク利用可能"
                    : "Mic available"
                  : micState === "blocked"
                    ? appLocale === "ja"
                      ? "マイク許可が必要"
                      : "Mic permission needed"
                    : appLocale === "ja"
                      ? "マイクを確認中"
                      : "Checking mic"}
              </span>
            </div>
          </div>

          <div className="relative flex min-h-[340px] items-center justify-center overflow-visible rounded-[26px] lg:min-h-0">
            <img
              src="/hero-woman-transparent.png"
              alt={appLocale === "ja" ? "音声入力のイラスト" : "Voice input illustration"}
              className="relative z-10 block h-full max-h-[min(54vw,560px)] w-full max-w-none object-contain object-center lg:absolute lg:inset-0 lg:h-full lg:max-h-none"
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className={GLASS_PANEL + " px-4 py-3"}>
            <p className={sectionLabelClass}>Plan</p>
            <p className={`mt-1 ${sectionValueClass}`}>{currentPlanLabel}</p>
          </div>

          <div className={GLASS_PANEL + " px-4 py-3"}>
            <p className={sectionLabelClass}>Credits</p>
            <div className="mt-1 flex min-w-0 items-center justify-between gap-3 overflow-hidden">
              <p className={`${sectionValueClass} shrink-0 whitespace-nowrap`}>{creditSummaryLabel}</p>
              {currentPlan === "plus" ? (
                <p className="min-w-0 truncate text-right text-xs text-slate-500 dark:text-slate-400">
                  {appLocale === "ja" ? "文字起こし無制限" : "Unlimited transcription"}
                </p>
              ) : bonusCreditCount !== null ? (
                <div className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <Plus className="h-3.5 w-3.5" />
                  <span>{appLocale === "ja" ? "ボーナス" : "Bonus"}</span>
                  <span>{bonusCreditCount}</span>
                </div>
              ) : null}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className={GLASS_PANEL + " group flex w-full items-center justify-between px-4 py-3 text-left"}>
                <div>
                  <p className={sectionLabelClass}>Language</p>
                  <p className={`mt-1 ${sectionValueClass}`}>{languageLabel}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-500 transition-transform duration-200 ease-out group-hover:translate-y-[1px] dark:text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {LANGUAGE_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onSelect={() => onLanguageChange(option.value)}
                  className={language === option.value ? "bg-black/[0.06] font-semibold dark:bg-white/10" : ""}
                >
                  <span>{option.labels[appLocale]}</span>
                  {language === option.value ? <Check className="h-4 w-4" /> : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className={GLASS_PANEL + " group flex w-full items-center justify-between px-4 py-3 text-left"}>
                <div>
                  <p className={sectionLabelClass}>Model</p>
                  <p className={`mt-1 ${sectionValueClass}`}>{modelLabel}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-500 transition-transform duration-200 ease-out group-hover:translate-y-[1px] dark:text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {MODEL_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onSelect={() => onModelChange(option.value)}
                  className={model === option.value ? "bg-black/[0.06] font-semibold dark:bg-white/10" : ""}
                >
                  <span>{option.labels[appLocale]}</span>
                  {model === option.value ? <Check className="h-4 w-4" /> : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </section>
  );
}
