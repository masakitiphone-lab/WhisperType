import type { AppLocale } from "@/lib/appLocale";

export type OverlayNoticePayload = {
  kind: "error" | "manual_copy";
  code: string;
  detail?: string | null;
  text?: string | null;
};

export type OverlayNoticeViewModel = {
  kind: "error" | "manual_copy";
  code: string;
  badgeLabel: string;
  title: string;
  message: string;
  detail?: string;
  text?: string;
  openLabel: string;
  closeLabel: string;
  copyLabel?: string;
  width: number;
  minHeight: number;
  autoDismiss: boolean;
};

type NoticeCopy = {
  title: string;
  message: string;
};

const NOTICE_WIDTH = 268;
const ERROR_HEIGHT = 100;
const MANUAL_COPY_HEIGHT = 124;

export function classifyOverlayError(errorMessage: string): OverlayNoticePayload {
  const normalized = errorMessage.toLowerCase();

  if (normalized.includes("ctrl_v_send_failed")) return { kind: "error", code: "ctrl_v_send_failed" };
  if (normalized.includes("paste_target_not_selected")) return { kind: "error", code: "paste_target_not_selected" };
  if (normalized.includes("groq_api_key_missing")) return { kind: "error", code: "groq_api_key_missing" };
  if (normalized.includes("invalid_audio")) return { kind: "error", code: "invalid_audio" };
  if (normalized.includes("empty_transcription")) return { kind: "error", code: "empty_transcription" };
  if (normalized.includes("provider_unavailable")) return { kind: "error", code: "provider_unavailable" };
  if (normalized.includes("transcription_timeout")) return { kind: "error", code: "transcription_timeout" };

  return { kind: "error", code: "transcription_failed" };
}

export function buildOverlayNotice(locale: AppLocale, payload: OverlayNoticePayload): OverlayNoticeViewModel {
  const labels = getOverlayLabels(locale);

  if (payload.kind === "manual_copy") {
    const copy = getManualCopyNotice(locale, payload.code);
    return {
      kind: "manual_copy",
      code: payload.code,
      badgeLabel: labels.copyNeeded,
      title: "",
      message: copy.message,
      text: payload.text ?? "",
      openLabel: labels.open,
      closeLabel: labels.close,
      copyLabel: labels.copy,
      width: NOTICE_WIDTH,
      minHeight: MANUAL_COPY_HEIGHT,
      autoDismiss: false,
    };
  }

  const copy = getErrorNotice(locale, payload.code);
  return {
    kind: "error",
    code: payload.code,
    badgeLabel: labels.notice,
    title: copy.title,
    message: copy.message,
    openLabel: labels.open,
    closeLabel: labels.close,
    width: NOTICE_WIDTH,
    minHeight: ERROR_HEIGHT,
    autoDismiss: false,
  };
}

function getOverlayLabels(locale: AppLocale) {
  if (locale === "ja") {
    return {
      notice: "通知",
      copyNeeded: "コピー",
      open: "開く",
      close: "閉じる",
      copy: "コピー",
    };
  }

  if (locale === "es") {
    return {
      notice: "Aviso",
      copyNeeded: "Copiar",
      open: "Abrir",
      close: "Cerrar",
      copy: "Copiar",
    };
  }

  return {
    notice: "Notice",
    copyNeeded: "Copy",
    open: "Open",
    close: "Close",
    copy: "Copy",
  };
}

function getManualCopyNotice(locale: AppLocale, code: string): NoticeCopy {
  const isPasteTargetMissing = code === "paste_target_not_selected";
  const isAccessibilityRequired = code === "accessibility_permission_required";

  if (locale === "ja") {
    if (isAccessibilityRequired) return { title: "", message: "アクセシビリティ許可をシステム設定で有効にしてください" };
    if (isPasteTargetMissing) return { title: "", message: "入力フィールドを選んでください" };
    return { title: "", message: "下の文面をコピーしてお使いください" };
  }

  if (locale === "es") {
    if (isAccessibilityRequired) return { title: "", message: "Habilita el permiso de accesibilidad en Configuración" };
    if (isPasteTargetMissing) return { title: "", message: "Selecciona un campo de texto" };
    return { title: "", message: "Copia el texto de abajo" };
  }

  if (isAccessibilityRequired) return { title: "", message: "Enable Accessibility permission in System Settings" };
  if (isPasteTargetMissing) return { title: "", message: "Select a text field first" };
  return { title: "", message: "Copy the text below" };
}

function getErrorNotice(locale: AppLocale, code: string): NoticeCopy {
  const copy = ERROR_COPY[locale] ?? ERROR_COPY.en;
  return copy[code] ?? copy.transcription_failed;
}

const ERROR_COPY: Record<AppLocale, Record<string, NoticeCopy>> = {
  ja: {
    groq_api_key_missing: { title: "APIキー未設定", message: "設定画面でGroq APIキーを入力してください。" },
    transcription_timeout: { title: "時間がかかっています", message: "もう一度お試しください。" },
    ctrl_v_send_failed: { title: "貼り付け失敗", message: "必要ならコピーしてください。" },
    paste_target_not_selected: { title: "入力先を確認", message: "入力欄を選んでください。" },
    microphone_unavailable: { title: "マイクを使えません", message: "権限を確認してください。" },
    invalid_audio: { title: "音声を処理できません", message: "もう一度録音してください。" },
    empty_transcription: { title: "文字が見つかりません", message: "声量を確認してください。" },
    provider_unavailable: { title: "接続できません", message: "通信状況を確認してください。" },
    transcription_failed: { title: "文字起こし失敗", message: "もう一度お試しください。" },
  },
  en: {
    groq_api_key_missing: { title: "API key missing", message: "Enter your Groq API key in Settings." },
    transcription_timeout: { title: "Taking too long", message: "Try again." },
    ctrl_v_send_failed: { title: "Paste failed", message: "Copy if needed." },
    paste_target_not_selected: { title: "Check target", message: "Select an input field." },
    microphone_unavailable: { title: "No microphone", message: "Check permissions." },
    invalid_audio: { title: "Audio failed", message: "Record again." },
    empty_transcription: { title: "No text found", message: "Check your volume." },
    provider_unavailable: { title: "No connection", message: "Check your network." },
    transcription_failed: { title: "Failed", message: "Try again." },
  },
  es: {
    groq_api_key_missing: { title: "API key faltante", message: "Ingresa tu clave de Groq API en Configuración." },
    transcription_timeout: { title: "Tarda demasiado", message: "Intentalo de nuevo." },
    ctrl_v_send_failed: { title: "No se pudo pegar", message: "Copia si hace falta." },
    paste_target_not_selected: { title: "Revisa destino", message: "Selecciona un campo." },
    microphone_unavailable: { title: "Sin microfono", message: "Revisa permisos." },
    invalid_audio: { title: "Audio no valido", message: "Graba de nuevo." },
    empty_transcription: { title: "Sin texto", message: "Revisa el volumen." },
    provider_unavailable: { title: "Sin conexion", message: "Revisa la red." },
    transcription_failed: { title: "Fallo", message: "Intentalo de nuevo." },
  },
};
