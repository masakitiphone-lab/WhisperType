import type React from "react";
import { Check, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AppLocale } from "@/lib/appLocale";
import { GLASS_CARD, type PlanKey, type PromoResult } from "@/pages/mainPageTypes";

type PlanMeta = Record<
  PlanKey,
  {
    title: string;
    price: string;
    features: readonly string[];
    notes: readonly string[];
  }
>;

type Props = {
  appLocale: AppLocale;
  sectionAccent: React.ReactNode;
  sectionHeaderClass: string;
  sectionIconClass: string;
  sectionTitleClass: string;
  planMeta: PlanMeta;
  currentPlan: PlanKey;
  promoCode: string;
  isRedeemingPromo: boolean;
  promoResult: PromoResult;
  celebrationCredits: number | null;
  onPromoCodeChange: (value: string) => void;
  onRedeemPromoCode: () => void;
  onUpgradePlus: () => void;
  setSectionRef: (element: HTMLElement | null) => void;
};

export function MainPagePlanSection({
  appLocale,
  sectionAccent,
  sectionHeaderClass,
  sectionIconClass,
  sectionTitleClass,
  planMeta,
  currentPlan,
  promoCode,
  isRedeemingPromo,
  promoResult,
  celebrationCredits,
  onPromoCodeChange,
  onRedeemPromoCode,
  onUpgradePlus,
  setSectionRef,
}: Props) {
  const planDescription =
    appLocale === "ja"
      ? {
          free: "毎日 50 クレジットで試せる無料プラン",
          plus: "文字起こし無制限の有料プラン",
        }
      : {
          free: "Free plan with 50 daily credits",
          plus: "Paid plan with unlimited transcription",
        };

  return (
    <section ref={setSectionRef} id="plan" className="scroll-mt-8">
      <div className="mb-3">
        <div className={sectionHeaderClass}>
          <CreditCard className={sectionIconClass} />
          <p className={sectionTitleClass}>{appLocale === "ja" ? "プラン" : "Plan"}</p>
          {sectionAccent}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {(Object.keys(planMeta) as PlanKey[]).map((key) => {
          const plan = planMeta[key];
          const isCurrentPlan = currentPlan === key;

          return (
            <Card key={key} className={GLASS_CARD}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">{plan.title}</CardTitle>
                <div className="mt-1 text-3xl font-semibold">{plan.price}</div>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {planDescription[key]}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                      <Check className="h-4 w-4" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <ul className="space-y-1.5 rounded-[18px] border border-black/6 bg-white/55 p-4 text-xs leading-5 text-slate-500 dark:border-white/8 dark:bg-white/5 dark:text-slate-300">
                  {plan.notes.map((note) => (
                    <li key={note}>- {note}</li>
                  ))}
                </ul>
                {key === "plus" ? (
                  <Button
                    type="button"
                    onClick={onUpgradePlus}
                    disabled={isCurrentPlan}
                    className="w-full rounded-2xl bg-black text-white hover:bg-black/90 disabled:opacity-100 dark:bg-white dark:text-black dark:hover:bg-white/90"
                  >
                    {isCurrentPlan
                      ? appLocale === "ja"
                        ? "現在のプラン"
                        : "Current plan"
                      : appLocale === "ja"
                        ? "Plus にアップグレード"
                        : "Upgrade to Plus"}
                  </Button>
                ) : (
                  <Button type="button" variant="outline" className="w-full rounded-2xl" disabled>
                    {isCurrentPlan
                      ? appLocale === "ja"
                        ? "現在のプラン"
                        : "Current plan"
                      : appLocale === "ja"
                        ? "フリープラン"
                        : "Free plan"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className={[GLASS_CARD, "relative mt-6 overflow-hidden"].join(" ")}>
        <CardContent className="space-y-3 pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {appLocale === "ja" ? "プロモーションコード" : "Promotion code"}
          </p>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              value={promoCode}
              onChange={(event) => onPromoCodeChange(event.target.value)}
              placeholder={appLocale === "ja" ? "コードを入力" : "Code"}
              className="h-11 rounded-2xl border border-white/25 bg-white/75 px-4 text-sm text-slate-800 outline-none dark:border-white/10 dark:bg-white/6 dark:text-slate-100"
            />
            <Button
              type="button"
              disabled={isRedeemingPromo || promoCode.length === 0}
              onClick={onRedeemPromoCode}
              className="h-11 rounded-2xl px-5"
            >
              {isRedeemingPromo ? (appLocale === "ja" ? "適用中..." : "Applying...") : appLocale === "ja" ? "適用" : "Claim"}
            </Button>
          </div>
          {promoResult ? (
            <p className="text-sm text-slate-500 dark:text-slate-300">
              {promoResult.title}: {promoResult.message}
            </p>
          ) : null}
          {celebrationCredits ? <p className="text-sm text-slate-500 dark:text-slate-300">+{celebrationCredits}</p> : null}
        </CardContent>
      </Card>
    </section>
  );
}
