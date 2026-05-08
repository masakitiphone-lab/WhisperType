import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import type { AppLocale } from "@/lib/appLocale";
import type { AppSettings } from "@/lib/appSettings";
import type { UiCopy } from "@/pages/settingsPageData";
import { GLASS_PANEL } from "@/pages/mainPageTypes";

type MainPageOverlaySettingsProps = {
  appLocale: AppLocale;
  settings: AppSettings;
  setSettings: Dispatch<SetStateAction<AppSettings>>;
  ui: UiCopy;
};

export function MainPageOverlaySettings({
  appLocale,
  settings,
  setSettings,
  ui,
}: MainPageOverlaySettingsProps) {
  return (
    <>
      <div className={GLASS_PANEL + " p-4"}>
        <div className="flex items-center justify-between">
          <label htmlFor="overlay-scale" className="text-sm">{ui.overlayScale}</label>
          <span className="text-xs font-semibold">{settings.overlayScale.toFixed(2)}x</span>
        </div>
        <input
          id="overlay-scale"
          type="range"
          min="0.8"
          max="2"
          step="0.05"
          value={settings.overlayScale}
          aria-label={ui.overlayScale}
          onChange={(event) =>
            setSettings((current) => ({
              ...current,
              overlayScale: Number.parseFloat(event.target.value),
            }))
          }
          className="mt-3 w-full accent-black dark:accent-white"
        />
      </div>

      <div className={GLASS_PANEL + " p-4"}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
              {appLocale === "ja" ? "オーバーレイ位置" : appLocale === "es" ? "Posición del overlay" : "Overlay position"}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {appLocale === "ja"
                ? "録音中の表示位置を選びます。"
                : appLocale === "es"
                  ? "Elige dónde aparece durante la grabación."
                  : "Choose where it appears while recording."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-1 rounded-[14px] border border-black/6 bg-white/65 p-1 dark:border-white/8 dark:bg-white/5">
            {(["bottom", "top"] as const).map((position) => {
              const isSelected = settings.overlayPosition === position;
              const label =
                position === "bottom"
                  ? appLocale === "ja"
                    ? "下"
                    : appLocale === "es"
                      ? "Abajo"
                      : "Bottom"
                  : appLocale === "ja"
                    ? "上"
                    : appLocale === "es"
                      ? "Arriba"
                      : "Top";
              return (
                <Button
                  key={position}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSettings((current) => ({ ...current, overlayPosition: position }))}
                  className={[
                    "h-8 rounded-[10px] px-4 text-xs font-semibold",
                    isSelected
                      ? "bg-slate-950 text-white shadow-sm hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-white"
                      : "text-slate-600 hover:bg-white/75 dark:text-slate-300 dark:hover:bg-white/10",
                  ].join(" ")}
                >
                  {label}
                </Button>
              );
            })}
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <OverlayOffsetSlider
            id="overlay-offset-x"
            label={appLocale === "ja" ? "左右" : appLocale === "es" ? "Horizontal" : "Horizontal"}
            value={settings.overlayOffsetX}
            min={-400}
            max={400}
            ariaLabel={appLocale === "ja" ? "オーバーレイ左右位置" : "Overlay horizontal position"}
            onChange={(overlayOffsetX) => setSettings((current) => ({ ...current, overlayOffsetX }))}
          />
          <OverlayOffsetSlider
            id="overlay-offset-y"
            label={appLocale === "ja" ? "上下" : appLocale === "es" ? "Vertical" : "Vertical"}
            value={settings.overlayOffsetY}
            min={-240}
            max={240}
            ariaLabel={appLocale === "ja" ? "オーバーレイ上下位置" : "Overlay vertical position"}
            onChange={(overlayOffsetY) => setSettings((current) => ({ ...current, overlayOffsetY }))}
          />
        </div>
      </div>
    </>
  );
}

function OverlayOffsetSlider({
  id,
  label,
  value,
  min,
  max,
  ariaLabel,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  ariaLabel: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-medium text-slate-600 dark:text-slate-300">
          {label}
        </label>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{value}px</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step="10"
        value={value}
        aria-label={ariaLabel}
        onChange={(event) => onChange(Number.parseInt(event.target.value, 10))}
        className="mt-2 w-full accent-black dark:accent-white"
      />
    </div>
  );
}
