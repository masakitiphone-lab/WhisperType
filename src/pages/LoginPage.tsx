import { useState } from "react";
import { Navigate } from "react-router-dom";
import { ArrowUpRight, CheckCircle2, Mic, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/useAuth";
import type { AppLocale } from "@/lib/appLocale";

type LoginUiCopy = {
  productLabel: string;
  eyebrow: string;
  headline: string;
  description: string;
  highlights: string[];
  panelTitle: string;
  panelDescription: string;
  browserHint: string;
  securityLabel: string;
  trustNote: string;
  signInLabel: string;
  openingBrowser: string;
  errorFallback: string;
  rememberMeLabel: string;
};

function getLoginUiCopy(locale: AppLocale): LoginUiCopy {
  if (locale === "ja") {
    return {
      productLabel: "DESKTOP VOICE INPUT",
      eyebrow: "SIGN IN",
      headline: "話した内容を、そのまま仕事のスピードに変える。",
      description:
        "WhisperType は、ブラウザで安全にログインしたあと、いつものアプリへそのまま音声入力を届けられるデスクトップワークスペースです。",
      highlights: [
        "グローバルショートカットですぐ開始",
        "今使っているアプリへそのまま入力",
        "履歴とクレジットをひとつの画面で確認",
      ],
      panelTitle: "WhisperType にログイン",
      panelDescription: "Google アカウントでサインインして、音声入力をすぐ使える状態にします。",
      browserHint: "認証はブラウザで安全に行われます。完了後はアプリに戻ってそのまま続けられます。",
      securityLabel: "SECURITY",
      trustNote: "認証情報は Google とブラウザ側で処理され、アプリ内でパスワードを扱うことはありません。",
      signInLabel: "Google でログイン",
      openingBrowser: "ブラウザを開いています...",
      errorFallback: "ログインを完了できませんでした。少し時間をおいてもう一度お試しください。",
      rememberMeLabel: "次回から自動でログインする",
    };
  }

  if (locale === "es") {
    return {
      productLabel: "DESKTOP VOICE INPUT",
      eyebrow: "SIGN IN",
      headline: "Haz que el dictado encaje con tu trabajo diario.",
      description:
        "WhisperType completa el acceso en el navegador y te devuelve a una experiencia de voz rapida y enfocada dentro de la app de escritorio.",
      highlights: [
        "Empieza al instante con un atajo global",
        "Inserta texto en la app que ya estas usando",
        "Consulta historial y creditos en un solo lugar",
      ],
      panelTitle: "Accede a WhisperType",
      panelDescription: "Inicia sesion con Google para activar tu espacio de trabajo de dictado.",
      browserHint: "La autenticacion se realiza en el navegador. Cuando termine, vuelve a la app y continua sin interrupciones.",
      securityLabel: "SECURITY",
      trustNote: "La autenticacion se procesa de forma segura entre Google y tu navegador.",
      signInLabel: "Continuar con Google",
      openingBrowser: "Abriendo navegador...",
      errorFallback: "No se pudo completar el inicio de sesion.",
      rememberMeLabel: "Mantener sesion iniciada",
    };
  }

  return {
    productLabel: "DESKTOP VOICE INPUT",
    eyebrow: "SIGN IN",
    headline: "Keep voice input close to your everyday workflow.",
    description:
      "WhisperType finishes authentication in your browser, then brings you back to a focused desktop dictation workspace built for daily use.",
    highlights: [
      "Start instantly with a global shortcut",
      "Insert text into the app you are already using",
      "Keep history and credits in one place",
    ],
    panelTitle: "Sign in to WhisperType",
    panelDescription: "Use your Google account to unlock your desktop voice input workspace.",
    browserHint: "Authentication happens securely in your browser. When it finishes, return to the app and continue working.",
    securityLabel: "SECURITY",
    trustNote: "Google authentication is handled securely between Google and your browser.",
    signInLabel: "Continue with Google",
    openingBrowser: "Opening browser...",
    errorFallback: "Login could not be completed.",
    rememberMeLabel: "Keep me signed in",
  };
}

const AUTO_LOGIN_PREFERENCE_KEY = "whispertype.auto-login";

export default function LoginPage({ appLocale }: { appLocale: AppLocale }) {
  const { user, signInWithGoogle, isLoading, authFlowStatus } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      const stored = window.localStorage.getItem(AUTO_LOGIN_PREFERENCE_KEY);
      return stored !== "false";
    } catch {
      return true;
    }
  });
  const copy = getLoginUiCopy(appLocale);

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setIsSigningIn(true);
      try {
        window.localStorage.setItem(AUTO_LOGIN_PREFERENCE_KEY, rememberMe ? "true" : "false");
      } catch {
        // ignore local preference storage failures
      }
      await signInWithGoogle();
    } catch (err: unknown) {
      console.error("Sign in error:", err);
      setError(copy.errorFallback);
      setIsSigningIn(false);
    }
  };

  if (!isLoading && user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#f3efe7] px-5 py-6 text-slate-900 dark:bg-[#090b0f] dark:text-slate-50">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,249,241,0.96),rgba(244,238,229,0.98),rgba(232,239,246,0.9))] dark:bg-[linear-gradient(135deg,rgba(9,11,15,0.98),rgba(14,18,25,0.97),rgba(10,14,21,0.98))]" />
        <div className="absolute left-[-8rem] top-[-7rem] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,_rgba(245,158,11,0.18),_transparent_60%)] blur-3xl" />
        <div className="absolute right-[-6rem] top-8 h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,_rgba(59,130,246,0.16),_transparent_58%)] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
        <Card className="w-full overflow-hidden rounded-[34px] border border-white/60 bg-white/92 shadow-[0_28px_90px_rgba(15,23,42,0.14)] backdrop-blur-sm dark:border-white/10 dark:bg-[#11151c]/92 dark:shadow-[0_30px_90px_rgba(0,0,0,0.42)]">
          <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
            <section className="relative overflow-hidden border-b border-black/6 bg-[linear-gradient(155deg,rgba(16,24,40,0.97),rgba(26,38,60,0.95),rgba(13,18,28,0.98))] p-8 text-white dark:border-white/8 lg:border-b-0 lg:border-r lg:border-r-white/8 lg:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.18),transparent_24%)]" />
              <div className="relative flex h-full flex-col justify-between gap-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/12 bg-white/10 backdrop-blur-sm">
                      <img src="/icon.ico" alt="WhisperType" className="h-8 w-8 rounded-xl object-cover" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/60">
                        {copy.productLabel}
                      </p>
                      <p className="text-sm font-semibold text-white">WhisperType</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-[-0.05em] text-white md:text-[3.6rem]">
                      {copy.headline}
                    </h1>
                    <p className="max-w-xl text-sm leading-7 text-white/74 md:text-base">
                      {copy.description}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {copy.highlights.map((item) => (
                    <div
                      key={item}
                      className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-4 text-sm leading-6 text-white/82 backdrop-blur-sm"
                    >
                      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-2xl border border-white/12 bg-white/10">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="flex items-center p-6 lg:p-8">
              <div className="mx-auto w-full max-w-md space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                      {copy.eyebrow}
                    </p>
                    <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-950 dark:text-slate-50">
                      {copy.panelTitle}
                    </h2>
                    <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {copy.panelDescription}
                    </p>
                  </div>
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] border border-black/8 bg-[linear-gradient(135deg,rgba(251,191,36,0.16),rgba(244,114,182,0.10),rgba(59,130,246,0.16))] dark:border-white/10">
                    <Mic className="h-7 w-7 text-slate-900 dark:text-slate-100" />
                  </div>
                </div>

                <div className="rounded-[24px] border border-black/6 bg-[#f7f4ee] p-4 dark:border-white/8 dark:bg-[#171c24]">
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {copy.browserHint}
                  </p>
                </div>

                <label className="flex items-center gap-2.5 px-1 text-sm text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-black focus:ring-black"
                  />
                  <span>{copy.rememberMeLabel}</span>
                </label>

                <Button
                  onClick={handleGoogleSignIn}
                  disabled={isSigningIn || isLoading}
                  className="h-12 w-full rounded-2xl border border-black/10 bg-black text-base font-medium text-white hover:bg-black/90 dark:border-white/10 dark:bg-white dark:text-black dark:hover:bg-white/90"
                >
                  {isSigningIn ? copy.openingBrowser : copy.signInLabel}
                  {!isSigningIn ? <ArrowUpRight className="ml-2 h-4 w-4" /> : null}
                </Button>

                {error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                    {error}
                  </div>
                ) : null}

                {authFlowStatus && !error ? (
                  <div className="rounded-2xl border border-black/8 bg-[#fcfcfb] px-4 py-3 text-sm leading-6 text-slate-700 dark:border-white/10 dark:bg-[#18191d] dark:text-slate-300">
                    {authFlowStatus}
                  </div>
                ) : null}

                <div className="rounded-[24px] border border-dashed border-black/8 bg-white/84 px-4 py-4 dark:border-white/10 dark:bg-[#10141a]">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl border border-black/8 bg-white shadow-sm dark:border-white/10 dark:bg-[#171c24]">
                      <ShieldCheck className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                        {copy.securityLabel}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {copy.trustNote}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}

