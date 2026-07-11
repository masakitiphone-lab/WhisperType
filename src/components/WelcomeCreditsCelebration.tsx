import { useEffect } from "react";
import { CheckCircle2, Keyboard } from "lucide-react";
import type { AppLocale } from "@/lib/appLocale";
import { Button } from "@/components/ui/button";

type Props = {
  appLocale: AppLocale;
  credits: number | null;
  onClose: () => void;
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

type Copy = {
  title: string;
  description: string;
  badge: string;
  shortcutLabel: string;
  shortcutHint: string;
  close: string;
};

const CONFETTI_PIECES: ConfettiPiece[] = [
  { left: "50%", top: "34%", tx: "-40vw", ty: "-12vh", delay: "0ms", color: "#f59e0b", rotate: "-240deg", shape: "bar" },
  { left: "50%", top: "34%", tx: "-32vw", ty: "8vh", delay: "40ms", color: "#fb7185", rotate: "220deg", shape: "dot" },
  { left: "50%", top: "34%", tx: "-22vw", ty: "26vh", delay: "20ms", color: "#60a5fa", rotate: "-200deg", shape: "bar" },
  { left: "50%", top: "34%", tx: "-10vw", ty: "40vh", delay: "90ms", color: "#34d399", rotate: "260deg", shape: "bar" },
  { left: "50%", top: "34%", tx: "8vw", ty: "42vh", delay: "60ms", color: "#a78bfa", rotate: "-280deg", shape: "dot" },
  { left: "50%", top: "34%", tx: "22vw", ty: "28vh", delay: "110ms", color: "#f97316", rotate: "210deg", shape: "bar" },
  { left: "50%", top: "34%", tx: "34vw", ty: "10vh", delay: "80ms", color: "#22c55e", rotate: "-180deg", shape: "dot" },
  { left: "50%", top: "34%", tx: "42vw", ty: "-10vh", delay: "140ms", color: "#38bdf8", rotate: "220deg", shape: "bar" },
];

function getCopy(locale: AppLocale, credits: number): Copy {
  if (locale === "ja") {
    return {
      title: "ウェルカムクレジットを追加しました",
      description: `はじめてのセットアップ完了にあわせて ${credits} クレジットを付与しました。`,
      badge: `+${credits} クレジット`,
      shortcutLabel: "Ctrl + Alt",
      shortcutHint: "Ctrl と Alt を押して、音声入力を開始できます。",
      close: "はじめる",
    };
  }

  if (locale === "es") {
    return {
      title: "Se agregaron creditos de bienvenida",
      description: `Hemos agregado ${credits} creditos para que empieces de inmediato.`,
      badge: `+${credits} creditos`,
      shortcutLabel: "Ctrl + Alt",
      shortcutHint: "Pulsa Ctrl y Alt para empezar a dictar.",
      close: "Empezar",
    };
  }

  return {
    title: "Welcome credits added",
    description: `${credits} credits were added so you can start right away.`,
    badge: `+${credits} credits`,
    shortcutLabel: "Ctrl + Alt",
    shortcutHint: "Press Ctrl and Alt to start dictation.",
    close: "Get started",
  };
}

export function WelcomeCreditsCelebration({ appLocale, credits, onClose }: Props) {
  useEffect(() => {
    if (credits === null) return;
    const timeoutId = window.setTimeout(onClose, 3200);
    return () => window.clearTimeout(timeoutId);
  }, [credits, onClose]);

  if (credits === null) return null;

  const copy = getCopy(appLocale, credits);

  return (
    <>
      <style>{`
        @keyframes welcome-screen-confetti { 0% { transform: translate3d(0,0,0) rotate(0deg) scale(0.72); opacity: 0; } 8% { opacity: 1; } 100% { transform: translate3d(var(--tx), var(--ty), 0) rotate(var(--rot)) scale(1); opacity: 0; } }
        @keyframes welcome-popup-in { 0% { transform: translateY(10px) scale(0.96); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
        @keyframes welcome-credit-badge { 0% { transform: translateY(8px) scale(0.96); opacity: 0; } 20% { transform: translateY(0) scale(1); opacity: 1; } 80% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-10px) scale(0.98); opacity: 0; } }
      `}</style>
      <div className="pointer-events-none fixed inset-0 z-[85] overflow-hidden">
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
              animation: `welcome-screen-confetti 980ms cubic-bezier(0.18,0.72,0.2,1) ${piece.delay} forwards`,
              ["--tx" as string]: piece.tx,
              ["--ty" as string]: piece.ty,
              ["--rot" as string]: piece.rotate,
            }}
          />
        ))}
      </div>
      <div className="fixed inset-0 z-[86] flex items-center justify-center bg-black/18 px-4 backdrop-blur-[2px]">
        <div
          className="w-full max-w-md rounded-[28px] border border-black/8 bg-white/96 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[#121316]/96"
          style={{ animation: "welcome-popup-in 180ms ease-out forwards" }}
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="inline-flex rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200" style={{ animation: "welcome-credit-badge 1350ms ease-out forwards" }}>
            {copy.badge}
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-slate-50">{copy.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{copy.description}</p>
          <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-center dark:border-white/10 dark:bg-white/5">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm dark:bg-white/10 dark:text-slate-100">
              <Keyboard className="h-5 w-5" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Shortcut</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">{copy.shortcutLabel}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{copy.shortcutHint}</p>
          </div>
          <div className="mt-6 flex justify-end">
            <Button type="button" onClick={onClose} className="rounded-2xl bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90">
              {copy.close}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
