import { Navigate } from "react-router-dom";
import { Eye, Globe2, Lock, Mail, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/useAuth";
import loginHeroIllustration from "@/assets/login-hero-illustration.png";
import type { AppLocale } from "@/lib/appLocale";

type LoginUiCopy = {
  headline: string;
  description: string;
  metricPrefix: string;
  metricNumber: string;
  metricSuffix: string;
  metricLabel: string;
  featureFastTitle: string;
  featureFastBody: string;
  featureNaturalTitle: string;
  featureNaturalBody: string;
  featureAnywhereTitle: string;
  featureAnywhereBody: string;
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
  submitLabel: string;
  dividerLabel: string;
  googleLabel: string;
  signUpPrompt: string;
  signUpLabel: string;
  openingBrowser: string;
};

const LOGIN_COPY: Record<AppLocale, LoginUiCopy> = {
  ja: {
    headline: "話すだけで、\n考える時間をつくる。",
    description: "WhisperTypeは、あなたの考えをすばやく文字に変えます。",
    metricPrefix: "最短",
    metricNumber: "1",
    metricSuffix: "秒台で",
    metricLabel: "文字起こし",
    featureFastTitle: "すばやく文字起こし",
    featureFastBody: "最短1秒台でテキスト化を実現します。",
    featureNaturalTitle: "自然な文章補正",
    featureNaturalBody: "AIが文脈を理解し、自然で読みやすい文章に整えます。",
    featureAnywhereTitle: "どこでも使える",
    featureAnywhereBody: "ショートカットやモバイルから、いつでもどこでも記録できます。",
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
    submitLabel: "ログイン",
    dividerLabel: "または",
    googleLabel: "Googleで続ける",
    signUpPrompt: "アカウントをお持ちでない方は",
    signUpLabel: "新規登録",
    openingBrowser: "ブラウザを開いています...",
  },
  en: {
    headline: "Talk freely,\nmake time to think.",
    description: "WhisperType turns your ideas into text quickly.",
    metricPrefix: "From",
    metricNumber: "1",
    metricSuffix: "second",
    metricLabel: "transcription",
    featureFastTitle: "Fast transcription",
    featureFastBody: "Turn speech into text in seconds.",
    featureNaturalTitle: "Natural correction",
    featureNaturalBody: "AI understands context and polishes your writing.",
    featureAnywhereTitle: "Use it anywhere",
    featureAnywhereBody: "Dictate from shortcuts and desktop workflows.",
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
    submitLabel: "Log in",
    dividerLabel: "or",
    googleLabel: "Continue with Google",
    signUpPrompt: "Do not have an account?",
    signUpLabel: "Sign up",
    openingBrowser: "Opening browser...",
  },
  es: {
    headline: "Habla y recupera\ntiempo para pensar.",
    description: "WhisperType convierte tus ideas en texto con rapidez.",
    metricPrefix: "Desde",
    metricNumber: "1",
    metricSuffix: "segundo",
    metricLabel: "transcripcion",
    featureFastTitle: "Transcripcion rapida",
    featureFastBody: "Convierte voz en texto en segundos.",
    featureNaturalTitle: "Correccion natural",
    featureNaturalBody: "La IA entiende el contexto y pule el texto.",
    featureAnywhereTitle: "Usalo donde quieras",
    featureAnywhereBody: "Dicta desde atajos y flujos de escritorio.",
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
    submitLabel: "Iniciar sesion",
    dividerLabel: "o",
    googleLabel: "Continuar con Google",
    signUpPrompt: "No tienes cuenta?",
    signUpLabel: "Registrate",
    openingBrowser: "Abriendo navegador...",
  },
};

export default function LoginPage({ appLocale }: { appLocale: AppLocale }) {
  const { user, signInWithGoogle, isLoading, authFlowStatus } = useAuth();
  const locale =
    appLocale === "en" &&
    typeof navigator !== "undefined" &&
    navigator.language.toLowerCase().startsWith("ja")
      ? "ja"
      : appLocale;
  const copy = LOGIN_COPY[locale] ?? LOGIN_COPY.ja;

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  if (!isLoading && user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#fdfcf9] text-[#0b0e14]">
      <div className="mx-auto grid min-h-screen w-full max-w-[1440px] xl:grid-cols-[minmax(0,1.62fr)_minmax(420px,0.88fr)]">
        <section className="flex min-h-0 flex-col border-b border-[#e8e2d7] px-6 py-6 sm:px-8 lg:px-10 lg:py-7 xl:border-b-0 xl:border-r">
          <div className="flex items-center gap-3">
            <img src="/app-icon.png" alt="" className="h-10 w-10 rounded-[10px]" />
            <span className="text-[18px] font-semibold tracking-[-0.02em]">WhisperType</span>
          </div>

          <div className="grid flex-1 gap-8 pt-6 xl:grid-cols-[minmax(0,0.94fr)_minmax(360px,0.86fr)] xl:items-center xl:gap-8">
            <div className="min-w-0">
              <h1 className="max-w-[620px] whitespace-pre-line text-[clamp(3rem,5.4vw,4.55rem)] font-semibold leading-[1.26] tracking-[-0.035em] text-[#111111]">
                {copy.headline}
              </h1>
              <p className="mt-7 max-w-[520px] text-[15px] leading-8 text-[#3f434d] sm:text-[18px]">
                {copy.description}
              </p>

              <div className="mt-10 flex flex-wrap items-end gap-x-4 gap-y-3 text-[#111111]">
                <span className="pb-2 text-[22px] font-semibold">{copy.metricPrefix}</span>
                <span className="bg-[linear-gradient(180deg,#f573b8_0%,#8d71ff_52%,#59d1ee_100%)] bg-clip-text text-[clamp(4.8rem,8vw,6rem)] font-semibold leading-none text-transparent">
                  {copy.metricNumber}
                </span>
                <div className="text-[clamp(2rem,3.1vw,2.35rem)] font-semibold leading-[1.34]">
                  <div>{copy.metricSuffix}</div>
                  <div>{copy.metricLabel}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center xl:justify-end">
              <img
                src={loginHeroIllustration}
                alt=""
                className="w-full max-w-[520px] object-contain xl:max-w-[560px]"
              />
            </div>
          </div>

          <div className="grid gap-4 border-b border-[#e8e2d7] py-6 md:grid-cols-3 md:gap-0">
            <FeatureItem icon={<Zap className="h-7 w-7" />} title={copy.featureFastTitle} body={copy.featureFastBody} />
            <FeatureItem icon={<Sparkles className="h-7 w-7" />} title={copy.featureNaturalTitle} body={copy.featureNaturalBody} />
            <FeatureItem icon={<Globe2 className="h-7 w-7" />} title={copy.featureAnywhereTitle} body={copy.featureAnywhereBody} />
          </div>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-5 text-[13px] text-[#707684]">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              {copy.trustNote}
            </span>
            <span>{copy.privacyLabel}</span>
            <span>{copy.termsLabel}</span>
          </div>
        </section>

        <section className="flex min-h-0 items-center px-6 py-8 sm:px-8 lg:px-12">
          <div className="mx-auto w-full max-w-[412px]">
            <h2 className="text-[clamp(2.55rem,4.1vw,3.05rem)] font-semibold tracking-[-0.03em] text-[#111111]">
              {copy.panelTitle}
            </h2>
            <p className="mt-5 max-w-[360px] text-[15px] leading-8 text-[#666d79]">
              {copy.panelDescription}
            </p>

            <div className="mt-10 space-y-8">
              <FieldShell label={copy.emailLabel}>
                <Mail className="h-5 w-5 text-[#5f6672]" />
                <input
                  className="min-w-0 flex-1 bg-transparent text-[16px] text-[#111111] outline-none placeholder:text-[#b2b7c1]"
                  placeholder={copy.emailPlaceholder}
                  type="email"
                  disabled
                />
              </FieldShell>

              <div>
                <div className="mb-3 flex items-center justify-between gap-4">
                  <span className="text-[15px] font-semibold text-[#111111]">{copy.passwordLabel}</span>
                  <button type="button" disabled className="text-[13px] font-semibold text-[#4587ff]">
                    {copy.forgotPassword}
                  </button>
                </div>
                <div className="flex h-[44px] items-center gap-3 rounded-[10px] border border-[#d9dee7] px-4">
                  <Lock className="h-5 w-5 text-[#5f6672]" />
                  <input
                    className="min-w-0 flex-1 bg-transparent text-[16px] text-[#111111] outline-none placeholder:text-[#b2b7c1]"
                    placeholder={copy.passwordPlaceholder}
                    type="password"
                    disabled
                  />
                  <Eye className="h-5 w-5 text-[#5f6672]" />
                </div>
              </div>

              <Button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="h-[46px] w-full rounded-[10px] bg-[#050608] text-[16px] font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.14)] hover:bg-[#050608]/95"
              >
                {isLoading ? copy.openingBrowser : copy.submitLabel}
              </Button>
            </div>

            {authFlowStatus ? (
              <div className="mt-4 rounded-[10px] border border-[#e7ebf2] bg-[#fafbfc] px-4 py-3 text-[13px] leading-6 text-[#5c6470]">
                {authFlowStatus}
              </div>
            ) : null}

            <div className="my-8 flex items-center gap-6 text-[13px] text-[#707684]">
              <span className="h-px flex-1 bg-[#e3e7ed]" />
              <span>{copy.dividerLabel}</span>
              <span className="h-px flex-1 bg-[#e3e7ed]" />
            </div>

            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="h-[46px] w-full rounded-[10px] border border-[#d9dee7] bg-white text-[16px] font-semibold text-[#111111] hover:bg-[#f8fafc]"
            >
              <GoogleMark />
              {isLoading ? copy.openingBrowser : copy.googleLabel}
            </Button>

            <p className="mt-10 text-center text-[14px] text-[#707684]">
              {copy.signUpPrompt}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="ml-3 font-semibold text-[#4587ff]"
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

function FieldShell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-3 block text-[15px] font-semibold text-[#111111]">{label}</span>
      <span className="flex h-[44px] items-center gap-3 rounded-[10px] border border-[#d9dee7] px-4">
        {children}
      </span>
    </label>
  );
}

function FeatureItem({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-4 md:border-r md:border-[#e8e2d7] md:px-6 first:md:pl-0 last:md:border-r-0 last:md:pr-0">
      <div className="shrink-0 pt-1 text-[#111111]">{icon}</div>
      <div className="min-w-0">
        <h3 className="text-[14px] font-semibold text-[#111111]">{title}</h3>
        <p className="mt-2 text-[13px] leading-7 text-[#707684]">{body}</p>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
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
