import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AppLocale } from "@/lib/appLocale";

type Props = {
  appLocale: AppLocale;
  isLocaleMenuOpen: boolean;
  localeLabel: string;
  onAppLocaleChange: (locale: AppLocale) => void;
  onLocaleMenuOpenChange: (next: boolean | ((current: boolean) => boolean)) => void;
  onRestartTutorial?: () => void;
};

export function MainPageHeaderActions({
  appLocale,
  isLocaleMenuOpen,
  localeLabel,
  onAppLocaleChange,
  onLocaleMenuOpenChange,
  onRestartTutorial,
}: Props) {
  return (
    <div className="flex items-center gap-2">
      {import.meta.env.DEV && onRestartTutorial ? (
        <Button
          type="button"
          variant="outline"
          onClick={onRestartTutorial}
          className="h-10 rounded-full border-dashed border-amber-300 bg-amber-50 px-3 text-amber-700 hover:bg-amber-100 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200"
        >
          {appLocale === "ja" ? "初回導線を再表示" : "Reset onboarding"}
        </Button>
      ) : null}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          onClick={() => onLocaleMenuOpenChange((current) => !current)}
          className="h-10 rounded-full border-white/35 bg-white/70 px-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/6"
          aria-label={appLocale === "ja" ? "言語を切り替える" : "Switch language"}
        >
          <Languages className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-[0.14em]">{localeLabel}</span>
        </Button>
        {isLocaleMenuOpen ? (
          <div className="absolute right-0 top-11 z-20 min-w-[170px] rounded-2xl border border-white/35 bg-white/88 p-2 shadow-[0_20px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#151619]/90">
            {[
              { value: "en", label: "English" },
              { value: "ja", label: "日本語" },
              { value: "es", label: "Español" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onAppLocaleChange(option.value as AppLocale);
                  onLocaleMenuOpenChange(false);
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-black/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.05]"
              >
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
