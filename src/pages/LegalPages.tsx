import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, FileText, ShieldCheck } from "lucide-react";
import type { AppLocale } from "@/lib/appLocale";

const PUBLIC_LEGAL_BASE_URL = "https://studio-mirai.vercel.app/whispertype";

type LegalSection = {
  title: string;
  body?: string[];
  items?: string[];
};

type LegalPageCopy = {
  back: string;
  updated: string;
  publicPage: string;
  intro: string[];
  sections: LegalSection[];
};

type LegalCopy = {
  privacyTitle: string;
  termsTitle: string;
  privacy: LegalPageCopy;
  terms: LegalPageCopy;
};

const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: "1. Information We Collect",
    body: [
      "WhisperType collects only the data needed to provide the app: authentication data, account and plan status, daily and bonus credit counts, transcription history, app settings, microphone audio processed for transcription, and Microsoft Store entitlement status.",
    ],
  },
  {
    title: "2. How We Use Data",
    body: [
      "We use this data to sign you in, keep your settings, process transcriptions, manage free-plan usage, show your history, and provide customer support.",
    ],
  },
  {
    title: "3. Audio and Transcription Text",
    body: [
      "WhisperType records microphone audio only when you start a transcription. Audio is preprocessed locally, sent to the configured Cloudflare Worker, and then forwarded for transcription. Successful transcription text is stored so you can review past transcriptions and usage.",
    ],
  },
  {
    title: "4. Third-Party Services",
    body: [
      "WhisperType uses Supabase, Google OAuth, Cloudflare Workers, Cloudflare AI Gateway, Groq, Microsoft Store, and Vercel to provide the service.",
    ],
  },
  {
    title: "5. Contact",
    items: ["Operator: Studio Mirai", "Email: studiomirai.info@gmail.com"],
  },
];

const TERMS_SECTIONS: LegalSection[] = [
  {
    title: "1. Service",
    body: [
      "WhisperType is a voice input app that records microphone audio when you trigger recording, converts it to text using external transcription services, and inserts the text into your active input field.",
    ],
  },
  {
    title: "2. Plans and Billing",
    body: [
      "The free plan uses daily credits first and bonus credits second. WhisperType Plus is a Microsoft Store subscription add-on priced at 300 JPY per month. Purchases, cancellations, billing, and refunds are handled by Microsoft Store.",
    ],
  },
  {
    title: "3. Prohibited Use",
    body: [
      "You must not use the app for illegal activity, unauthorized recording, privacy violations, harassment, spam, abuse of servers or APIs, unauthorized access, reverse engineering, or misuse of Plus entitlements or promotional codes.",
    ],
  },
  {
    title: "4. Transcription Accuracy",
    body: [
      "Transcription results are not guaranteed to be accurate, complete, or suitable for any particular purpose. Do not rely on the output as the sole basis for medical, legal, financial, employment, contract, identity, or emergency decisions.",
    ],
  },
  {
    title: "5. Contact",
    items: ["Operator: Studio Mirai", "Email: studiomirai.info@gmail.com"],
  },
];

const COPY: Record<AppLocale, LegalCopy> = {
  ja: {
    privacyTitle: "プライバシーポリシー",
    termsTitle: "利用規約",
    privacy: {
      back: "ログイン画面に戻る",
      updated: "最終更新日: 2026年5月7日",
      publicPage: "公開版を開く",
      intro: [
        "Studio Mirai は WhisperType を提供しています。このポリシーは、WhisperType における利用者情報の取扱いを説明するものです。",
      ],
      sections: PRIVACY_SECTIONS,
    },
    terms: {
      back: "ログイン画面に戻る",
      updated: "最終更新日: 2026年5月7日",
      publicPage: "公開版を開く",
      intro: [
        "この利用規約は、Studio Mirai が提供する WhisperType の利用条件を定めるものです。",
      ],
      sections: TERMS_SECTIONS,
    },
  },
  en: {
    privacyTitle: "Privacy Policy",
    termsTitle: "Terms of Use",
    privacy: {
      back: "Back to login",
      updated: "Last updated: May 7, 2026",
      publicPage: "Open public version",
      intro: ["Studio Mirai provides WhisperType. This policy explains how the app handles user information."],
      sections: PRIVACY_SECTIONS,
    },
    terms: {
      back: "Back to login",
      updated: "Last updated: May 7, 2026",
      publicPage: "Open public version",
      intro: ["These Terms govern your use of WhisperType, a voice input app provided by Studio Mirai."],
      sections: TERMS_SECTIONS,
    },
  },
  es: {
    privacyTitle: "Privacy Policy",
    termsTitle: "Terms of Use",
    privacy: {
      back: "Back to login",
      updated: "Last updated: May 7, 2026",
      publicPage: "Open public version",
      intro: ["Studio Mirai provides WhisperType. This policy explains how the app handles user information."],
      sections: PRIVACY_SECTIONS,
    },
    terms: {
      back: "Back to login",
      updated: "Last updated: May 7, 2026",
      publicPage: "Open public version",
      intro: ["These Terms govern your use of WhisperType, a voice input app provided by Studio Mirai."],
      sections: TERMS_SECTIONS,
    },
  },
};

function LegalLayout({
  copy,
  icon,
  title,
  publicUrl,
  children,
}: {
  copy: LegalPageCopy;
  icon: React.ReactNode;
  title: string;
  publicUrl: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fdfcf9] text-[#0b0e14]">
      <div className="mx-auto max-w-[820px] px-6 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link to="/login" className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#707684] transition-colors hover:text-[#111111]">
            <ArrowLeft className="h-4 w-4" />
            {copy.back}
          </Link>
          <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#707684] transition-colors hover:text-[#111111]">
            {copy.publicPage}
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0eee9] text-[#111111]">
            {icon}
          </div>
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-[#111111]">{title}</h1>
        </div>
        <p className="mt-2 text-[13px] text-[#707684]">{copy.updated}</p>

        <div className="mt-10 space-y-10">{children}</div>
      </div>
    </div>
  );
}

function Paragraphs({ body }: { body?: string[] }) {
  if (!body?.length) return null;
  return (
    <>
      {body.map((paragraph) => (
        <p key={paragraph} className="mt-3 text-[15px] leading-8 text-[#3f434d]">
          {paragraph}
        </p>
      ))}
    </>
  );
}

function Section({ section }: { section: LegalSection }) {
  return (
    <section>
      <h2 className="text-[16px] font-semibold text-[#111111]">{section.title}</h2>
      <Paragraphs body={section.body} />
      {section.items?.length ? (
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-7 text-[#3f434d]">
          {section.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function LegalContent({ page }: { page: LegalPageCopy }) {
  return (
    <>
      <Paragraphs body={page.intro} />
      {page.sections.map((section) => (
        <Section key={section.title} section={section} />
      ))}
    </>
  );
}

export function PrivacyPage({ appLocale }: { appLocale: AppLocale }) {
  const legal = COPY[appLocale] ?? COPY.ja;
  return (
    <LegalLayout copy={legal.privacy} icon={<ShieldCheck className="h-5 w-5" />} title={legal.privacyTitle} publicUrl={`${PUBLIC_LEGAL_BASE_URL}/privacy/`}>
      <LegalContent page={legal.privacy} />
    </LegalLayout>
  );
}

export function TermsPage({ appLocale }: { appLocale: AppLocale }) {
  const legal = COPY[appLocale] ?? COPY.ja;
  return (
    <LegalLayout copy={legal.terms} icon={<FileText className="h-5 w-5" />} title={legal.termsTitle} publicUrl={`${PUBLIC_LEGAL_BASE_URL}/terms/`}>
      <LegalContent page={legal.terms} />
    </LegalLayout>
  );
}
