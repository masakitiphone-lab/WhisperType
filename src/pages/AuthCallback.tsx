import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, X, ExternalLink } from "lucide-react";
import { desktopAuthRedirectUrl } from "@/lib/auth";
import { readAppLocale, type AppLocale } from "@/lib/appLocale";

type CallbackState = "redirecting" | "complete" | "error";

type CallbackCopy = {
  eyebrow: string;
  title: string;
  description: string;
  closeHint: string;
  closeButton: string;
  retryLabel: string;
  errorTitle: string;
  errorDescription: string;
};

function getCallbackCopy(locale: AppLocale): CallbackCopy {
  if (locale === "ja") {
    return {
      eyebrow: "AUTHENTICATION",
      title: "ログインが完了しました",
      description: "WhisperType に戻りました。アプリをそのままご利用ください。",
      closeHint: "このタブはもう不要です。下のボタンで閉じるか、手動で閉じてください。",
      closeButton: "このタブを閉じる",
      retryLabel: "アプリに戻る",
      errorTitle: "ログインを完了できませんでした",
      errorDescription: "アプリからもう一度ログインをお試しください。",
    };
  }

  if (locale === "es") {
    return {
      eyebrow: "AUTHENTICATION",
      title: "Inicio de sesion completado",
      description: "WhisperType ha vuelto a la app. Continua alli.",
      closeHint: "Ya puedes cerrar esta pestana.",
      closeButton: "Cerrar esta pestana",
      retryLabel: "Volver a la app",
      errorTitle: "No se pudo completar el inicio de sesion",
      errorDescription: "Vuelve a intentarlo desde la app.",
    };
  }

  return {
    eyebrow: "AUTHENTICATION",
    title: "Authentication complete",
    description: "WhisperType has returned to the app. Continue there.",
    closeHint: "This tab is no longer needed. Close it below or manually.",
    closeButton: "Close this tab",
    retryLabel: "Return to the app",
    errorTitle: "Authentication could not be completed",
    errorDescription: "Please try signing in again from the app.",
  };
}

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

    // 1. まずアプリにディープリンクで戻る（非同期で少し遅延させて確実に処理）
    const redirectTimer = window.setTimeout(() => {
      try {
        window.location.href = desktopCallbackUrl;
      } catch {
        // ignore
      }
    }, 50);

    // 2. すぐに完了画面に切り替える
    //    ブラウザは自動で閉じないので、ユーザーに「閉じる」を促す
    const completeTimer = window.setTimeout(() => {
      setState(hasError ? "error" : "complete");
    }, 200);

    return () => {
      window.clearTimeout(redirectTimer);
      window.clearTimeout(completeTimer);
    };
  }, [desktopCallbackUrl, search]);

  const isError = state === "error";
  const isComplete = state === "complete";

  const handleCloseTab = () => {
    try {
      window.close();
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0f1117] px-6 py-8 text-slate-100">
      {/* 背景装飾 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/4 h-[800px] w-[800px] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute -right-1/4 -bottom-1/2 h-[600px] w-[600px] rounded-full bg-emerald-500/8 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] shadow-2xl backdrop-blur-xl">
          {/* アイコン */}
          <div className="flex flex-col items-center px-8 pt-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className={`mb-6 flex h-20 w-20 items-center justify-center rounded-3xl ${
                isError ? "bg-red-500/15" : "bg-emerald-500/15"
              }`}
            >
              {isError ? (
                <XCircle className="h-10 w-10 text-red-400" />
              ) : (
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              )}
            </motion.div>

            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              {copy.eyebrow}
            </p>

            <h1 className="mt-3 text-center text-2xl font-semibold tracking-tight">
              {isError ? copy.errorTitle : copy.title}
            </h1>

            <p className="mt-2 text-center text-sm leading-relaxed text-slate-400">
              {isError ? copy.errorDescription : copy.description}
            </p>
          </div>

          {/* アクションエリア */}
          <div className="px-8 pt-8 pb-10">
            {isError ? (
              <button
                type="button"
                onClick={() => {
                  window.location.href = desktopCallbackUrl;
                }}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white/[0.08] px-5 text-sm font-medium text-white transition hover:bg-white/[0.12]"
              >
                <ExternalLink className="h-4 w-4" />
                {copy.retryLabel}
              </button>
            ) : isComplete ? (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleCloseTab}
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500/15 px-5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/25"
                >
                  <X className="h-4 w-4 transition group-hover:rotate-90" />
                  {copy.closeButton}
                </button>
                <p className="text-center text-xs leading-relaxed text-slate-500">
                  {copy.closeHint}
                </p>
              </div>
            ) : (
              <div className="flex h-12 items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-400" />
              </div>
            )}
          </div>
        </div>

        <p className="mt-8 text-center text-xs font-medium tracking-wide text-slate-600">
          WhisperType
        </p>
      </motion.div>
    </div>
  );
}
