import { useEffect, useMemo, useState } from "react";
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
};

function getCallbackCopy(locale: AppLocale): CallbackCopy {
  if (locale === "ja") {
    return {
      eyebrow: "AUTHENTICATION",
      title: "ログインが完了しました",
      description: "WhisperType に戻っています。アプリ側でそのまま続けてください。",
      closeHint: "このブラウザタブは閉じて問題ありません。",
      retryLabel: "アプリに戻る",
      errorTitle: "ログインを完了できませんでした",
      errorDescription: "アプリからもう一度ログインをお試しください。",
    };
  }

  if (locale === "es") {
    return {
      eyebrow: "AUTHENTICATION",
      title: "Inicio de sesion completado",
      description: "WhisperType esta volviendo a la app. Contin?a alli.",
      closeHint: "Ya puedes cerrar esta pesta?a del navegador.",
      retryLabel: "Volver a la app",
      errorTitle: "No se pudo completar el inicio de sesion",
      errorDescription: "Vuelve a intentarlo desde la app.",
    };
  }

  return {
    eyebrow: "AUTHENTICATION",
    title: "Authentication complete",
    description: "WhisperType is returning you to the app. Continue there.",
    closeHint: "You can close this browser tab.",
    retryLabel: "Return to the app",
    errorTitle: "Authentication could not be completed",
    errorDescription: "Please try signing in again from the app.",
  };
}

function buildDesktopCallbackUrl(search: string) {
  return `${desktopAuthRedirectUrl}${search || ""}`;
}

export default function AuthCallback() {
  const [state, setState] = useState<CallbackState>("redirecting");
  const [locale] = useState<AppLocale>(() => readAppLocale());
  const copy = useMemo(() => getCallbackCopy(locale), [locale]);
  const search = typeof window !== "undefined" ? window.location.search : "";
  const desktopCallbackUrl = useMemo(() => buildDesktopCallbackUrl(search), [search]);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const hasCode = Boolean(params.get("code"));
    const hasError = Boolean(params.get("error") || params.get("error_description"));

    if (!hasCode && !hasError) {
      setState("error");
      return;
    }

    try {
      window.location.href = desktopCallbackUrl;
      window.setTimeout(() => {
        setState(hasError ? "error" : "complete");
      }, 900);
    } catch {
      setState(hasError ? "error" : "complete");
    }
  }, [desktopCallbackUrl, search]);

  const title = state === "error" ? copy.errorTitle : copy.title;
  const description = state === "error" ? copy.errorDescription : copy.description;

  return (
    <div className="min-h-screen bg-[#f3efe7] px-6 py-8 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
        <div className="w-full max-w-xl overflow-hidden rounded-[32px] border border-white/70 bg-white/95 shadow-[0_30px_90px_rgba(15,23,42,0.14)] backdrop-blur-sm">
          <div className="bg-[linear-gradient(145deg,rgba(15,23,42,0.98),rgba(27,37,55,0.95))] px-8 py-8 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60">
              {copy.eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">WhisperType</h1>
            <p className="mt-3 text-sm leading-7 text-white/78">{description}</p>
          </div>

          <div className="space-y-5 px-8 py-8">
            <div className="flex items-center gap-4 rounded-[24px] border border-black/6 bg-[#f7f4ee] px-5 py-4">
              <div className={`h-11 w-11 rounded-full ${state === "error" ? "bg-red-100" : "bg-emerald-100"}`} />
              <div>
                <p className="text-base font-semibold text-slate-950">{title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{copy.closeHint}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                window.location.href = desktopCallbackUrl;
              }}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-black px-5 text-sm font-medium text-white transition hover:bg-black/90"
            >
              {copy.retryLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

