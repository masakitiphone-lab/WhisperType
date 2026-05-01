import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, XCircle, Loader2, ArrowRight, X } from "lucide-react";
import { desktopAuthRedirectUrl } from "@/lib/auth";
import { readAppLocale, type AppLocale } from "@/lib/appLocale";

type CallbackState = "redirecting" | "complete" | "error";

type CallbackCopy = {
  eyebrow: string;
  title: string;
  description: string;
  closeHint: string;
  retryLabel: string;
  errorTitle: string;
  errorDescription: string;
  step1: string;
  step2: string;
  step3: string;
};

function getCallbackCopy(locale: AppLocale): CallbackCopy {
  if (locale === "ja") {
    return {
      eyebrow: "AUTHENTICATION",
      title: "ログインが完了しました",
      description: "WhisperType に戻っています。このままアプリをご利用ください。",
      closeHint: "このタブは自動で閉じます。閉じない場合は手動で閉じてください。",
      retryLabel: "アプリに戻る",
      errorTitle: "ログインを完了できませんでした",
      errorDescription: "アプリからもう一度ログインをお試しください。",
      step1: "認証成功",
      step2: "アプリに接続中",
      step3: "完了",
    };
  }

  if (locale === "es") {
    return {
      eyebrow: "AUTHENTICATION",
      title: "Inicio de sesion completado",
      description: "WhisperType esta volviendo a la app. Continua alli.",
      closeHint: "Esta pestana se cerrara automaticamente.",
      retryLabel: "Volver a la app",
      errorTitle: "No se pudo completar el inicio de sesion",
      errorDescription: "Vuelve a intentarlo desde la app.",
      step1: "Autenticado",
      step2: "Conectando a la app",
      step3: "Listo",
    };
  }

  return {
    eyebrow: "AUTHENTICATION",
    title: "Authentication complete",
    description: "WhisperType is returning you to the app. Continue there.",
    closeHint: "This tab will close automatically.",
    retryLabel: "Return to the app",
    errorTitle: "Authentication could not be completed",
    errorDescription: "Please try signing in again from the app.",
    step1: "Authenticated",
    step2: "Connecting to app",
    step3: "Complete",
  };
}

const stepVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15 + 0.3, duration: 0.4, ease: "easeOut" },
  }),
};

export default function AuthCallback() {
  const [state, setState] = useState<CallbackState>("redirecting");
  const [locale] = useState<AppLocale>(() => readAppLocale());
  const copy = getCallbackCopy(locale);
  const search = typeof window !== "undefined" ? window.location.search : "";
  const desktopCallbackUrl = `${desktopAuthRedirectUrl}${search || ""}`;

  useEffect(() => {
    const params = new URLSearchParams(search);
    const hasCode = params.has("code");
    const hasError = params.has("error") || params.has("error_description");

    if (!hasCode && !hasError) {
      setState("error");
      return;
    }

    // 1. まずアプリにディープリンクで戻る
    try {
      window.location.href = desktopCallbackUrl;
    } catch {
      // ignore
    }

    // 2. 少し待ってからタブを自動で閉じようと試みる
    window.setTimeout(() => {
      try {
        window.close();
      } catch {
        // ブラウザがブロックした場合は無視
      }
      // 3. 閉じられなかったら完了画面を表示する
      setState(hasError ? "error" : "complete");
    }, 900);
  }, [desktopCallbackUrl, search]);

  const isError = state === "error";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0f1117] px-6 py-8 text-slate-100">
      {/* 背景の装飾 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/4 h-[800px] w-[800px] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute -right-1/4 -bottom-1/2 h-[600px] w-[600px] rounded-full bg-emerald-500/8 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* カード */}
        <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] shadow-2xl backdrop-blur-xl">
          {/* ヘッダー部分 */}
          <div className="relative flex flex-col items-center px-8 pt-10 pb-8">
            {/* アイコン */}
            <AnimatePresence mode="wait">
              {isError ? (
                <motion.div
                  key="error"
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15"
                >
                  <XCircle className="h-8 w-8 text-red-400" />
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15"
                >
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400"
            >
              {copy.eyebrow}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-3 text-2xl font-semibold tracking-tight"
            >
              {isError ? copy.errorTitle : copy.title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-2 text-center text-sm leading-relaxed text-slate-400"
            >
              {isError ? copy.errorDescription : copy.description}
            </motion.p>
          </div>

          {/* ステップ表示 */}
          <div className="space-y-3 px-8 pb-8">
            {[copy.step1, copy.step2, copy.step3].map((label, i) => {
              const isActive = !isError && (i === 0 || i === 1 || i === 2);
              const isCurrent = !isError && i === 1 && state === "redirecting";
              const isDone = !isError && i === 0;
              const isLast = i === 2;

              return (
                <motion.div
                  key={label}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={stepVariants}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-colors ${
                    isError
                      ? "border-white/[0.05] bg-white/[0.02] opacity-40"
                      : isDone
                        ? "border-emerald-500/20 bg-emerald-500/[0.06]"
                        : isCurrent
                          ? "border-indigo-500/20 bg-indigo-500/[0.06]"
                          : "border-white/[0.05] bg-white/[0.02]"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isError
                        ? "bg-white/[0.05] text-slate-500"
                        : isDone
                          ? "bg-emerald-500/20 text-emerald-400"
                          : isCurrent
                            ? "bg-indigo-500/20 text-indigo-400"
                            : "bg-white/[0.05] text-slate-400"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : isCurrent && state === "redirecting" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      isLast && state === "complete" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        i + 1
                      )
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isError
                        ? "text-slate-500"
                        : isDone || isCurrent
                          ? "text-slate-200"
                          : "text-slate-400"
                    }`}
                  >
                    {label}
                  </span>
                  {isCurrent && !isError && (
                    <motion.div
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="ml-auto"
                    >
                      <ArrowRight className="h-4 w-4 text-indigo-400" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}

            {/* ボタン or ヒント */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="pt-2"
            >
              {isError ? (
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = desktopCallbackUrl;
                  }}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white/[0.08] px-5 text-sm font-medium text-white transition hover:bg-white/[0.12]"
                >
                  <ArrowRight className="h-4 w-4" />
                  {copy.retryLabel}
                </button>
              ) : (
                <p className="text-center text-xs leading-relaxed text-slate-500">
                  {copy.closeHint}
                </p>
              )}
            </motion.div>
          </div>
        </div>

        {/* フッターロゴ */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-center text-xs font-medium tracking-wide text-slate-600"
        >
          WhisperType
        </motion.p>
      </motion.div>
    </div>
  );
}
