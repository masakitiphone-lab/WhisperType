import { ChevronLeft, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useLocation, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/useAuth";
import type { AppLocale } from "@/lib/appLocale";
import { getCheckoutProvider, isMicrosoftStoreBuild } from "@/lib/checkout";

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
    billing: "Billing",
    billingBody: "Payment is handled by Microsoft Store. Card entry is not collected in the app.",
    storeReady: "This build can use Microsoft Store billing.",
    storeUnavailable: "Microsoft Store billing is unavailable in this build.",
    refreshLicense: "Refresh license",
    licenseActive: "Subscription active",
    licenseInactive: "Subscription not active",
    purchaseIntro: "Start a monthly Microsoft Store subscription for WhisperType Plus.",
    purchaseButton: "Subscribe in Store",
    purchasePending: "Processing...",
    purchaseIncomplete: "Purchase was not completed.",
    purchaseFailed: "Failed to purchase through the Store.",
    localNote: "Local runs cannot complete the purchase. Use the packaged Microsoft Store build.",
    plans: {
      free: {
        title: "Free",
        price: "$0 / month",
        features: ["300 credits per month", "Standard transcription", "Recent history"],
        terms: ["Credits reset each month", "No payment required"],
      },
      plus: {
        title: "WhisperType Plus",
        price: "JPY 300 / month",
        features: ["Unlimited transcription", "Unlimited credits", "Billed through Microsoft Store"],
        terms: ["Monthly subscription", "Cancel from Microsoft account services", "Store policy applies to refunds"],
      },
    },
  },
  ja: {
    header: "購入",
    back: "戻る",
    plan: "プラン",
    terms: "利用条件",
    email: "メール",
    billing: "決済",
    billingBody: "決済は Microsoft Store が処理します。アプリ内でカード情報は収集しません。",
    storeReady: "このビルドでは Microsoft Store 決済を利用できます。",
    storeUnavailable: "このビルドでは Microsoft Store 決済を利用できません。",
    refreshLicense: "ライセンス更新",
    licenseActive: "サブスク有効",
    licenseInactive: "サブスク未確認",
    purchaseIntro: "WhisperType Plus の月額サブスクを Microsoft Store で開始します。",
    purchaseButton: "Store で登録",
    purchasePending: "処理中...",
    purchaseIncomplete: "購入は完了していません。",
    purchaseFailed: "Store 経由の購入に失敗しました。",
    localNote: "ローカル実行では購入できません。Microsoft Store 用パッケージで確認してください。",
    plans: {
      free: {
        title: "フリー",
        price: "¥0 / 月",
        features: ["毎月 300 credits", "標準文字起こし", "最近の履歴"],
        terms: ["credits は毎月更新", "支払い不要"],
      },
      plus: {
        title: "WhisperType Plus",
        price: "¥300 / 月",
        features: ["文字起こし無制限", "credits 無制限", "Microsoft Store 課金"],
        terms: ["月額サブスク", "解約は Microsoft アカウント側で管理", "返金は Store ポリシー準拠"],
      },
    },
  },
  es: {
    header: "Pago",
    back: "Volver",
    plan: "Plan",
    terms: "Términos",
    email: "Correo",
    billing: "Facturación",
    billingBody: "El pago lo gestiona Microsoft Store. La app no recoge datos de tarjeta.",
    storeReady: "Esta compilación puede usar la facturación de Microsoft Store.",
    storeUnavailable: "La facturación de Microsoft Store no está disponible en esta compilación.",
    refreshLicense: "Actualizar licencia",
    licenseActive: "Suscripción activa",
    licenseInactive: "Suscripción no activa",
    purchaseIntro: "Inicia una suscripción mensual de Microsoft Store para WhisperType Plus.",
    purchaseButton: "Suscribirse en Store",
    purchasePending: "Procesando...",
    purchaseIncomplete: "La compra no se completó.",
    purchaseFailed: "No se pudo comprar en Microsoft Store.",
    localNote: "Las ejecuciones locales no pueden completar la compra. Usa la compilación empaquetada para Microsoft Store.",
    plans: {
      free: {
        title: "Free",
        price: "$0 / mes",
        features: ["300 créditos al mes", "Transcripción estándar", "Historial reciente"],
        terms: ["Los créditos se reinician cada mes", "No requiere pago"],
      },
      plus: {
        title: "WhisperType Plus",
        price: "JPY 300 / mes",
        features: ["Transcripción ilimitada", "Créditos ilimitados", "Cobro con Microsoft Store"],
        terms: ["Suscripción mensual", "Cancela desde los servicios de tu cuenta Microsoft", "Los reembolsos siguen la política de Store"],
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
    billing: string;
    billingBody: string;
    storeReady: string;
    storeUnavailable: string;
    refreshLicense: string;
    licenseActive: string;
    licenseInactive: string;
    purchaseIntro: string;
    purchaseButton: string;
    purchasePending: string;
    purchaseIncomplete: string;
    purchaseFailed: string;
    localNote: string;
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
  const [checkoutProvider, setCheckoutProvider] = useState<"ms-store" | null>(null);
  const [isStoreBuild, setIsStoreBuild] = useState(false);
  const [hasStoreLicense, setHasStoreLicense] = useState<boolean | null>(null);
  const [isRefreshingLicense, setIsRefreshingLicense] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [provider, storeBuild, license] = await Promise.all([
          getCheckoutProvider(),
          isMicrosoftStoreBuild(),
          invoke<boolean>("check_plus_store_license").catch(() => null),
        ]);

        setCheckoutProvider(provider);
        setIsStoreBuild(storeBuild);
        setHasStoreLicense(license);
      } catch (error) {
        console.error("Failed to load checkout status:", error);
      }
    })();
  }, []);

  const refreshLicense = async () => {
    setIsRefreshingLicense(true);
    try {
      const license = await invoke<boolean>("check_plus_store_license");
      setHasStoreLicense(license);
      if (license) {
        await refreshProfile();
      }
    } catch (error) {
      console.error("Failed to refresh Store license:", error);
    } finally {
      setIsRefreshingLicense(false);
    }
  };

  const handleStorePurchase = async () => {
    setIsPurchasing(true);
    setPurchaseError("");
    try {
      const success = await invoke<boolean>("purchase_plus_via_store");
      if (success) {
        await refreshLicense();
        navigate("/plan");
      } else {
        setPurchaseError(copy.purchaseIncomplete);
      }
    } catch (error) {
      console.error("Store purchase failed:", error);
      setPurchaseError(copy.purchaseFailed);
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

              <div className="rounded-[20px] border border-black/8 bg-white/70 p-4 text-sm text-slate-600 dark:border-white/8 dark:bg-white/5 dark:text-slate-300">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{copy.billing}</p>
                <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                  {checkoutProvider === "ms-store" ? "Microsoft Store" : "Unavailable"}
                </p>
                <p className="mt-2">{copy.billingBody}</p>
                <p className="mt-2">{isStoreBuild ? copy.storeReady : copy.storeUnavailable}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => void refreshLicense()} disabled={isRefreshingLicense}>
                    <RefreshCw className={`h-4 w-4 ${isRefreshingLicense ? "animate-spin" : ""}`} />
                    {copy.refreshLicense}
                  </Button>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      hasStoreLicense
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "bg-slate-500/10 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {hasStoreLicense ? copy.licenseActive : copy.licenseInactive}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-full max-w-[560px] space-y-4">
                <div className="rounded-[24px] border border-black/8 bg-white/75 p-5 text-sm leading-6 text-slate-600 dark:border-white/8 dark:bg-white/5 dark:text-slate-300">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    <ShieldCheck className="h-4 w-4" />
                    Microsoft Store
                  </div>
                  <p className="mt-3">{copy.purchaseIntro}</p>
                </div>

                <div className="space-y-3">
                  <Button
                    type="button"
                    disabled={isPurchasing || !isStoreBuild}
                    onClick={handleStorePurchase}
                    className="h-12 w-full rounded-2xl bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                  >
                    {isPurchasing ? copy.purchasePending : copy.purchaseButton}
                  </Button>
                  {purchaseError ? <p className="text-xs text-rose-600 dark:text-rose-300">{purchaseError}</p> : null}
                  {!isStoreBuild ? <p className="text-xs text-slate-500 dark:text-slate-400">{copy.localNote}</p> : null}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
