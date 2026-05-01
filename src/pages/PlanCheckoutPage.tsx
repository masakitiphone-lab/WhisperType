import { ChevronLeft, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/useAuth";
import type { AppLocale } from "@/lib/appLocale";
import { invoke } from "@tauri-apps/api/core";

type PlanKey = "free" | "plus";

const NAV_ITEMS = [
  { id: "home", label: { en: "Home", ja: "ホーム" } },
  { id: "settings", label: { en: "Settings", ja: "設定" } },
  { id: "plan", label: { en: "Plan", ja: "プラン" } },
] as const;

const COPY = {
  en: {
    header: "Checkout",
    back: "Back",
    plan: "Plan",
    terms: "Terms",
    email: "Email",
    cardDetails: "Card details",
    cardDetailsBody: "Enter your card details to activate Plus.",
    plans: {
      free: {
        title: "Free",
        price: "$0 / month",
        features: ["300 credits per month", "Standard transcription", "Recent history"],
        terms: ["Credits reset each month", "No payment required"],
      },
      plus: {
        title: "WhisperType Plus",
        price: "$3 / month",
        features: ["Unlimited credits", "Unlimited transcription", "Priority billing support"],
        terms: ["Billed monthly", "Cancel anytime from Settings", "No partial refunds"],
      },
    },
  },
  ja: {
    header: "決済",
    back: "戻る",
    plan: "プラン",
    terms: "利用条件",
    email: "メール",
    cardDetails: "カード情報",
    cardDetailsBody: "カード情報を入力して Plus を有効化します。",
    plans: {
      free: {
        title: "フリー",
        price: "¥0 / 月",
        features: ["毎月 300 credits", "標準の書き起こし", "最近の履歴"],
        terms: ["credits は毎月更新", "支払い不要"],
      },
      plus: {
        title: "WhisperType Plus",
        price: "¥300 / 月",
        features: ["無制限 credits", "高速書き起こし", "優先的な請求サポート"],
        terms: ["毎月自動更新", "Settings からいつでも解約可能", "返金はありません"],
      },
    },
  },
  es: {
    header: "Pago",
    back: "Volver",
    plan: "Plan",
    terms: "Términos",
    email: "Correo",
    cardDetails: "Datos de la tarjeta",
    cardDetailsBody: "Introduce los datos de tu tarjeta para activar Plus.",
    plans: {
      free: {
        title: "Free",
        price: "$0 / mes",
        features: ["300 créditos por mes", "Transcripción estándar", "Historial reciente"],
        terms: ["Los créditos se reinician cada mes", "No requiere pago"],
      },
      plus: {
        title: "WhisperType Plus",
        price: "$3 / mes",
        features: ["Créditos ilimitados", "Transcripción ilimitada", "Soporte prioritario de facturación"],
        terms: ["Cobro mensual", "Puedes cancelar desde Settings", "Sin reembolsos parciales"],
      },
    },
  },
} as const satisfies Record<
  AppLocale,
  {
    header: string;
    back: string;
    plan: string;
    terms: string;
    email: string;
    cardDetails: string;
    cardDetailsBody: string;
    plans: Record<PlanKey, { title: string; price: string; features: string[]; terms: string[] }>;
  }
>;

export default function PlanCheckoutPage({ appLocale }: { appLocale: AppLocale }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, refreshProfile } = useAuth();
  const plan = ((location.state as { plan?: PlanKey } | null)?.plan ?? "plus") as PlanKey;
  const copy = COPY[appLocale];
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");

  const handleStorePurchase = async () => {
    setIsPurchasing(true);
    setPurchaseError("");
    try {
      const success = await invoke<boolean>("purchase_plus_via_store");
      if (success) {
        await refreshProfile();
        navigate("/plan");
      } else {
        setPurchaseError(appLocale === "ja" ? "購入が完了しませんでした。" : "Purchase was not completed.");
      }
    } catch (err) {
      console.error("Store purchase failed:", err);
      setPurchaseError(
        appLocale === "ja"
          ? "ストアでの購入に失敗しました。"
          : "Failed to purchase through the Store."
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <AppShell
      appLocale={appLocale}
      navItems={NAV_ITEMS.map((item) => ({ id: item.id, label: item.label[appLocale === "ja" ? "ja" : "en"] }))}
      activeNavId="plan"
      onNavItemClick={(id) => navigate(`/${id}`)}
      headerActions={null}
    >
      <div className="space-y-6">
        <Button type="button" variant="ghost" className="w-fit rounded-full px-3" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4" />
          {copy.back}
        </Button>

        <Card className="rounded-[30px] border border-white/40 bg-white/70 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/6">
          <CardHeader className="pb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{copy.header}</p>
            <CardTitle className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
              {copy.plans[plan].title}
            </CardTitle>
          </CardHeader>

          <CardContent className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-4 rounded-[24px] border border-black/8 bg-white/75 p-5 dark:border-white/8 dark:bg-white/5">
              <div className="space-y-2">
                <p className="text-sm text-slate-500 dark:text-slate-400">{copy.plan}</p>
                <p className="text-2xl font-semibold text-slate-950 dark:text-slate-50">{copy.plans[plan].title}</p>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{copy.plans[plan].price}</p>
              </div>

              <div className="space-y-2">
                {copy.plans[plan].features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-[20px] border border-black/8 bg-white/80 p-4 text-sm leading-6 text-slate-600 dark:border-white/8 dark:bg-[#17181c] dark:text-slate-300">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{copy.terms}</p>
                <ul className="mt-2 space-y-1.5">
                  {copy.plans[plan].terms.map((term) => (
                    <li key={term}>• {term}</li>
                  ))}
                </ul>
              </div>

              {profile?.email ? (
                <div className="rounded-[20px] border border-black/8 bg-white/70 p-4 text-sm text-slate-600 dark:border-white/8 dark:bg-white/5 dark:text-slate-300">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{copy.email}</p>
                  <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">{profile.email}</p>
                </div>
              ) : null}
            </div>

            <div className="flex justify-center">
                <div className="w-full max-w-[560px] space-y-4">
                  <div className="rounded-[24px] border border-black/8 bg-white/75 p-5 text-sm leading-6 text-slate-600 dark:border-white/8 dark:bg-white/5 dark:text-slate-300">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      <ShieldCheck className="h-4 w-4" />
                      Microsoft Store
                    </div>
                    <p className="mt-3">
                      {appLocale === "ja"
                        ? "Microsoft Store で Plus を購入します。"
                        : "Purchase Plus through the Microsoft Store."}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Button
                      type="button"
                      disabled={isPurchasing}
                      onClick={handleStorePurchase}
                      className="h-12 w-full rounded-2xl bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                    >
                      {isPurchasing ? "Processing…" : appLocale === "ja" ? "Store で購入" : "Buy in Store"}
                    </Button>
                    {purchaseError ? (
                      <p className="text-xs text-rose-600 dark:text-rose-300">{purchaseError}</p>
                    ) : null}
                  </div>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
