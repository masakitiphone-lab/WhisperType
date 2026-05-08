import type { AppLocale } from "@/lib/appLocale";

export type OverlayNoticePayload = {
  kind: "error" | "manual_copy";
  code: string;
  detail?: string | null;
  text?: string | null;
};

export type OverlayNoticeViewModel = {
  kind: "error" | "manual_copy";
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

const NOTICE_WIDTH = 236;
const ERROR_HEIGHT = 118;
const MANUAL_COPY_HEIGHT = 154;

export function classifyOverlayError(errorMessage: string): OverlayNoticePayload {
  const normalized = errorMessage.toLowerCase();

  if (normalized.includes("ctrl_v_send_failed")) return { kind: "error", code: "ctrl_v_send_failed" };
  if (normalized.includes("paste_target_not_selected")) return { kind: "error", code: "paste_target_not_selected" };
  if (
    normalized.includes("no active session") ||
    normalized.includes("auth required") ||
    normalized.includes("auth_required") ||
    normalized.includes("refresh token") ||
    normalized.includes("jwt")
  ) return { kind: "error", code: "auth_required" };
  if (normalized.includes("daily_limit_exceeded")) return { kind: "error", code: "usage_protection" };
  if (normalized.includes("credit")) return { kind: "error", code: "insufficient_credits" };
  if (normalized.includes("invalid_audio")) return { kind: "error", code: "invalid_audio" };
  if (normalized.includes("empty_transcription")) return { kind: "error", code: "empty_transcription" };
  if (normalized.includes("profile_unavailable")) return { kind: "error", code: "profile_unavailable" };
  if (normalized.includes("provider_unavailable")) return { kind: "error", code: "provider_unavailable" };
  if (normalized.includes("history_store_failed")) return { kind: "error", code: "history_store_failed" };
  if (normalized.includes("transcription_timeout")) return { kind: "error", code: "transcription_timeout" };

  return { kind: "error", code: "transcription_failed" };
}

export function buildOverlayNotice(locale: AppLocale, payload: OverlayNoticePayload): OverlayNoticeViewModel {
  const labels = getOverlayLabels(locale);

  if (payload.kind === "manual_copy") {
    const copy = getManualCopyNotice(locale, payload.code);
    return {
      kind: "manual_copy",
      badgeLabel: labels.copyNeeded,
      title: copy.title,
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

  if (locale === "ja") {
    return {
      title: isPasteTargetMissing ? "入力先を確認してください" : "入力できなかった可能性があります",
      message: "必要なら下の文面をコピーしてください。",
    };
  }

  if (locale === "es") {
    return {
      title: isPasteTargetMissing ? "Revisa el destino" : "Puede que no se haya pegado",
      message: "Copia el texto de abajo si hace falta.",
    };
  }

  return {
    title: isPasteTargetMissing ? "Check the target" : "Paste may have failed",
    message: "Copy the text below if needed.",
  };
}

function getErrorNotice(locale: AppLocale, code: string): NoticeCopy {
  const copy = ERROR_COPY[locale] ?? ERROR_COPY.en;
  return copy[code] ?? copy.transcription_failed;
}

const ERROR_COPY: Record<AppLocale, Record<string, NoticeCopy>> = {
  ja: {
    auth_required: { title: "サインインが必要です", message: "アプリを開いてサインインしてください。" },
    insufficient_credits: { title: "利用上限です", message: "プランまたは残り回数を確認してください。" },
    usage_protection: { title: "一時的に利用できません", message: "少し待ってから再試行してください。" },
    transcription_timeout: { title: "時間がかかっています", message: "もう一度お試しください。" },
    ctrl_v_send_failed: { title: "貼り付けできませんでした", message: "必要なら手動でコピーしてください。" },
    paste_target_not_selected: { title: "入力先を確認してください", message: "入力欄を選んで再試行してください。" },
    microphone_unavailable: { title: "マイクを使えません", message: "権限と入力デバイスを確認してください。" },
    invalid_audio: { title: "音声を処理できません", message: "もう一度録音してください。" },
    empty_transcription: { title: "文字が見つかりません", message: "声量やマイクを確認してください。" },
    profile_unavailable: { title: "アカウント確認に失敗", message: "少し待ってから再試行してください。" },
    provider_unavailable: { title: "サービスに接続できません", message: "通信状況を確認してください。" },
    history_store_failed: { title: "履歴を保存できません", message: "文字起こしは完了しています。" },
    transcription_failed: { title: "文字起こしに失敗", message: "もう一度お試しください。" },
  },
  en: {
    auth_required: { title: "Sign in required", message: "Open the app and sign in." },
    insufficient_credits: { title: "Limit reached", message: "Check your plan or credits." },
    usage_protection: { title: "Temporarily unavailable", message: "Wait a moment and try again." },
    transcription_timeout: { title: "Taking too long", message: "Try again." },
    ctrl_v_send_failed: { title: "Paste failed", message: "Copy manually if needed." },
    paste_target_not_selected: { title: "Check the target", message: "Select an input field and retry." },
    microphone_unavailable: { title: "Microphone unavailable", message: "Check permissions and input device." },
    invalid_audio: { title: "Audio failed", message: "Record again." },
    empty_transcription: { title: "No text found", message: "Check volume or microphone." },
    profile_unavailable: { title: "Account check failed", message: "Wait a moment and retry." },
    provider_unavailable: { title: "Service unavailable", message: "Check your connection." },
    history_store_failed: { title: "History not saved", message: "Transcription completed." },
    transcription_failed: { title: "Transcription failed", message: "Try again." },
  },
  es: {
    auth_required: { title: "Inicia sesion", message: "Abre la app e inicia sesion." },
    insufficient_credits: { title: "Limite alcanzado", message: "Revisa tu plan o creditos." },
    usage_protection: { title: "No disponible", message: "Espera un momento e intentalo de nuevo." },
    transcription_timeout: { title: "Tarda demasiado", message: "Intentalo de nuevo." },
    ctrl_v_send_failed: { title: "No se pudo pegar", message: "Copia manualmente si hace falta." },
    paste_target_not_selected: { title: "Revisa el destino", message: "Selecciona un campo y reintenta." },
    microphone_unavailable: { title: "Microfono no disponible", message: "Revisa permisos y entrada." },
    invalid_audio: { title: "Audio no valido", message: "Graba de nuevo." },
    empty_transcription: { title: "No se encontro texto", message: "Revisa volumen o microfono." },
    profile_unavailable: { title: "Fallo la cuenta", message: "Espera un momento y reintenta." },
    provider_unavailable: { title: "Servicio no disponible", message: "Revisa tu conexion." },
    history_store_failed: { title: "Historial no guardado", message: "La transcripcion termino." },
    transcription_failed: { title: "Fallo la transcripcion", message: "Intentalo de nuevo." },
  },
};
