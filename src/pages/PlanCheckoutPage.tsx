import { ChevronLeft, RefreshCw, ShieldCheck, Store } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useLocation, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/useAuth";
import type { AppLocale } from "@/lib/appLocale";
import {
  getStorePurchaseErrorMessage,
  readStoreBillingStatus,
  type StoreBillingStatus,
} from "@/lib/storeBilling";

type PlanKey = "free" | "plus";

const NAV_ITEMS = [
  { id: "home", label: { en: "Home", ja: "ホーム", es: "Inicio" } },
  { id: "settings", label: { en: "Settings", ja: "設定", es: "Ajustes" } },
  { id: "plan", label: { en: "Plan", ja: "プラン", es: "Plan" } },
] as const;

const COPY = {
  en: {
    header: "Checkout",
    back: "Back",
    plan: "Plan",
    terms: "Terms",
    email: "Email",
    billing: "Billing",
    billingBody: "Payment is handled by Microsoft Store. Card details are never collected in WhisperType.",
    storeReady: "This packaged build can use Microsoft Store billing.",
    storeUnavailable: "Microsoft Store billing is available only in the packaged Store build.",
    productConfigured: "Plus subscription product is configured.",
    productMissing: "Plus subscription product is not configured yet.",
    refreshLicense: "Refresh license",
    licenseActive: "Subscription active",
    licenseInactive: "Subscription not active",
    purchaseIntro: "Start a monthly Microsoft Store subscription for WhisperType Plus.",
    purchaseButton: "Subscribe in Microsoft Store",
    purchasePending: "Processing...",
    purchaseIncomplete: "Purchase was not completed.",
    purchaseFailed: "Failed to purchase through Microsoft Store.",
    productNotConfigured: "Store product ID is not configured yet. Add it after creating the subscription add-on in Partner Center.",
    storeBuildRequired: "Use the packaged Microsoft Store build to test purchases.",
    plans: {
      free: {
        title: "Free",
        price: "$0 / month",
        features: ["50 daily credits", "Bonus credits after daily credits", "Recent history"],
        terms: ["Daily credits reset once per day", "No payment required"],
      },
      plus: {
        title: "WhisperType Plus",
        price: "¥300 / month",
        features: ["Unlimited transcription billing", "500 transcriptions per day", "Billed through Microsoft Store"],
        terms: ["Monthly subscription add-on", "Cancel from Microsoft account services", "Store refund policy applies"],
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
    billingBody: "決済は Microsoft Store が処理します。WhisperType 内でカード情報は保存しません。",
    storeReady: "このパッケージ版では Microsoft Store 決済を利用できます。",
    storeUnavailable: "Microsoft Store 決済は Store 用にパッケージ化したビルドでのみ利用できます。",
    productConfigured: "Plus サブスクリプション商品は設定済みです。",
    productMissing: "Plus サブスクリプション商品はまだ設定されていません。",
    refreshLicense: "ライセンスを更新",
    licenseActive: "サブスクリプション有効",
    licenseInactive: "サブスクリプション未確認",
    purchaseIntro: "WhisperType Plus の月額サブスクリプションを Microsoft Store で開始します。",
    purchaseButton: "Microsoft Store で登録",
    purchasePending: "処理中...",
    purchaseIncomplete: "購入は完了していません。",
    purchaseFailed: "Microsoft Store での購入に失敗しました。",
    productNotConfigured: "Store 商品IDが未設定です。Partner Center でサブスクリプション add-on を作成した後に設定してください。",
    storeBuildRequired: "購入テストには Microsoft Store 用にパッケージ化したビルドを使ってください。",
    plans: {
      free: {
        title: "フリー",
        price: "¥0 / 月",
        features: ["毎日 50 クレジット", "デイリー消費後はボーナスクレジットを使用", "最近の履歴"],
        terms: ["デイリークレジットは1日1回リセット", "支払い不要"],
      },
      plus: {
        title: "WhisperType Plus",
        price: "¥300 / 月",
        features: ["課金上は文字起こし無制限", "1日500回まで", "Microsoft Store 経由で決済"],
        terms: ["月額サブスクリプション add-on", "Microsoft アカウントのサービス画面から解約", "返金は Store ポリシーに準拠"],
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
    billingBody: "Microsoft Store procesa el pago. WhisperType no recoge datos de tarjeta.",
    storeReady: "Esta compilación empaquetada puede usar la facturación de Microsoft Store.",
    storeUnavailable: "La facturación de Microsoft Store solo está disponible en la compilación empaquetada.",
    productConfigured: "El producto de suscripción Plus está configurado.",
    productMissing: "El producto de suscripción Plus todavía no está configurado.",
    refreshLicense: "Actualizar licencia",
    licenseActive: "Suscripción activa",
    licenseInactive: "Suscripción no activa",
    purchaseIntro: "Inicia una suscripción mensual de Microsoft Store para WhisperType Plus.",
    purchaseButton: "Suscribirse en Microsoft Store",
    purchasePending: "Procesando...",
    purchaseIncomplete: "La compra no se completó.",
    purchaseFailed: "No se pudo comprar en Microsoft Store.",
    productNotConfigured: "Falta el Store product ID. Añádelo después de crear el add-on de suscripción en Partner Center.",
    storeBuildRequired: "Usa la compilación empaquetada de Microsoft Store para probar compras.",
    plans: {
      free: {
        title: "Free",
        price: "$0 / mes",
        features: ["50 créditos diarios", "Créditos bonus después de los diarios", "Historial reciente"],
        terms: ["Los créditos diarios se reinician una vez al día", "No requiere pago"],
      },
      plus: {
        title: "WhisperType Plus",
        price: "¥300 / mes",
        features: ["Transcripción ilimitada para facturación", "500 transcripciones al día", "Cobro con Microsoft Store"],
        terms: ["Add-on de suscripción mensual", "Cancela desde los servicios de tu cuenta Microsoft", "Reembolsos según política de Store"],
      },
    },
  },
} as const;

export default function PlanCheckoutPage({ appLocale }: { appLocale: AppLocale }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, refreshProfile } = useAuth();
  const plan = ((location.state as { plan?: PlanKey } | null)?.plan ?? "plus") as PlanKey;
  const copy = COPY[appLocale];
  const [billingStatus, setBillingStatus] = useState<StoreBillingStatus | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");
  const [isRefreshingLicense, setIsRefreshingLicense] = useState(false);

  const canPurchase = Boolean(
    billingStatus?.isStoreBuild &&
      billingStatus.isProductConfigured &&
      !billingStatus.hasLicense
  );

  const purchaseHint = useMemo(() => {
    if (!billingStatus?.isStoreBuild) return copy.storeBuildRequired;
    if (!billingStatus.isProductConfigured) return copy.productNotConfigured;
    return "";
  }, [billingStatus, copy.productNotConfigured, copy.storeBuildRequired]);

  const loadBillingStatus = async () => {
    const status = await readStoreBillingStatus();
    setBillingStatus(status);
    return status;
  };

  useEffect(() => {
    void loadBillingStatus().catch((error) => {
      console.error("Failed to load checkout status:", error);
    });
  }, []);

  const refreshLicense = async () => {
    setIsRefreshingLicense(true);
    try {
      const license = await invoke<boolean>("check_plus_store_license");
      setBillingStatus((current) => current ? { ...current, hasLicense: license } : current);
      if (license) await refreshProfile();
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
      if (!success) {
        setPurchaseError(copy.purchaseIncomplete);
        return;
      }

      await loadBillingStatus();
      await refreshProfile();
      navigate("/plan");
    } catch (error) {
      const code = getStorePurchaseErrorMessage(error);
      setPurchaseError(
        code === "store_product_not_configured"
          ? copy.productNotConfigured
          : code === "store_build_required"
            ? copy.storeBuildRequired
            : copy.purchaseFailed
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <AppShell
      appLocale={appLocale}
      navItems={NAV_ITEMS.map((item) => ({ id: item.id, label: item.label[appLocale] }))}
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
                    <li key={term}>- {term}</li>
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

            <div className="space-y-4">
              <div className="rounded-[24px] border border-black/8 bg-white/75 p-5 text-sm leading-6 text-slate-600 dark:border-white/8 dark:bg-white/5 dark:text-slate-300">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  <Store className="h-4 w-4" />
                  {copy.billing}
                </div>
                <p className="mt-3 font-medium text-slate-900 dark:text-slate-100">Microsoft Store</p>
                <p className="mt-2">{copy.billingBody}</p>
                <p className="mt-2">{billingStatus?.isStoreBuild ? copy.storeReady : copy.storeUnavailable}</p>
                <p className="mt-1">
                  {billingStatus?.isProductConfigured ? copy.productConfigured : copy.productMissing}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => void refreshLicense()} disabled={isRefreshingLicense}>
                    <RefreshCw className={`h-4 w-4 ${isRefreshingLicense ? "animate-spin" : ""}`} />
                    {copy.refreshLicense}
                  </Button>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      billingStatus?.hasLicense
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "bg-slate-500/10 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {billingStatus?.hasLicense ? copy.licenseActive : copy.licenseInactive}
                  </span>
                </div>
              </div>

              <div className="rounded-[24px] border border-black/8 bg-white/75 p-5 text-sm leading-6 text-slate-600 dark:border-white/8 dark:bg-white/5 dark:text-slate-300">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  <ShieldCheck className="h-4 w-4" />
                  WhisperType Plus
                </div>
                <p className="mt-3">{copy.purchaseIntro}</p>
                <Button
                  type="button"
                  disabled={isPurchasing || !canPurchase}
                  onClick={handleStorePurchase}
                  className="mt-4 h-12 w-full rounded-2xl bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                >
                  {isPurchasing ? copy.purchasePending : copy.purchaseButton}
                </Button>
                {purchaseError ? <p className="mt-3 text-xs text-rose-600 dark:text-rose-300">{purchaseError}</p> : null}
                {!purchaseError && purchaseHint ? <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{purchaseHint}</p> : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
