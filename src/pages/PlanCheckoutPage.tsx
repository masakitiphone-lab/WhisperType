import { ChevronLeft, RefreshCw, ShieldCheck, Sparkles, Store } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/useAuth";
import type { AppLocale } from "@/lib/appLocale";
import {
  getStorePurchaseErrorMessage,
  readStoreBillingStatus,
  type StoreBillingStatus,
} from "@/lib/storeBilling";

const NAV_ITEMS = [
  { id: "home", label: { en: "Home", ja: "ホーム", es: "Inicio" } },
  { id: "settings", label: { en: "Settings", ja: "設定", es: "Ajustes" } },
  { id: "plan", label: { en: "Plan", ja: "プラン", es: "Plan" } },
] as const;

const COPY = {
  en: {
    back: "Back",
    eyebrow: "WhisperType Plus",
    title: "Transcribe as much as you need.",
    subtitle: "A simple monthly plan for heavy daily use.",
    price: "¥300 / month",
    cta: "Subscribe with Microsoft Store",
    pending: "Processing...",
    refresh: "Refresh license",
    active: "Plus is active",
    inactive: "Plus is not active",
    storeNote: "Payment and cancellation are handled by Microsoft Store.",
    privacyNote: "WhisperType does not store card information.",
    unavailable: "Purchases are available in the Microsoft Store build.",
    notConfigured: "Microsoft Store subscription is not connected yet.",
    incomplete: "Purchase was not completed.",
    failed: "Purchase failed. Please try again.",
    email: "Signed in as",
    benefits: [
      "Unlimited transcription billing",
      "Built for heavy daily use",
      "Cancel anytime from your Microsoft account",
    ],
  },
  ja: {
    back: "戻る",
    eyebrow: "WhisperType Plus",
    title: "毎日の文字起こしを、もっと自由に。",
    subtitle: "よく使う人向けの月額プランです。",
    price: "¥300 / 月",
    cta: "Microsoft Store で登録",
    pending: "処理中...",
    refresh: "ライセンスを更新",
    active: "Plus が有効です",
    inactive: "Plus は未確認です",
    storeNote: "決済と解約は Microsoft Store で管理されます。",
    privacyNote: "WhisperType がカード情報を保存することはありません。",
    unavailable: "購入は Microsoft Store 版のアプリで利用できます。",
    notConfigured: "Microsoft Store のサブスクリプションは未接続です。",
    incomplete: "購入は完了していません。",
    failed: "購入に失敗しました。もう一度お試しください。",
    email: "ログイン中",
    benefits: [
      "文字起こしの課金上限なし",
      "毎日たっぷり使えます",
      "Microsoft アカウントからいつでも解約",
    ],
  },
  es: {
    back: "Volver",
    eyebrow: "WhisperType Plus",
    title: "Transcribe todo lo que necesites.",
    subtitle: "Un plan mensual simple para uso diario intensivo.",
    price: "¥300 / mes",
    cta: "Suscribirse con Microsoft Store",
    pending: "Procesando...",
    refresh: "Actualizar licencia",
    active: "Plus activo",
    inactive: "Plus no activo",
    storeNote: "Microsoft Store gestiona el pago y la cancelación.",
    privacyNote: "WhisperType no guarda datos de tarjeta.",
    unavailable: "Las compras están disponibles en la versión de Microsoft Store.",
    notConfigured: "La suscripción de Microsoft Store todavía no está conectada.",
    incomplete: "La compra no se completó.",
    failed: "No se pudo completar la compra. Inténtalo de nuevo.",
    email: "Sesión iniciada como",
    benefits: [
      "Transcripción ilimitada para facturación",
      "Diseñado para uso diario intensivo",
      "Cancela cuando quieras desde tu cuenta Microsoft",
    ],
  },
} as const;

export default function PlanCheckoutPage({ appLocale }: { appLocale: AppLocale }) {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
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
    if (!billingStatus) return "";
    if (!billingStatus.isStoreBuild) return copy.unavailable;
    if (!billingStatus.isProductConfigured) return copy.notConfigured;
    return "";
  }, [billingStatus, copy.notConfigured, copy.unavailable]);

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
        setPurchaseError(copy.incomplete);
        return;
      }

      await loadBillingStatus();
      await refreshProfile();
      navigate("/plan");
    } catch (error) {
      const code = getStorePurchaseErrorMessage(error);
      setPurchaseError(
        code === "store_product_not_configured"
          ? copy.notConfigured
          : code === "store_build_required"
            ? copy.unavailable
            : copy.failed
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
      <div className="mx-auto max-w-[1100px] space-y-5">
        <Button type="button" variant="ghost" className="w-fit rounded-full px-3" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4" />
          {copy.back}
        </Button>

        <Card className="overflow-hidden rounded-[34px] border border-white/50 bg-white py-0 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#101116]">
          <CardContent className="grid gap-0 p-0 lg:grid-cols-[0.92fr_1.08fr]">
            <section className="relative min-h-[500px] overflow-hidden bg-[radial-gradient(circle_at_18%_12%,rgba(14,165,233,0.18),transparent_34%),radial-gradient(circle_at_80%_88%,rgba(110,231,183,0.24),transparent_34%),linear-gradient(135deg,#f8fafc_0%,#eef6f4_100%)] p-8 dark:bg-[radial-gradient(circle_at_18%_12%,rgba(125,211,252,0.12),transparent_34%),linear-gradient(135deg,#111318_0%,#171a20_100%)] lg:p-9">
              <div className="absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-emerald-200/45 blur-3xl dark:bg-cyan-400/10" />
              <div className="relative flex h-full flex-col justify-between">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/8 dark:text-slate-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    {copy.eyebrow}
                  </div>

                  <div className="max-w-[460px] space-y-4">
                    <h1 className="text-[2.45rem] font-semibold leading-[1.14] tracking-tight text-slate-950 dark:text-white">
                      {copy.title}
                    </h1>
                    <p className="text-base leading-7 text-slate-600 dark:text-slate-300">{copy.subtitle}</p>
                  </div>

                  <div className="space-y-3">
                    {copy.benefits.map((benefit) => (
                      <div key={benefit} className="flex items-center gap-3 text-sm font-medium text-slate-800 dark:text-slate-100">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                          <ShieldCheck className="h-3.5 w-3.5" />
                        </span>
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative mt-9 rounded-[26px] border border-white/70 bg-white/72 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-black/20">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">WhisperType Plus</p>
                      <p className="mt-2 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">{copy.price}</p>
                    </div>
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">
                      Plus
                    </span>
                  </div>
                  {profile?.email ? (
                    <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                      {copy.email}: <span className="font-medium text-slate-800 dark:text-slate-200">{profile.email}</span>
                    </p>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="flex flex-col justify-center border-t border-black/6 bg-white p-7 dark:border-white/8 dark:bg-[#101116] lg:border-l lg:border-t-0 lg:p-9">
              <div className="rounded-[30px] border border-black/8 bg-white/82 p-6 shadow-[0_18px_52px_rgba(15,23,42,0.06)] dark:border-white/8 dark:bg-white/5">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      <Store className="h-4 w-4 text-slate-500" />
                      Microsoft Store
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{copy.storeNote}</p>
                  </div>
                  <div className="shrink-0 rounded-2xl bg-slate-50 px-4 py-3 text-right dark:bg-white/8">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Plus</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">{copy.price}</p>
                  </div>
                </div>

                <div className="mt-6 rounded-[24px] border border-black/6 bg-slate-50/82 p-4 dark:border-white/8 dark:bg-black/18">
                  <Button
                    type="button"
                    disabled={isPurchasing || !canPurchase}
                    onClick={handleStorePurchase}
                    className="h-12 w-full rounded-2xl bg-slate-950 text-base font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.20)] hover:bg-slate-800 disabled:bg-slate-400 disabled:text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 dark:disabled:bg-white/30 dark:disabled:text-white/70"
                  >
                    {isPurchasing ? copy.pending : copy.cta}
                  </Button>

                  {purchaseError ? <p className="mt-3 text-xs text-rose-600 dark:text-rose-300">{purchaseError}</p> : null}
                  {!purchaseError && purchaseHint ? <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{purchaseHint}</p> : null}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-black/6 pt-4 dark:border-white/8">
                  <span
                    className={`text-sm font-medium ${
                      billingStatus?.hasLicense
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {billingStatus?.hasLicense ? copy.active : copy.inactive}
                  </span>
                  <Button type="button" variant="outline" size="sm" onClick={() => void refreshLicense()} disabled={isRefreshingLicense}>
                    <RefreshCw className={`h-4 w-4 ${isRefreshingLicense ? "animate-spin" : ""}`} />
                    {copy.refresh}
                  </Button>
                </div>

                <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">{copy.privacyNote}</p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
