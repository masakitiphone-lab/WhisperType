import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, FileText } from "lucide-react";
import type { AppLocale } from "@/lib/appLocale";

type LegalCopy = {
  back: string;
  privacyTitle: string;
  privacyUpdated: string;
  privacyIntro: string;
  collectTitle: string;
  collectBody: string;
  useTitle: string;
  useBody: string;
  securityTitle: string;
  securityBody: string;
  thirdPartyTitle: string;
  thirdPartyBody: string;
  contactTitle: string;
  contactBody: string;
  termsTitle: string;
  termsUpdated: string;
  termsIntro: string;
  serviceTitle: string;
  serviceBody: string;
  accountTitle: string;
  accountBody: string;
  prohibitedTitle: string;
  prohibitedBody: string;
  disclaimerTitle: string;
  disclaimerBody: string;
  governingTitle: string;
  governingBody: string;
};

const LEGAL_COPY: Record<AppLocale, LegalCopy> = {
  ja: {
    back: "ログイン画面に戻る",
    privacyTitle: "プライバシーポリシー",
    privacyUpdated: "最終更新日: 2026年5月1日",
    privacyIntro:
      "WhisperType（以下「本サービス」）は、ユーザーのプライバシーを尊重し、個人情報の保護に最大限の注意を払っています。本ポリシーでは、収集する情報とその利用方法について説明します。",
    collectTitle: "1. 収集する情報",
    collectBody:
      "本サービスは、サービス提供に必要な範囲で以下の情報を収集することがあります。アカウント登録情報（メールアドレス等）、音声データ（文字起こし処理のために一時的に使用され、処理完了後は保存されません）、利用状況に関する統計情報です。",
    useTitle: "2. 情報の利用目的",
    useBody:
      "収集した情報は、サービスの提供・改善、ユーザーサポート、不正利用の防止、法令遵守のために利用します。音声データは文字起こし処理のためにのみ使用し、モデル学習や第三者提供を行うことはありません。",
    securityTitle: "3. データの保護",
    securityBody:
      "収集したデータは業界標準の暗号化技術を用いて保護し、不正アクセスや情報漏洩を防ぐための適切なセキュリティ対策を講じています。",
    thirdPartyTitle: "4. 第三者提供",
    thirdPartyBody:
      "ユーザーの同意がある場合、または法令に基づく場合を除き、個人情報を第三者に提供することはありません。",
    contactTitle: "5. お問い合わせ",
    contactBody:
      "プライバシーに関するご質問やご不明点がございましたら、開発者までお問い合わせください。",
    termsTitle: "利用規約",
    termsUpdated: "最終更新日: 2026年5月1日",
    termsIntro:
      "本利用規約（以下「本規約」）は、WhisperType（以下「本サービス」）の利用条件を定めるものです。ユーザーの皆様には、本規約に同意の上、本サービスをご利用いただきます。",
    serviceTitle: "1. サービスの概要",
    serviceBody:
      "本サービスは、AIを活用した音声文字起こしツールです。ユーザーは、本サービスを通じて音声をテキストに変換することができます。",
    accountTitle: "2. アカウント",
    accountBody:
      "ユーザーは、自己の責任においてアカウントを管理するものとします。アカウント情報の不正使用により生じた損害について、当方は責任を負いかねます。",
    prohibitedTitle: "3. 禁止事項",
    prohibitedBody:
      "法令違反、他者の権利侵害、サービスの運営を妨げる行為、不正アクセス、リバースエンジニアリングなどを禁止します。",
    disclaimerTitle: "4. 免責事項",
    disclaimerBody:
      "本サービスの利用により生じた損害について、当方の故意または重過失がある場合を除き、責任を負いかねます。文字起こしの精度は技術的な限界があり、100%の正確性を保証するものではありません。",
    governingTitle: "5. 準拠法",
    governingBody: "本規約は、日本法に準拠し、解釈されるものとします。",
  },
  en: {
    back: "Back to login",
    privacyTitle: "Privacy Policy",
    privacyUpdated: "Last updated: May 1, 2026",
    privacyIntro:
      "WhisperType (the “Service”) respects your privacy and takes the protection of personal information seriously. This policy explains what information we collect and how we use it.",
    collectTitle: "1. Information We Collect",
    collectBody:
      "We collect only what is necessary to provide the service: account details (such as your email address), audio data (used temporarily for transcription and not retained after processing), and aggregated usage statistics.",
    useTitle: "2. How We Use Information",
    useBody:
      "We use collected information to provide and improve the service, offer user support, prevent abuse, and comply with legal obligations. Audio data is used solely for transcription and is never used to train models or shared with third parties.",
    securityTitle: "3. Data Security",
    securityBody:
      "We protect your data using industry-standard encryption and implement appropriate security measures to prevent unauthorized access or leaks.",
    thirdPartyTitle: "4. Third-Party Sharing",
    thirdPartyBody:
      "We do not share personal information with third parties except with your consent or when required by law.",
    contactTitle: "5. Contact Us",
    contactBody:
      "If you have any questions about this privacy policy, please contact the developer.",
    termsTitle: "Terms of Service",
    termsUpdated: "Last updated: May 1, 2026",
    termsIntro:
      "These Terms of Service (“Terms”) govern your use of WhisperType (the “Service”). By using the Service, you agree to these Terms.",
    serviceTitle: "1. Service Overview",
    serviceBody:
      "The Service is an AI-powered voice transcription tool. You may use it to convert speech into text.",
    accountTitle: "2. Accounts",
    accountBody:
      "You are responsible for maintaining the confidentiality of your account credentials. We are not liable for damages caused by unauthorized use of your account.",
    prohibitedTitle: "3. Prohibited Conduct",
    prohibitedBody:
      "You may not use the Service for illegal activities, infringe on others' rights, disrupt the Service, attempt unauthorized access, or reverse engineer the software.",
    disclaimerTitle: "4. Disclaimer",
    disclaimerBody:
      "We are not liable for damages arising from your use of the Service except in cases of willful misconduct or gross negligence. Transcription accuracy is subject to technical limitations and is not guaranteed to be 100% accurate.",
    governingTitle: "5. Governing Law",
    governingBody: "These Terms are governed by the laws of Japan.",
  },
  es: {
    back: "Volver al inicio de sesion",
    privacyTitle: "Politica de Privacidad",
    privacyUpdated: "Ultima actualizacion: 1 de mayo de 2026",
    privacyIntro:
      "WhisperType (el 'Servicio') respeta tu privacidad y toma en serio la proteccion de la informacion personal. Esta politica explica que informacion recopilamos y como la usamos.",
    collectTitle: "1. Informacion que Recopilamos",
    collectBody:
      "Recopilamos solo lo necesario para proporcionar el servicio: detalles de la cuenta (como tu correo electronico), datos de audio (usados temporalmente para la transcripcion y no retenidos despues del procesamiento) y estadisticas de uso agregadas.",
    useTitle: "2. Como Usamos la Informacion",
    useBody:
      "Usamos la informacion recopilada para proporcionar y mejorar el servicio, ofrecer soporte al usuario, prevenir abusos y cumplir con obligaciones legales. Los datos de audio se usan unicamente para la transcripcion y nunca para entrenar modelos ni compartirlos con terceros.",
    securityTitle: "3. Seguridad de Datos",
    securityBody:
      "Protegemos tus datos mediante cifrado estandar en la industria e implementamos medidas de seguridad apropiadas para prevenir accesos no autorizados o filtraciones.",
    thirdPartyTitle: "4. Compartir con Terceros",
    thirdPartyBody:
      "No compartimos informacion personal con terceros excepto con tu consentimiento o cuando la ley lo requiera.",
    contactTitle: "5. Contacto",
    contactBody: "Si tienes preguntas sobre esta politica de privacidad, contacta al desarrollador.",
    termsTitle: "Terminos de Servicio",
    termsUpdated: "Ultima actualizacion: 1 de mayo de 2026",
    termsIntro:
      "Estos Terminos de Servicio ('Terminos') rigen el uso de WhisperType (el 'Servicio'). Al usar el Servicio, aceptas estos Terminos.",
    serviceTitle: "1. Descripcion del Servicio",
    serviceBody: "El Servicio es una herramienta de transcripcion de voz impulsada por IA. Puedes usarla para convertir voz en texto.",
    accountTitle: "2. Cuentas",
    accountBody:
      "Eres responsable de mantener la confidencialidad de tus credenciales de cuenta. No somos responsables de danos causados por el uso no autorizado de tu cuenta.",
    prohibitedTitle: "3. Conducta Prohibida",
    prohibitedBody:
      "No puedes usar el Servicio para actividades ilegales, infringir derechos de otros, interrumpir el Servicio, intentar accesos no autorizados o realizar ingenieria inversa del software.",
    disclaimerTitle: "4. Descargo de Responsabilidad",
    disclaimerBody:
      "No somos responsables de danos derivados del uso del Servicio, excepto en casos de dolo o negligencia grave. La precision de la transcripcion esta sujeta a limitaciones tecnicas y no se garantiza un 100% de exactitud.",
    governingTitle: "5. Ley Aplicable",
    governingBody: "Estos Terminos se rigen por las leyes de Japon.",
  },
};

function LegalLayout({
  appLocale,
  icon,
  title,
  updated,
  children,
}: {
  appLocale: AppLocale;
  icon: React.ReactNode;
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  const copy = LEGAL_COPY[appLocale] ?? LEGAL_COPY.ja;

  return (
    <div className="min-h-screen bg-[#fdfcf9] text-[#0b0e14]">
      <div className="mx-auto max-w-[720px] px-6 py-10 sm:px-8 sm:py-14">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#707684] transition-colors hover:text-[#111111]"
        >
          <ArrowLeft className="h-4 w-4" />
          {copy.back}
        </Link>

        <div className="mt-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0eee9] text-[#111111]">
            {icon}
          </div>
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-[#111111]">{title}</h1>
        </div>
        <p className="mt-2 text-[13px] text-[#707684]">{updated}</p>

        <div className="mt-10 space-y-10">{children}</div>
      </div>
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <section>
      <h2 className="text-[16px] font-semibold text-[#111111]">{title}</h2>
      <p className="mt-3 text-[15px] leading-8 text-[#3f434d]">{body}</p>
    </section>
  );
}

export function PrivacyPage({ appLocale }: { appLocale: AppLocale }) {
  const copy = LEGAL_COPY[appLocale] ?? LEGAL_COPY.ja;
  return (
    <LegalLayout
      appLocale={appLocale}
      icon={<ShieldCheck className="h-5 w-5" />}
      title={copy.privacyTitle}
      updated={copy.privacyUpdated}
    >
      <p className="text-[15px] leading-8 text-[#3f434d]">{copy.privacyIntro}</p>
      <Section title={copy.collectTitle} body={copy.collectBody} />
      <Section title={copy.useTitle} body={copy.useBody} />
      <Section title={copy.securityTitle} body={copy.securityBody} />
      <Section title={copy.thirdPartyTitle} body={copy.thirdPartyBody} />
      <Section title={copy.contactTitle} body={copy.contactBody} />
    </LegalLayout>
  );
}

export function TermsPage({ appLocale }: { appLocale: AppLocale }) {
  const copy = LEGAL_COPY[appLocale] ?? LEGAL_COPY.ja;
  return (
    <LegalLayout
      appLocale={appLocale}
      icon={<FileText className="h-5 w-5" />}
      title={copy.termsTitle}
      updated={copy.termsUpdated}
    >
      <p className="text-[15px] leading-8 text-[#3f434d]">{copy.termsIntro}</p>
      <Section title={copy.serviceTitle} body={copy.serviceBody} />
      <Section title={copy.accountTitle} body={copy.accountBody} />
      <Section title={copy.prohibitedTitle} body={copy.prohibitedBody} />
      <Section title={copy.disclaimerTitle} body={copy.disclaimerBody} />
      <Section title={copy.governingTitle} body={copy.governingBody} />
    </LegalLayout>
  );
}
