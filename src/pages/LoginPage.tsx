import { useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Eye, Globe2, Lock, Mail, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/useAuth";
import loginDeskIllustration from "@/assets/login-desk-illustration.png";
import type { AppLocale } from "@/lib/appLocale";

type LoginUiCopy = {
  headline: string;
  description: string;
  metricPrefix: string;
  metricSuffix: string;
  metricLabel: string;
  fastTitle: string;
  fastDescription: string;
  correctionTitle: string;
  correctionDescription: string;
  anywhereTitle: string;
  anywhereDescription: string;
  trustNote: string;
  privacyLabel: string;
  termsLabel: string;
  panelTitle: string;
  panelDescription: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  forgotPassword: string;
  signInLabel: string;
  dividerLabel: string;
  googleLabel: string;
  signUpPrompt: string;
  signUpLabel: string;
  openingBrowser: string;
  errorFallback: string;
};

function getLoginUiCopy(locale: AppLocale): LoginUiCopy {
  if (locale === "ja") {
    return {
      headline: "話すだけで、\n考える時間をつくる。",
      description: "WhisperTypeは、あなたの考えをすばやく文字に変えます。",
      metricPrefix: "最短",
      metricSuffix: "秒台で",
      metricLabel: "文字起こし",
      fastTitle: "すばやく文字起こし",
      fastDescription: "最短1秒台でテキスト化を実現します。",
      correctionTitle: "自然な文章補正",
      correctionDescription: "AIが文脈を理解し、自然で読みやすい文章に整えます。",
      anywhereTitle: "どこでも使える",
      anywhereDescription: "ショートカットやモバイルから、いつでもどこでも記録できます。",
      trustNote: "データは暗号化され、安全に保護されています。",
      privacyLabel: "プライバシー",
      termsLabel: "利用規約",
      panelTitle: "おかえりなさい",
      panelDescription: "WhisperTypeアカウントにログインして、すぐに音声入力を再開しましょう。",
      emailLabel: "メールアドレス",
      emailPlaceholder: "you@example.com",
      passwordLabel: "パスワード",
      passwordPlaceholder: "パスワードを入力",
      forgotPassword: "パスワードをお忘れですか？",
      signInLabel: "ログイン",
      dividerLabel: "または",
      googleLabel: "Googleで続ける",
      signUpPrompt: "アカウントをお持ちでない方は",
      signUpLabel: "新規登録",
      openingBrowser: "ブラウザを開いています...",
      errorFallback: "ログインを完了できませんでした。少し時間をおいてもう一度お試しください。",
    };
  }

  if (locale === "es") {
    return {
      headline: "Habla y recupera\ntiempo para pensar.",
      description: "WhisperType convierte tus ideas en texto con rapidez.",
      metricPrefix: "Desde",
      metricSuffix: "segundo",
      metricLabel: "transcripcion",
      fastTitle: "Transcripcion rapida",
      fastDescription: "Convierte voz en texto en segundos.",
      correctionTitle: "Correccion natural",
      correctionDescription: "La IA entiende el contexto y pule el texto.",
      anywhereTitle: "Usalo donde quieras",
      anywhereDescription: "Dicta desde atajos y flujos de escritorio.",
      trustNote: "Tus datos estan cifrados y protegidos.",
      privacyLabel: "Privacidad",
      termsLabel: "Terminos",
      panelTitle: "Bienvenido",
      panelDescription: "Inicia sesion y vuelve a dictar en segundos.",
      emailLabel: "Correo electronico",
      emailPlaceholder: "you@example.com",
      passwordLabel: "Contrasena",
      passwordPlaceholder: "Ingresa tu contrasena",
      forgotPassword: "Olvidaste tu contrasena?",
      signInLabel: "Iniciar sesion",
      dividerLabel: "o",
      googleLabel: "Continuar con Google",
      signUpPrompt: "No tienes cuenta?",
      signUpLabel: "Registrate",
      openingBrowser: "Abriendo navegador...",
      errorFallback: "No se pudo completar el inicio de sesion.",
    };
  }

  return {
    headline: "Talk freely,\nmake time to think.",
    description: "WhisperType turns your ideas into text quickly.",
    metricPrefix: "From",
    metricSuffix: "second",
    metricLabel: "transcription",
    fastTitle: "Fast transcription",
    fastDescription: "Turn speech into text in seconds.",
    correctionTitle: "Natural correction",
    correctionDescription: "AI understands context and polishes your writing.",
    anywhereTitle: "Use it anywhere",
    anywhereDescription: "Dictate from shortcuts and desktop workflows.",
    trustNote: "Your data is encrypted and protected.",
    privacyLabel: "Privacy",
    termsLabel: "Terms",
    panelTitle: "Welcome back",
    panelDescription: "Log in to your WhisperType account and resume voice input.",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter password",
    forgotPassword: "Forgot password?",
    signInLabel: "Log in",
    dividerLabel: "or",
    googleLabel: "Continue with Google",
    signUpPrompt: "Do not have an account?",
    signUpLabel: "Sign up",
    openingBrowser: "Opening browser...",
    errorFallback: "Login could not be completed.",
  };
}

export default function LoginPage({ appLocale }: { appLocale: AppLocale }) {
  const { user, signInWithGoogle, isLoading, authFlowStatus } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = getLoginUiCopy(appLocale);

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setIsSigningIn(true);
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
    <div className="min-h-screen overflow-hidden bg-white text-[#080b10]">
      <div className="grid min-h-screen xl:grid-cols-[minmax(0,1.65fr)_minmax(400px,0.95fr)]">
        <section className="relative flex min-h-[650px] flex-col border-b border-slate-200 px-5 py-6 sm:px-7 xl:border-b-0 xl:border-r">
          <div className="flex items-center gap-3">
            <img src="/app-icon.png" alt="" className="h-9 w-9" />
            <span className="text-2xl font-semibold tracking-[-0.03em]">WhisperType</span>
          </div>

          <div className="grid flex-1 content-start gap-8 pt-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.8fr)] lg:items-center xl:gap-4">
            <div className="min-w-0">
              <div className="max-w-3xl">
                <h1 className="whitespace-pre-line text-[clamp(2.35rem,6vw,4.15rem)] font-semibold leading-[1.28] tracking-normal">
                  {copy.headline}
                </h1>
                <p className="mt-7 text-lg font-medium leading-8 text-slate-800">{copy.description}</p>
              </div>

              <div className="mt-12 flex flex-wrap items-center gap-5">
                <span className="text-2xl font-semibold tracking-normal">{copy.metricPrefix}</span>
                <span className="bg-[linear-gradient(140deg,#ff5aa7_8%,#7c6cff_50%,#43d6ef_92%)] bg-clip-text text-[clamp(4.5rem,10vw,6rem)] font-semibold leading-none text-transparent">
                  1
                </span>
                <div className="text-3xl font-semibold leading-[1.45] tracking-normal">
                  <p>{copy.metricSuffix}</p>
                  <p>{copy.metricLabel}</p>
                </div>
              </div>
            </div>

            <div className="flex min-w-0 justify-center lg:justify-end">
              <img
                src={loginDeskIllustration}
                alt=""
                className="pointer-events-none aspect-[14/9] w-full max-w-[610px] min-w-0 select-none object-contain"
              />
            </div>
          </div>

          <div className="grid gap-6 pb-12 pt-11 md:grid-cols-3">
            <FeatureItem icon={<Zap className="h-8 w-8" />} title={copy.fastTitle} description={copy.fastDescription} />
            <FeatureItem
              icon={<Sparkles className="h-8 w-8" />}
              title={copy.correctionTitle}
              description={copy.correctionDescription}
            />
            <FeatureItem
              icon={<Globe2 className="h-8 w-8" />}
              title={copy.anywhereTitle}
              description={copy.anywhereDescription}
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-slate-200 pt-5 text-sm text-slate-500">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              {copy.trustNote}
            </span>
            <span className="hidden h-6 w-px bg-slate-200 md:block" />
            <span>{copy.privacyLabel}</span>
            <span className="hidden h-6 w-px bg-slate-200 md:block" />
            <span>{copy.termsLabel}</span>
          </div>
        </section>

        <section className="flex items-center px-5 py-12 sm:px-7 lg:px-14">
          <div className="mx-auto w-full max-w-[460px]">
            <h2 className="text-[clamp(2.2rem,7vw,2.7rem)] font-semibold leading-tight tracking-normal">{copy.panelTitle}</h2>
            <p className="mt-5 max-w-sm text-base leading-8 text-slate-600">{copy.panelDescription}</p>

            <div className="mt-11 space-y-8">
              <label className="block">
                <span className="mb-3 block text-base font-semibold">{copy.emailLabel}</span>
                <span className="flex h-12 items-center gap-3 rounded-lg border border-slate-300 px-4 text-slate-400 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                  <Mail className="h-5 w-5 text-slate-700" />
                  <input
                    className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-slate-400"
                    placeholder={copy.emailPlaceholder}
                    type="email"
                    disabled
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-base font-semibold">{copy.passwordLabel}</span>
                  <button className="text-sm font-semibold text-blue-500" type="button" disabled>
                    {copy.forgotPassword}
                  </button>
                </span>
                <span className="flex h-12 items-center gap-3 rounded-lg border border-slate-300 px-4 text-slate-400 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                  <Lock className="h-5 w-5 text-slate-700" />
                  <input
                    className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-slate-400"
                    placeholder={copy.passwordPlaceholder}
                    type="password"
                    disabled
                  />
                  <Eye className="h-5 w-5 text-slate-700" />
                </span>
              </label>

              <Button
                onClick={handleGoogleSignIn}
                disabled={isSigningIn || isLoading}
                className="h-14 w-full rounded-lg bg-[#050608] text-base font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.14)] hover:bg-black"
              >
                {isSigningIn ? copy.openingBrowser : copy.signInLabel}
              </Button>
            </div>

            {error ? (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                {error}
              </div>
            ) : null}

            {authFlowStatus && !error ? (
              <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                {authFlowStatus}
              </div>
            ) : null}

            <div className="my-9 flex items-center gap-7 text-sm text-slate-500">
              <span className="h-px flex-1 bg-slate-200" />
              <span>{copy.dividerLabel}</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <Button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn || isLoading}
              className="h-14 w-full rounded-lg border border-slate-300 bg-white text-base font-semibold text-slate-900 hover:bg-slate-50"
            >
              <GoogleMark />
              {isSigningIn ? copy.openingBrowser : copy.googleLabel}
            </Button>

            <p className="mt-11 text-center text-base text-slate-500">
              {copy.signUpPrompt}
              <button
                className="ml-3 font-semibold text-blue-500"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSigningIn || isLoading}
              >
                {copy.signUpLabel}
              </button>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-5 border-slate-200 md:border-r md:pr-7 last:md:border-r-0">
      <div className="shrink-0 text-slate-950">{icon}</div>
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="mr-3 h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
