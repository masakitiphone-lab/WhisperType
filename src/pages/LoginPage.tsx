import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/useAuth";
import type { AppLocale } from "@/lib/appLocale";

type LoginUiCopy = {
  panelTitle: string;
  description: string;
  googleLabel: string;
  emailLabel: string;
  emailPlaceholder: string;
  emailSubmitLabel: string;
  privacyLabel: string;
  termsLabel: string;
  openingBrowser: string;
  emailSent: string;
  emailError: string;
  separator: string;
};

const LOGIN_COPY: Record<AppLocale, LoginUiCopy> = {
  ja: {
    panelTitle: "おかえりなさい",
    description: "WhisperType にログインして、すぐに音声入力を再開できます。",
    googleLabel: "Googleで続ける",
    emailLabel: "メールアドレス",
    emailPlaceholder: "mail@example.com",
    emailSubmitLabel: "メールで続ける",
    privacyLabel: "プライバシー",
    termsLabel: "利用規約",
    openingBrowser: "ブラウザでログインを完了してください...",
    emailSent: "メールを送信しました。受信箱を確認してください。",
    emailError: "メール送信に失敗しました。",
    separator: "または",
  },
  en: {
    panelTitle: "Welcome back",
    description: "Log in to WhisperType and get back to voice input right away.",
    googleLabel: "Continue with Google",
    emailLabel: "Email address",
    emailPlaceholder: "mail@example.com",
    emailSubmitLabel: "Send magic link",
    privacyLabel: "Privacy",
    termsLabel: "Terms",
    openingBrowser: "Opening browser...",
    emailSent: "Sent. Check your inbox for the sign-in link.",
    emailError: "Failed to send the email link.",
    separator: "or",
  },
  es: {
    panelTitle: "Bienvenido",
    description: "Inicia sesión en WhisperType y vuelve a escribir con tu voz al instante.",
    googleLabel: "Continuar con Google",
    emailLabel: "Correo electrónico",
    emailPlaceholder: "mail@example.com",
    emailSubmitLabel: "Enviar enlace",
    privacyLabel: "Privacidad",
    termsLabel: "Términos",
    openingBrowser: "Abriendo navegador...",
    emailSent: "Enviado. Revisa tu correo.",
    emailError: "No se pudo enviar el correo.",
    separator: "o",
  },
};

export default function LoginPage({ appLocale }: { appLocale: AppLocale }) {
  const { user, signInWithGoogle, signInWithEmailOtp, isLoading, authFlowStatus } = useAuth();
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
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

  const handleEmailSignIn = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailStatus(copy.emailError);
      return;
    }

    try {
      setEmailStatus(null);
      await signInWithEmailOtp(trimmedEmail);
      setEmailStatus(copy.emailSent);
    } catch (error) {
      console.error("Email sign in error:", error);
      setEmailStatus(copy.emailError);
    }
  };

  if (!isLoading && user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#f7f6f2] px-6 py-10 text-[#111111] sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[420px] items-center">
        <section className="w-full rounded-[28px] border border-[#e8e3d9] bg-white px-8 py-10 shadow-[0_24px_80px_rgba(17,17,17,0.06)] sm:px-10">
          <div className="flex flex-col items-center text-center">
            <img src="/app-icon.png" alt="" className="h-14 w-14 rounded-[16px]" />
            <p className="mt-5 text-[13px] font-medium uppercase tracking-[0.18em] text-[#8b867c]">
              WhisperType
            </p>
            <h1 className="mt-4 text-[32px] font-semibold tracking-[-0.04em] text-[#111111]">
              {copy.panelTitle}
            </h1>
            <p className="mt-3 max-w-[280px] text-[15px] leading-7 text-[#6b665d]">
              {copy.description}
            </p>
          </div>

          <div className="mt-10 space-y-4">
            <div className="space-y-3 rounded-[22px] border border-[#ebe7de] bg-[#faf8f4] p-4">
              <label className="block text-left text-[13px] font-medium text-[#6b665d]">
                {copy.emailLabel}
              </label>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={copy.emailPlaceholder}
                className="h-12 w-full rounded-2xl border border-[#dfdbd2] bg-white px-4 text-[15px] text-[#111111] outline-none transition placeholder:text-[#b0aa9f] focus:border-[#111111]"
              />
              <Button
                onClick={handleEmailSignIn}
                disabled={isLoading || !email.trim()}
                className="h-[52px] w-full rounded-full bg-[#111111] text-[15px] font-semibold text-white hover:bg-[#111111]/95"
              >
                <Mail className="mr-3 h-5 w-5" />
                {isLoading ? copy.openingBrowser : copy.emailSubmitLabel}
              </Button>
            </div>

            <div className="relative flex items-center">
              <div className="h-px flex-1 bg-[#ebe7de]" />
              <span className="px-3 text-[12px] uppercase tracking-[0.2em] text-[#b0aa9f]">
                {copy.separator}
              </span>
              <div className="h-px flex-1 bg-[#ebe7de]" />
            </div>

            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="h-[52px] w-full rounded-full border border-[#dfdbd2] bg-white text-[15px] font-semibold text-[#111111] hover:bg-[#f7f6f2]"
            >
              <GoogleMark />
              {isLoading ? copy.openingBrowser : copy.googleLabel}
            </Button>
          </div>

          {authFlowStatus || emailStatus ? (
            <div className="mt-4 rounded-[18px] border border-[#ebe7de] bg-[#faf8f4] px-4 py-3 text-center text-[13px] leading-6 text-[#6b665d]">
              {emailStatus ?? authFlowStatus}
            </div>
          ) : null}

          <div className="mt-8 flex items-center justify-center gap-5 text-[13px] text-[#8b867c]">
            <Link to="/privacy" className="transition-colors hover:text-[#111111]">
              {copy.privacyLabel}
            </Link>
            <span className="h-1 w-1 rounded-full bg-[#d5d0c6]" />
            <Link to="/terms" className="transition-colors hover:text-[#111111]">
              {copy.termsLabel}
            </Link>
          </div>
        </section>
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
