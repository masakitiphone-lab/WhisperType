import { useEffect, useState } from "react";
import { Check, CheckCircle2, CreditCard, Sparkles, Ticket, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AppLocale } from "@/lib/appLocale";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/useAuth";

type PlanKey = "free" | "plus";
type PromoResultKind = "success" | "error";
type PromoRpcRow = {
  status: string;
  message: string;
  reward_credits: number | null;
  remaining_credits: number | null;
};

type PlanCopy = {
  eyebrow: string;
  title: string;
  description: string;
  currentPlan: string;
  choosePlan: string;
  checkout: string;
  soon: string;
  summaryTitle: string;
  summaryDescription: string;
  method: string;
  billing: string;
  plan: string;
  placeholderMethod: string;
  placeholderBilling: string;
  placeholderCheckout: string;
  freeTitle: string;
  freePrice: string;
  freeDescription: string;
  plusTitle: string;
  plusPrice: string;
  plusDescription: string;
  perMonth: string;
  featuresTitle: string;
  freeFeatures: string[];
  plusFeatures: string[];
  promoTitle: string;
  promoPlaceholder: string;
  promoButton: string;
  promoNote: string;
  promoRedeeming: string;
  promoSignInRequired: string;
  promoInvalidCode: string;
  promoInactiveCode: string;
  promoExpiredCode: string;
  promoAlreadyRedeemed: string;
  promoFullyRedeemed: string;
  promoSuccessTitle: string;
  promoFallbackError: string;
  promoSuccessMessage: (credits: number, remaining: number | null) => string;
  promoCelebrationLabel: (credits: number) => string;
  popupClose: string;
};

type ConfettiPiece = {
  left: string;
  top: string;
  tx: string;
  ty: string;
  delay: string;
  color: string;
  rotate: string;
  shape: "bar" | "dot";
};

const CONFETTI_PIECES: ConfettiPiece[] = [
  { left: "50%", top: "34%", tx: "-44vw", ty: "-14vh", delay: "0ms", color: "#f59e0b", rotate: "-240deg", shape: "bar" },
  { left: "50%", top: "34%", tx: "-38vw", ty: "6vh", delay: "40ms", color: "#fb7185", rotate: "220deg", shape: "dot" },
  { left: "50%", top: "34%", tx: "-32vw", ty: "18vh", delay: "20ms", color: "#60a5fa", rotate: "-200deg", shape: "bar" },
  { left: "50%", top: "34%", tx: "-26vw", ty: "28vh", delay: "90ms", color: "#34d399", rotate: "260deg", shape: "bar" },
  { left: "50%", top: "34%", tx: "-20vw", ty: "42vh", delay: "60ms", color: "#a78bfa", rotate: "-280deg", shape: "dot" },
  { left: "50%", top: "34%", tx: "-10vw", ty: "48vh", delay: "120ms", color: "#f97316", rotate: "210deg", shape: "bar" },
  { left: "50%", top: "34%", tx: "0vw", ty: "52vh", delay: "80ms", color: "#22c55e", rotate: "-180deg", shape: "dot" },
  { left: "50%", top: "34%", tx: "10vw", ty: "48vh", delay: "140ms", color: "#eab308", rotate: "260deg", shape: "bar" },
  { left: "50%", top: "34%", tx: "20vw", ty: "42vh", delay: "100ms", color: "#06b6d4", rotate: "-220deg", shape: "bar" },
  { left: "50%", top: "34%", tx: "28vw", ty: "28vh", delay: "30ms", color: "#f43f5e", rotate: "240deg", shape: "dot" },
  { left: "50%", top: "34%", tx: "34vw", ty: "16vh", delay: "110ms", color: "#8b5cf6", rotate: "-260deg", shape: "bar" },
  { left: "50%", top: "34%", tx: "42vw", ty: "-10vh", delay: "70ms", color: "#38bdf8", rotate: "220deg", shape: "bar" },
  { left: "50%", top: "34%", tx: "-48vw", ty: "12vh", delay: "150ms", color: "#fb7185", rotate: "-320deg", shape: "dot" },
  { left: "50%", top: "34%", tx: "-36vw", ty: "36vh", delay: "180ms", color: "#f59e0b", rotate: "280deg", shape: "bar" },
  { left: "50%", top: "34%", tx: "36vw", ty: "36vh", delay: "160ms", color: "#22c55e", rotate: "-300deg", shape: "bar" },
  { left: "50%", top: "34%", tx: "48vw", ty: "10vh", delay: "130ms", color: "#60a5fa", rotate: "320deg", shape: "dot" },
  { left: "50%", top: "34%", tx: "-14vw", ty: "-18vh", delay: "50ms", color: "#f97316", rotate: "-210deg", shape: "bar" },
  { left: "50%", top: "34%", tx: "14vw", ty: "-18vh", delay: "95ms", color: "#a78bfa", rotate: "190deg", shape: "bar" },
];

const COPY: Record<AppLocale, PlanCopy> = {
  en: {
    eyebrow: "Plans",
    title: "Choose the plan that fits your workflow",
    description: "Compare plans, review billing, and get ready for Stripe checkout from one place.",
    currentPlan: "Current plan",
    choosePlan: "Choose plan",
    checkout: "Checkout",
    soon: "Coming soon",
    summaryTitle: "Checkout preview",
    summaryDescription: "Stripe billing is not live yet. This screen is prepared for plan selection and the upcoming subscription flow.",
    method: "Payment method",
    billing: "Billing cycle",
    plan: "Selected plan",
    placeholderMethod: "Stripe / Card / Apple Pay / Google Pay",
    placeholderBilling: "Monthly",
    placeholderCheckout: "Stripe checkout will appear here once subscriptions are enabled.",
    freeTitle: "Free",
    freePrice: "$0",
    freeDescription: "Includes 300 monthly credits for everyday transcription.",
    plusTitle: "WhisperType Plus",
    plusPrice: "$3",
    plusDescription: "Unlimited transcription for users who rely on voice input every day.",
    perMonth: "/ month",
    featuresTitle: "Included",
    freeFeatures: ["300 credits each month", "Standard transcription", "Recent history"],
    plusFeatures: ["Unlimited credits", "Unlimited transcription", "Prepared for Stripe subscription billing"],
    promoTitle: "Promotion code",
    promoPlaceholder: "Enter a code",
    promoButton: "Claim credits",
    promoNote: "Enter a case-sensitive code to add credits to your account.",
    promoRedeeming: "Applying...",
    promoSignInRequired: "You need to sign in before using a promotion code.",
    promoInvalidCode: "This code is not valid. Please check it and try again.",
    promoInactiveCode: "This code is not available right now.",
    promoExpiredCode: "This code has expired.",
    promoAlreadyRedeemed: "A promotion code has already been claimed on this account.",
    promoFullyRedeemed: "This code is no longer available.",
    promoSuccessTitle: "Credits added",
    promoFallbackError: "The code could not be applied. Please try again in a moment.",
    promoSuccessMessage: (credits, remaining) => remaining === null ? `${credits} credits were added to your account.` : `${credits} credits were added. Your current balance is ${remaining}.`,
    promoCelebrationLabel: (credits) => `+${credits} credits`,
    popupClose: "Close",
  },
  ja: {
    eyebrow: "プラン",
    title: "使い方に合ったプランを選択",
    description: "プランの違い、請求イメージ、今後の Stripe 決済導線をひとつの画面で確認できます。",
    currentPlan: "現在のプラン",
    choosePlan: "このプランを選択",
    checkout: "チェックアウト",
    soon: "近日公開",
    summaryTitle: "決済プレビュー",
    summaryDescription: "Stripe 決済はまだ公開していません。この画面ではプラン選択と今後の購読フローを確認できます。",
    method: "支払い方法",
    billing: "請求サイクル",
    plan: "選択中のプラン",
    placeholderMethod: "Stripe / Card / Apple Pay / Google Pay",
    placeholderBilling: "月額",
    placeholderCheckout: "Stripe の決済が有効になると、ここにチェックアウトが表示されます。",
    freeTitle: "フリー",
    freePrice: "¥0",
    freeDescription: "毎月 300 クレジットまで使える、日常利用向けのプランです。",
    plusTitle: "WhisperType Plus",
    plusPrice: "¥300",
    plusDescription: "音声入力を毎日使う方向けの、文字起こし無制限プランです。",
    perMonth: "/ 月",
    featuresTitle: "含まれる内容",
    freeFeatures: ["毎月 300 クレジット", "標準文字起こし", "最近の履歴"],
    plusFeatures: ["無制限クレジット", "文字起こし無制限", "Stripe 定期課金に対応予定"],
    promoTitle: "プロモーションコード",
    promoPlaceholder: "コードを入力",
    promoButton: "クレジットを受け取る",
    promoNote: "大文字と小文字を区別します。受け取ったコードをそのまま入力してください。",
    promoRedeeming: "適用中...",
    promoSignInRequired: "プロモーションコードを使うにはログインが必要です。",
    promoInvalidCode: "このコードは有効ではありません。内容を確認してもう一度お試しください。",
    promoInactiveCode: "このコードは現在利用できません。",
    promoExpiredCode: "このコードの有効期限は終了しています。",
    promoAlreadyRedeemed: "このアカウントではすでにプロモーションコードを受け取っています。",
    promoFullyRedeemed: "このコードはすでに配布終了しています。",
    promoSuccessTitle: "クレジットを追加しました",
    promoFallbackError: "コードを適用できませんでした。少し時間をおいてもう一度お試しください。",
    promoSuccessMessage: (credits, remaining) =>
      remaining === null
        ? `${credits} クレジットを追加しました。`
        : `${credits} クレジットを追加しました。現在の残高は ${remaining} です。`,
    promoCelebrationLabel: (credits) => `+${credits} クレジット`,
    popupClose: "閉じる",
  },
  es: {
    eyebrow: "Planes",
    title: "Elige el plan que mejor encaja con tu flujo de trabajo",
    description: "Compara planes, revisa la facturacion y preparate para el futuro checkout con Stripe.",
    currentPlan: "Plan actual",
    choosePlan: "Elegir plan",
    checkout: "Checkout",
    soon: "Proximamente",
    summaryTitle: "Vista previa del checkout",
    summaryDescription: "La facturacion con Stripe aun no esta activa. Esta pantalla prepara la seleccion del plan y el flujo futuro de suscripcion.",
    method: "Metodo de pago",
    billing: "Ciclo de cobro",
    plan: "Plan seleccionado",
    placeholderMethod: "Stripe / Card / Apple Pay / Google Pay",
    placeholderBilling: "Mensual",
    placeholderCheckout: "El checkout de Stripe aparecera aqui cuando las suscripciones esten disponibles.",
    freeTitle: "Free",
    freePrice: "$0",
    freeDescription: "Incluye 300 creditos mensuales para la transcripcion del dia a dia.",
    plusTitle: "WhisperType Plus",
    plusPrice: "$3",
    plusDescription: "Transcripcion ilimitada para quienes usan la voz cada dia.",
    perMonth: "/ mes",
    featuresTitle: "Incluye",
    freeFeatures: ["300 creditos al mes", "Transcripcion estandar", "Historial reciente"],
    plusFeatures: ["Creditos ilimitados", "Transcripcion ilimitada", "Preparado para suscripciones con Stripe"],
    promoTitle: "Codigo promocional",
    promoPlaceholder: "Introduce un codigo",
    promoButton: "Canjear creditos",
    promoNote: "Introduce el codigo exactamente como lo recibiste.",
    promoRedeeming: "Canjeando...",
    promoSignInRequired: "Debes iniciar sesion para usar un codigo.",
    promoInvalidCode: "Este codigo no es valido. Revisa el contenido e intentalo de nuevo.",
    promoInactiveCode: "Este codigo no esta disponible ahora mismo.",
    promoExpiredCode: "Este codigo ha caducado.",
    promoAlreadyRedeemed: "Esta cuenta ya reclamo un codigo promocional.",
    promoFullyRedeemed: "Este codigo ya no esta disponible.",
    promoSuccessTitle: "Creditos agregados",
    promoFallbackError: "No se pudo aplicar el codigo. Intentalo de nuevo en un momento.",
    promoSuccessMessage: (credits, remaining) => remaining === null ? `Se agregaron ${credits} creditos.` : `Se agregaron ${credits} creditos. Tu saldo actual es ${remaining}.`,
    promoCelebrationLabel: (credits) => `+${credits} créditos`,
    popupClose: "Cerrar",
  },
};

function mapPromoStatus(copy: PlanCopy, row: PromoRpcRow) {
  switch (row.status) {
    case "redeemed": return { kind: "success" as const, title: copy.promoSuccessTitle, message: copy.promoSuccessMessage(row.reward_credits ?? 0, row.remaining_credits) };
    case "auth_required": return { kind: "error" as const, title: copy.promoSignInRequired, message: copy.promoSignInRequired };
    case "invalid_code": return { kind: "error" as const, title: copy.promoInvalidCode, message: copy.promoInvalidCode };
    case "inactive_code": return { kind: "error" as const, title: copy.promoInactiveCode, message: copy.promoInactiveCode };
    case "expired_code": return { kind: "error" as const, title: copy.promoExpiredCode, message: copy.promoExpiredCode };
    case "already_redeemed": return { kind: "error" as const, title: copy.promoAlreadyRedeemed, message: copy.promoAlreadyRedeemed };
    case "fully_redeemed": return { kind: "error" as const, title: copy.promoFullyRedeemed, message: copy.promoFullyRedeemed };
    default: return { kind: "error" as const, title: copy.promoFallbackError, message: copy.promoFallbackError };
  }
}

export default function PlanPage({ appLocale }: { appLocale: AppLocale }) {
  const { user, refreshProfile } = useAuth();
  const copy = COPY[appLocale];
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("plus");
  const [promoCode, setPromoCode] = useState("");
  const [isRedeemingPromo, setIsRedeemingPromo] = useState(false);
  const [promoResult, setPromoResult] = useState<{ kind: PromoResultKind; title: string; message: string } | null>(null);
  const [celebrationCredits, setCelebrationCredits] = useState<number | null>(null);

  useEffect(() => {
    if (celebrationCredits === null) return;
    const timeoutId = window.setTimeout(() => setCelebrationCredits(null), 1600);
    return () => window.clearTimeout(timeoutId);
  }, [celebrationCredits]);

  const planMeta = {
    free: { title: copy.freeTitle, price: copy.freePrice, description: copy.freeDescription, features: copy.freeFeatures },
    plus: { title: copy.plusTitle, price: copy.plusPrice, description: copy.plusDescription, features: copy.plusFeatures },
  } as const;

  const handleRedeemPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoResult({ kind: "error", title: copy.promoInvalidCode, message: copy.promoInvalidCode });
      return;
    }
    if (!user) {
      setPromoResult({ kind: "error", title: copy.promoSignInRequired, message: copy.promoSignInRequired });
      return;
    }

    setIsRedeemingPromo(true);
    setPromoResult(null);

    try {
      const { data, error } = await supabase.rpc("redeem_promo_code", { input_code: promoCode });
      if (error) throw error;
      const row = (Array.isArray(data) ? data[0] : data) as PromoRpcRow | null;
      if (!row) throw new Error("Promo RPC returned no data");
      const nextResult = mapPromoStatus(copy, row);
      setPromoResult(nextResult);
      if (row.status === "redeemed") {
        setPromoCode("");
        setCelebrationCredits(row.reward_credits ?? 0);
        await refreshProfile();
      }
    } catch (error) {
      setPromoResult({ kind: "error", title: copy.promoFallbackError, message: copy.promoFallbackError });
    } finally {
      setIsRedeemingPromo(false);
    }
  };

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes promo-card-glow { 0% { box-shadow: 0 0 0 rgba(16,185,129,0); } 35% { box-shadow: 0 0 0 1px rgba(16,185,129,0.16), 0 14px 30px rgba(16,185,129,0.12), 0 0 64px rgba(110,231,183,0.14); } 100% { box-shadow: 0 0 0 rgba(16,185,129,0); } }
        @keyframes promo-screen-confetti { 0% { transform: translate3d(0,0,0) rotate(0deg) scale(0.72); opacity: 0; } 8% { opacity: 1; } 100% { transform: translate3d(var(--tx), var(--ty), 0) rotate(var(--rot)) scale(1); opacity: 0; } }
        @keyframes promo-credit-badge { 0% { transform: translateY(8px) scale(0.96); opacity: 0; } 20% { transform: translateY(0) scale(1); opacity: 1; } 80% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-10px) scale(0.98); opacity: 0; } }
        @keyframes promo-popup-in { 0% { transform: translateY(10px) scale(0.96); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
      `}</style>

      {celebrationCredits !== null ? (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {CONFETTI_PIECES.map((piece) => (
            <span
              key={`${piece.color}-${piece.tx}-${piece.ty}`}
              className="absolute block rounded-full"
              style={{
                left: piece.left,
                top: piece.top,
                width: piece.shape === "dot" ? "9px" : "6px",
                height: piece.shape === "dot" ? "9px" : "16px",
                backgroundColor: piece.color,
                boxShadow: `0 0 10px ${piece.color}35`,
                animation: `promo-screen-confetti 1000ms cubic-bezier(0.18,0.72,0.2,1) ${piece.delay} forwards`,
                ['--tx' as string]: piece.tx,
                ['--ty' as string]: piece.ty,
                ['--rot' as string]: piece.rotate,
              }}
            />
          ))}
        </div>
      ) : null}

      {promoResult ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/26 px-4 backdrop-blur-[3px]">
          <div className="w-full max-w-md rounded-[28px] border border-black/8 bg-white/96 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[#121316]/96" style={{ animation: 'promo-popup-in 180ms ease-out forwards' }}>
            <div className={["mb-4 flex h-12 w-12 items-center justify-center rounded-2xl", promoResult.kind === "success" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"].join(' ')}>
              {promoResult.kind === "success" ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
            </div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{promoResult.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{promoResult.message}</p>
            {promoResult.kind === "success" && celebrationCredits !== null ? (
              <div className="mt-4 inline-flex rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">{copy.promoCelebrationLabel(celebrationCredits)}</div>
            ) : null}
            <div className="mt-6 flex justify-end">
              <Button type="button" onClick={() => setPromoResult(null)} className="rounded-2xl bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90">{copy.popupClose}</Button>
            </div>
          </div>
        </div>
      ) : null}

      <Card className="rounded-[24px] border-black/8 bg-white/88 shadow-sm dark:border-white/8 dark:bg-[#141518]">
        <CardHeader className="pb-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-black/8 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 dark:border-white/10 dark:bg-[#101114] dark:text-slate-200"><Sparkles className="h-3.5 w-3.5" />{copy.eyebrow}</div>
          <CardTitle className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">{copy.title}</CardTitle>
          <CardDescription className="max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{copy.description}</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4 md:grid-cols-2">
          {(Object.keys(planMeta) as PlanKey[]).map((key) => {
            const plan = planMeta[key];
            const selected = selectedPlan === key;
            return (
              <Card key={key} className={["rounded-[24px] border shadow-sm transition-all", selected ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black" : "border-black/8 bg-white/88 dark:border-white/8 dark:bg-[#141518]"].join(" ")}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg font-semibold">{plan.title}</CardTitle>
                      <CardDescription className={selected ? "text-white/70 dark:text-black/70" : undefined}>{plan.description}</CardDescription>
                    </div>
                    {selected ? <span className="rounded-full border border-white/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] dark:border-black/10">{copy.currentPlan}</span> : null}
                  </div>
                  <div className="mt-4 flex items-end gap-2">
                    <span className="text-3xl font-semibold tracking-tight">{plan.price}</span>
                    <span className={selected ? "text-white/70 dark:text-black/70" : "text-slate-500 dark:text-slate-400"}>{copy.perMonth}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className={selected ? "text-xs font-semibold uppercase tracking-[0.18em] text-white/70 dark:text-black/70" : "text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500"}>{copy.featuresTitle}</p>
                    <ul className="space-y-2">
                      {plan.features.map((feature) => <li key={feature} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4" /><span>{feature}</span></li>)}
                    </ul>
                  </div>
                  <Button type="button" variant={selected ? "secondary" : "outline"} onClick={() => setSelectedPlan(key)} className={["w-full rounded-2xl", selected ? "border-white/20 bg-white text-black hover:bg-white/90 dark:border-black/10 dark:bg-black dark:text-white dark:hover:bg-black/90" : ""].join(" ")}>{selected ? copy.currentPlan : copy.choosePlan}</Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="rounded-[24px] border-black/8 bg-white/88 shadow-sm dark:border-white/8 dark:bg-[#141518]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-50"><CreditCard className="h-4 w-4" />{copy.summaryTitle}</CardTitle>
            <CardDescription>{copy.summaryDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 rounded-[20px] border border-black/6 bg-[#fcfcfb] p-4 dark:border-white/8 dark:bg-[#18191d]">
              <div className="flex items-center justify-between gap-3"><span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{copy.plan}</span><span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{planMeta[selectedPlan].title}</span></div>
              <div className="flex items-center justify-between gap-3"><span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{copy.billing}</span><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{copy.placeholderBilling}</span></div>
              <div className="flex items-center justify-between gap-3"><span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{copy.method}</span><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{copy.placeholderMethod}</span></div>
            </div>
            <div className="rounded-[20px] border border-dashed border-black/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(252,247,255,0.94))] px-4 py-4 text-sm leading-6 text-slate-500 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(24,25,29,0.98),rgba(28,20,36,0.96))] dark:text-slate-400">{copy.placeholderCheckout}</div>
            <Button type="button" disabled className="w-full rounded-2xl border border-black/10 bg-black text-white opacity-80 hover:bg-black dark:border-white/10 dark:bg-white dark:text-black">{copy.checkout} · {copy.soon}</Button>
          </CardContent>
        </Card>
      </div>

      <Card className="relative overflow-hidden rounded-[24px] border-black/8 bg-white/88 shadow-sm dark:border-white/8 dark:bg-[#141518]" style={celebrationCredits !== null ? { animation: "promo-card-glow 1250ms ease-out forwards" } : undefined}>
        {celebrationCredits !== null ? <><div className="pointer-events-none absolute inset-0 rounded-[24px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.92),rgba(255,255,255,0))] opacity-80" /><div className="pointer-events-none absolute right-4 top-4 z-10"><div className="rounded-full border border-emerald-200/80 bg-white/90 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-emerald-700 shadow-sm dark:border-emerald-400/30 dark:bg-[#11161a]/90 dark:text-emerald-200" style={{ animation: "promo-credit-badge 1350ms ease-out forwards" }}>{copy.promoCelebrationLabel(celebrationCredits)}</div></div></> : null}
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50"><Ticket className="h-4 w-4" />{copy.promoTitle}</CardTitle>
          <CardDescription>{copy.promoNote}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input value={promoCode} onChange={(event) => setPromoCode(event.target.value)} placeholder={copy.promoPlaceholder} className="h-11 rounded-2xl border border-black/8 bg-white/88 px-4 text-sm text-slate-800 shadow-sm outline-none transition-all duration-150 ease-out focus:border-black/20 focus:shadow-md dark:border-white/8 dark:bg-[#18191d] dark:text-slate-100 dark:focus:border-white/20" />
            <Button type="button" disabled={isRedeemingPromo || promoCode.length === 0} onClick={() => { void handleRedeemPromoCode(); }} className="h-11 rounded-2xl px-5">{isRedeemingPromo ? copy.promoRedeeming : copy.promoButton}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


