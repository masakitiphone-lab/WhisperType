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
      badgeLabel: copy.badge,
      title: copy.title,
      message: copy.message,
      text: payload.text ?? "",
      openLabel: labels.open,
      closeLabel: labels.close,
      copyLabel: labels.copy,
      width: 360,
      minHeight: 268,
      autoDismiss: false,
    };
  }

  const copy = getErrorNotice(locale, payload.code);
  const detail = payload.detail?.trim()
    ? payload.detail.trim()
    : `code: ${payload.code}`;

  return {
    kind: "error",
    badgeLabel: labels.notice,
    title: copy.title,
    message: copy.message,
    detail,
    openLabel: labels.open,
    closeLabel: labels.close,
    width: detail ? 360 : 340,
    minHeight: detail ? 236 : 176,
    autoDismiss: false,
  };
}

function getOverlayLabels(locale: AppLocale) {
  if (locale === "ja") {
    return {
      notice: "通知",
      open: "アプリを開く",
      close: "閉じる",
      copy: "コピー",
    };
  }

  if (locale === "es") {
    return {
      notice: "Aviso",
      open: "Abrir app",
      close: "Cerrar",
      copy: "Copiar",
    };
  }

  return {
    notice: "Notice",
    open: "Open app",
    close: "Close",
    copy: "Copy",
  };
}

function getManualCopyNotice(locale: AppLocale, code: string) {
  const isPasteCommandFailure = code === "ctrl_v_send_failed";
  const isPasteTargetMissing = code === "paste_target_not_selected";

  if (locale === "ja") {
    return {
      badge: "手動コピー",
      title: isPasteCommandFailure
        ? "貼り付けを完了できませんでした"
        : isPasteTargetMissing
          ? "貼り付け先が選択されていません"
          : "貼り付け先が見つかりませんでした",
      message: isPasteCommandFailure
        ? "Ctrl+V の送信に失敗しました。下の文章をコピーして手動で貼り付けてください。"
        : "入力欄が選択されていないため、自動貼り付けを完了できませんでした。",
    };
  }

  if (locale === "es") {
    return {
      badge: "Copia manual",
      title: isPasteCommandFailure
        ? "No se pudo completar el pegado"
        : isPasteTargetMissing
          ? "No estaba seleccionado el campo de pegado"
          : "No se encontró el campo de pegado",
      message: isPasteCommandFailure
        ? "Falló el envío de Ctrl+V. Copia el texto de abajo y pégalo manualmente."
        : "No había un campo de texto seleccionado, así que el pegado automático no pudo completarse.",
    };
  }

  return {
    badge: "Manual copy",
    title: isPasteCommandFailure
      ? "Paste could not be completed"
      : isPasteTargetMissing
        ? "Paste target was not selected"
        : "Paste target was not available",
    message: isPasteCommandFailure
      ? "Sending Ctrl+V failed. Copy the transcript below and paste it manually."
      : "No input field was selected, so automatic paste could not finish.",
  };
}

function getErrorNotice(locale: AppLocale, code: string) {
  const copy = ERROR_COPY[locale] ?? ERROR_COPY.en;
  return copy[code] ?? copy.transcription_failed;
}

const ERROR_COPY: Record<AppLocale, Record<string, { title: string; message: string }>> = {
  ja: {
    auth_required: {
      title: "サインインが必要です",
      message: "文字起こしを行う前に WhisperType にサインインしてください。",
    },
    insufficient_credits: {
      title: "利用上限に達しました",
      message: "現在のプランではこの文字起こしを完了できません。",
    },
    usage_protection: {
      title: "一時的に利用できません",
      message: "しばらく待ってからもう一度お試しください。",
    },
    transcription_timeout: {
      title: "文字起こしがタイムアウトしました",
      message: "通信または処理に時間がかかりすぎました。もう一度お試しください。",
    },
    ctrl_v_send_failed: {
      title: "貼り付けを送信できませんでした",
      message: "Ctrl+V の送信に失敗しました。",
    },
    paste_target_not_selected: {
      title: "貼り付け先が選択されていません",
      message: "入力欄を選択してからもう一度お試しください。",
    },
    microphone_unavailable: {
      title: "マイクを使用できませんでした",
      message: "マイクの権限と入力デバイスを確認してください。",
    },
    invalid_audio: {
      title: "音声を処理できませんでした",
      message: "録音データが空か、対応していない形式です。",
    },
    empty_transcription: {
      title: "文字起こし結果が空でした",
      message: "音声は送信されましたが、文字起こし結果が返りませんでした。",
    },
    profile_unavailable: {
      title: "アカウント情報を確認できませんでした",
      message: "少し待ってからもう一度お試しください。",
    },
    provider_unavailable: {
      title: "文字起こしサービスを利用できません",
      message: "ネットワークまたはサービス側の状態を確認してください。",
    },
    history_store_failed: {
      title: "履歴を保存できませんでした",
      message: "文字起こし履歴の保存に失敗しました。",
    },
    transcription_failed: {
      title: "文字起こしに失敗しました",
      message: "下に表示されている理由を確認してください。",
    },
  },
  en: {
    auth_required: {
      title: "Sign-in required",
      message: "You need to sign in to WhisperType before transcribing.",
    },
    insufficient_credits: {
      title: "Usage limit reached",
      message: "Your current plan cannot complete this transcription.",
    },
    usage_protection: {
      title: "Temporarily unavailable",
      message: "Please wait a while and try again.",
    },
    transcription_timeout: {
      title: "Transcription timed out",
      message: "The request took too long. Try again.",
    },
    ctrl_v_send_failed: {
      title: "Paste command could not be sent",
      message: "Sending Ctrl+V failed.",
    },
    paste_target_not_selected: {
      title: "Paste target was not selected",
      message: "Choose the destination field and try again.",
    },
    microphone_unavailable: {
      title: "Microphone unavailable",
      message: "Check microphone permissions and the input device.",
    },
    invalid_audio: {
      title: "Audio could not be processed",
      message: "The recording was empty or not in a supported format.",
    },
    empty_transcription: {
      title: "No text was returned",
      message: "The audio was sent, but no transcription text came back.",
    },
    profile_unavailable: {
      title: "Account could not be checked",
      message: "Wait a moment and try again.",
    },
    provider_unavailable: {
      title: "Transcription service unavailable",
      message: "Check your network connection or the service status.",
    },
    history_store_failed: {
      title: "History could not be saved",
      message: "The transcription history update failed.",
    },
    transcription_failed: {
      title: "Transcription could not be completed",
      message: "Review the reason shown below.",
    },
  },
  es: {
    auth_required: {
      title: "Necesitas iniciar sesión",
      message: "Debes iniciar sesión en WhisperType antes de transcribir.",
    },
    insufficient_credits: {
      title: "Límite de uso alcanzado",
      message: "Tu plan actual no puede completar esta transcripción.",
    },
    usage_protection: {
      title: "No disponible temporalmente",
      message: "Espera un momento y vuelve a intentarlo.",
    },
    transcription_timeout: {
      title: "La transcripción agotó el tiempo",
      message: "La solicitud tardó demasiado. Inténtalo de nuevo.",
    },
    ctrl_v_send_failed: {
      title: "No se pudo enviar el pegado",
      message: "Falló el envío de Ctrl+V.",
    },
    paste_target_not_selected: {
      title: "No estaba seleccionado el campo de pegado",
      message: "Selecciona el destino y vuelve a intentarlo.",
    },
    microphone_unavailable: {
      title: "No se pudo usar el micrófono",
      message: "Revisa el permiso del micrófono y el dispositivo de entrada.",
    },
    invalid_audio: {
      title: "No se pudo procesar el audio",
      message: "La grabación estaba vacía o no tiene un formato compatible.",
    },
    empty_transcription: {
      title: "No se devolvió texto",
      message: "El audio se envió, pero no volvió texto de transcripción.",
    },
    profile_unavailable: {
      title: "No se pudo comprobar la cuenta",
      message: "Espera un momento y vuelve a intentarlo.",
    },
    provider_unavailable: {
      title: "Servicio de transcripción no disponible",
      message: "Revisa la conexión o el estado del servicio.",
    },
    history_store_failed: {
      title: "No se pudo guardar el historial",
      message: "Falló la actualización del historial de transcripción.",
    },
    transcription_failed: {
      title: "No se pudo completar la transcripción",
      message: "Revisa el motivo mostrado abajo.",
    },
  },
};
