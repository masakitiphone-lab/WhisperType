import type { AppLocale } from "@/lib/appLocale";

function LegalPage({ appLocale, terms }: { appLocale: AppLocale; terms: boolean }) {
  const title = terms ? (appLocale === "ja" ? "利用規約" : "Terms of Use") : (appLocale === "ja" ? "プライバシー" : "Privacy");
  return <main className="min-h-screen bg-white px-6 py-10 text-slate-900"><article className="mx-auto max-w-2xl space-y-5"><h1 className="text-3xl font-semibold">{title}</h1>{terms ? <p>WhisperType is a local desktop application. You are responsible for your Groq account, API key, recordings, and use of the transcription service.</p> : <><p>WhisperType stores application settings and your Groq API key locally using the operating system keychain.</p><p>Recorded audio is processed for transcription and is sent directly to Groq. WhisperType does not operate a hosted account or transcription-history database.</p></>}</article></main>;
}

export function PrivacyPage({ appLocale }: { appLocale: AppLocale }) { return <LegalPage appLocale={appLocale} terms={false} />; }
export function TermsPage({ appLocale }: { appLocale: AppLocale }) { return <LegalPage appLocale={appLocale} terms />; }
