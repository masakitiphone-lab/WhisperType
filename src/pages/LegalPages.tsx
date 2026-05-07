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

const JA_PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: "1. 取得する情報",
    body: ["本アプリは、サービス提供に必要な範囲で、以下の情報を取得または保存します。"],
    items: [
      "認証情報: Supabase AuthおよびGoogleログインにより取得されるユーザーID、メールアドレス、表示名、プロフィール画像URL、認証セッション情報",
      "アカウント情報: プラン種別、無料利用回数、ボーナス利用回数、利用回数の更新日、作成日時、更新日時",
      "文字起こし履歴: 文字起こしされたテキスト、利用回数、作成日時",
      "課金状態: Microsoft Store Plusサブスクリプションの有効状態、Store識別子、確認日時",
      "音声データ: 文字起こし処理のために一時的に送信される音声ファイル",
      "アプリ設定: ホットキー、言語、モデル、マイク設定、表示設定、プロンプト等、利用者が本アプリ内で設定した内容",
    ],
  },
  {
    title: "2. Googleユーザーデータの利用",
    body: [
      "本アプリは、Googleログインを利用して、利用者のアカウントを識別し、ログイン状態を維持します。Googleから取得する情報は、認証、アカウント表示、利用者本人のデータ管理のためにのみ使用します。",
      "当方は、Googleユーザーデータを広告目的で利用せず、第三者に販売せず、当方のAIモデル学習またはモデル改善目的で利用しません。",
    ],
  },
  {
    title: "3. 音声データと文字起こしテキスト",
    body: [
      "本アプリは、利用者がホットキー等で録音操作を行った場合にのみマイク音声を録音します。本アプリはバックグラウンドで起動または常駐する場合がありますが、利用者の操作なしに勝手に録音することはありません。",
      "録音された音声は、本アプリ内で前処理された後、文字起こし処理のためにCloudflare Workerへ送信され、その後Groqの音声認識APIへ送信されます。当方は、音声ファイルそのものを継続的に保存することを意図していません。",
      "文字起こしに成功したテキストは、履歴表示、利用状況管理、サポート、不正利用防止のため、Supabase上のデータベースに保存されます。",
    ],
  },
  {
    title: "4. 利用目的",
    items: [
      "本アプリの提供、認証、アカウント管理のため",
      "音声をテキストへ変換し、利用者の入力先へ貼り付けるため",
      "文字起こし履歴を表示するため",
      "無料利用回数、ボーナス利用回数、Plusプランの状態を管理するため",
      "Microsoft Storeサブスクリプションの有効状態を確認するため",
      "不正利用、過度な利用、セキュリティ上の問題を防止するため",
      "問い合わせ対応、障害調査、品質改善、法令対応のため",
    ],
  },
  {
    title: "5. AI学習への利用",
    body: [
      "当方は、利用者の音声データおよび文字起こしテキストを、当方のAIモデル学習またはモデル改善目的で利用しません。ただし、本アプリは文字起こし処理のために外部サービスであるGroqおよびCloudflareを利用します。これら外部サービスにおけるデータ処理は、各サービスの規約およびプライバシーポリシーに従います。",
    ],
  },
  {
    title: "6. 第三者サービス",
    items: [
      "Supabase: 認証、ユーザープロフィール、文字起こし履歴、利用回数、プラン状態の保存",
      "Google OAuth: Googleアカウントによるログイン",
      "Cloudflare Workers / Cloudflare AI Gateway: 文字起こしリクエストの中継およびインフラ運用",
      "Groq: 音声認識による文字起こし処理",
      "Microsoft Store: Plusサブスクリプションの購入、解約、請求管理",
      "Vercel: 公開Webページのホスティング",
    ],
  },
  {
    title: "7. 課金情報",
    body: [
      "WhisperType Plusの購入、請求、解約、返金はMicrosoft Storeを通じて管理されます。当方は、支払いカード番号などの決済手段の詳細を取得または保存しません。当方は、Plusの有効状態、Store識別子、確認日時など、サービス提供に必要な課金状態のみを保存します。",
    ],
  },
  {
    title: "8. 保存期間と削除",
    body: [
      "アカウント情報、文字起こし履歴、課金状態、利用回数に関する情報は、アカウントが有効である間、またはサービス提供、不正利用防止、法令対応に必要な期間保存されます。",
      "利用者は、アプリ内の削除機能または問い合わせ窓口を通じて、アカウントデータまたは文字起こし履歴の削除を依頼できます。ただし、法令、課金、不正利用防止、紛争対応のために必要な情報は、必要な期間保存する場合があります。",
    ],
  },
  {
    title: "9. お問い合わせ",
    body: ["運営: Studio Mirai", "メール: studiomirai.info@gmail.com"],
  },
];

const JA_TERMS_SECTIONS: LegalSection[] = [
  {
    title: "1. 適用",
    body: [
      "本規約は、本アプリの利用者と当方との間の本アプリ利用に関する一切の関係に適用されます。利用者は、本規約およびプライバシーポリシーに同意した上で本アプリを利用するものとします。",
    ],
  },
  {
    title: "2. 本アプリの内容",
    body: [
      "本アプリは、利用者が指定したホットキー等の操作によりマイク音声を録音し、外部の音声認識サービスを利用してテキストへ変換し、利用者の入力先へ貼り付ける音声入力支援アプリです。",
      "本アプリはバックグラウンドで起動し、システムトレイに常駐する場合があります。ただし、利用者の操作なしに勝手に録音することはありません。",
    ],
  },
  {
    title: "3. アカウント",
    body: [
      "本アプリの利用には、Googleログイン等によるアカウント認証が必要です。利用者は、自己の責任でアカウントを管理するものとし、アカウントの不正利用または管理不十分により生じた損害について、当方は当方の故意または重過失がある場合を除き責任を負いません。",
    ],
  },
  {
    title: "4. 無料プラン",
    body: [
      "無料プランでは、当方が定める範囲内で文字起こし機能を利用できます。日ごとの無料利用回数を使い切った場合、ボーナス利用回数が消費されます。両方を使い切った場合、文字起こしは利用できません。",
    ],
  },
  {
    title: "5. Plusプラン",
    body: [
      "Plusプランは、Microsoft Storeのサブスクリプションとして提供される有料プランです。価格は月額300円を予定しています。Plusプランでは、利用者向けには文字起こしを無制限として提供します。ただし、不正利用、過度な負荷、サービス保護のため、当方は内部的な利用制限または一時停止措置を行う場合があります。",
    ],
  },
  {
    title: "6. 課金、解約、返金",
    body: [
      "Plusプランの購入、請求、更新、解約はMicrosoft Storeを通じて管理されます。利用者は、MicrosoftアカウントまたはMicrosoft Storeのサブスクリプション管理画面からサブスクリプションを確認・解約できます。",
      "返金の可否および手続は、Microsoft Storeのポリシーに従います。Microsoft Storeの商品IDが未設定の場合、アプリ内の購入機能は利用できません。",
    ],
  },
  {
    title: "7. 禁止事項",
    items: [
      "法令または公序良俗に反する行為",
      "第三者の権利、プライバシー、名誉、信用を侵害する行為",
      "本人の同意なく第三者の会話、音声、個人情報を録音または文字起こしする行為",
      "犯罪、詐欺、嫌がらせ、差別、脅迫、スパム等に利用する行為",
      "本アプリ、サーバー、外部APIに過度な負荷をかける行為",
      "不正アクセス、リバースエンジニアリング、改変、脆弱性探索、回避行為",
      "アカウント、Plus権利、プロモーションコード等を不正に取得または利用する行為",
    ],
  },
  {
    title: "8. 文字起こし結果",
    body: [
      "本アプリによる文字起こし結果の正確性、完全性、有用性は保証されません。利用者は、重要な用途に使用する場合、必ず内容を確認し、自己の責任で利用するものとします。",
      "医療、法律、金融、雇用、契約、本人確認、緊急対応など、重大な判断を伴う用途において、本アプリの出力を唯一の根拠として利用しないでください。",
    ],
  },
  {
    title: "9. 機密情報の取扱い",
    body: [
      "利用者は、個人情報、機密情報、営業秘密、認証情報、支払い情報などを本アプリで扱う場合、自己の責任で内容を確認し、必要に応じて入力を避けるものとします。",
    ],
  },
  {
    title: "10. 免責",
    body: [
      "当方は、本アプリが利用者の特定の目的に適合すること、常に利用可能であること、エラーがないこと、文字起こしが正確であることを保証しません。当方は、当方の故意または重過失がある場合を除き、本アプリの利用または利用不能により生じた損害について責任を負いません。",
      "消費者契約法その他の法令により当方の責任を免除または制限できない場合、本条は当該法令で許される範囲で適用されます。",
    ],
  },
  {
    title: "11. お問い合わせ",
    body: ["運営: Studio Mirai", "メール: studiomirai.info@gmail.com"],
  },
];

const EN_PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: "1. Information We Collect",
    body: [
      "WhisperType collects only what is necessary to provide the app: authentication information, account and plan status, usage counts, transcription history, app settings, temporary audio files used for transcription, and Microsoft Store subscription status.",
    ],
  },
  {
    title: "2. Google User Data",
    body: [
      "Google user data is used only for sign-in, account identification, and user data management. Studio Mirai does not sell Google user data, use it for advertising, or use it to train or improve AI models.",
    ],
  },
  {
    title: "3. Audio and Transcription Text",
    body: [
      "The app records microphone audio only when you start recording with a hotkey or recording action. It may run in the background or system tray, but it does not record without your action.",
      "Audio is preprocessed in the app, sent to a Cloudflare Worker, and then sent to Groq for transcription. Studio Mirai does not intend to retain the audio file after processing. Successful transcription text is stored in Supabase for history, usage management, support, and abuse prevention.",
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
    body: ["Operator: Studio Mirai", "Email: studiomirai.info@gmail.com"],
  },
];

const EN_TERMS_SECTIONS: LegalSection[] = [
  {
    title: "1. Service",
    body: [
      "WhisperType is a voice input app that records microphone audio when you trigger recording, converts it to text using external transcription services, and inserts the text into your active input field.",
    ],
  },
  {
    title: "2. Plans and Billing",
    body: [
      "The free plan is limited by daily free usage and bonus usage. WhisperType Plus is planned as a Microsoft Store subscription priced at 300 JPY per month. Purchases, cancellations, billing, and refunds are managed by Microsoft Store.",
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
    body: ["Operator: Studio Mirai", "Email: studiomirai.info@gmail.com"],
  },
];

const LEGAL_COPY: Record<AppLocale, LegalCopy> = {
  ja: {
    privacyTitle: "プライバシーポリシー",
    termsTitle: "利用規約",
    privacy: {
      back: "ログイン画面に戻る",
      updated: "最終更新日: 2026年5月7日",
      publicPage: "公開版を開く",
      intro: [
        "Studio Mirai（以下「当方」といいます）は、WhisperType（以下「本アプリ」といいます）における利用者情報の取扱いについて、本プライバシーポリシーを定めます。",
        "Studio Miraiは、現時点では法人ではなく、個人が運営するソフトウェアブランドです。",
      ],
      sections: JA_PRIVACY_SECTIONS,
    },
    terms: {
      back: "ログイン画面に戻る",
      updated: "最終更新日: 2026年5月7日",
      publicPage: "公開版を開く",
      intro: [
        "この利用規約は、Studio Mirai（以下「当方」といいます）が提供するWhisperType（以下「本アプリ」といいます）の利用条件を定めるものです。",
        "Studio Miraiは、現時点では法人ではなく、個人が運営するソフトウェアブランドです。",
      ],
      sections: JA_TERMS_SECTIONS,
    },
  },
  en: {
    privacyTitle: "Privacy Policy",
    termsTitle: "Terms of Use",
    privacy: {
      back: "Back to login",
      updated: "Last updated: May 7, 2026",
      publicPage: "Open public version",
      intro: [
        "Studio Mirai is an individual-operated software brand. This policy explains how WhisperType handles user information.",
      ],
      sections: EN_PRIVACY_SECTIONS,
    },
    terms: {
      back: "Back to login",
      updated: "Last updated: May 7, 2026",
      publicPage: "Open public version",
      intro: [
        "These Terms govern your use of WhisperType, a voice input app provided by Studio Mirai.",
      ],
      sections: EN_TERMS_SECTIONS,
    },
  },
  es: {
    privacyTitle: "Privacy Policy",
    termsTitle: "Terms of Use",
    privacy: {
      back: "Back to login",
      updated: "Last updated: May 7, 2026",
      publicPage: "Open public version",
      intro: [
        "Studio Mirai is an individual-operated software brand. This policy explains how WhisperType handles user information.",
      ],
      sections: EN_PRIVACY_SECTIONS,
    },
    terms: {
      back: "Back to login",
      updated: "Last updated: May 7, 2026",
      publicPage: "Open public version",
      intro: [
        "These Terms govern your use of WhisperType, a voice input app provided by Studio Mirai.",
      ],
      sections: EN_TERMS_SECTIONS,
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
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#707684] transition-colors hover:text-[#111111]"
          >
            <ArrowLeft className="h-4 w-4" />
            {copy.back}
          </Link>
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#707684] transition-colors hover:text-[#111111]"
          >
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
      <div>
        <Paragraphs body={page.intro} />
      </div>
      {page.sections.map((section) => (
        <Section key={section.title} section={section} />
      ))}
    </>
  );
}

export function PrivacyPage({ appLocale }: { appLocale: AppLocale }) {
  const legal = LEGAL_COPY[appLocale] ?? LEGAL_COPY.ja;
  return (
    <LegalLayout
      copy={legal.privacy}
      icon={<ShieldCheck className="h-5 w-5" />}
      title={legal.privacyTitle}
      publicUrl={`${PUBLIC_LEGAL_BASE_URL}/privacy/`}
    >
      <LegalContent page={legal.privacy} />
    </LegalLayout>
  );
}

export function TermsPage({ appLocale }: { appLocale: AppLocale }) {
  const legal = LEGAL_COPY[appLocale] ?? LEGAL_COPY.ja;
  return (
    <LegalLayout
      copy={legal.terms}
      icon={<FileText className="h-5 w-5" />}
      title={legal.termsTitle}
      publicUrl={`${PUBLIC_LEGAL_BASE_URL}/terms/`}
    >
      <LegalContent page={legal.terms} />
    </LegalLayout>
  );
}
