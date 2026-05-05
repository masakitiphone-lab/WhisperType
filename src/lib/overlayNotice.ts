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
  const openLabel = locale === "ja" ? "アプリを開く" : locale === "es" ? "Abrir app" : "Open app";
  const closeLabel = locale === "ja" ? "閉じる" : locale === "es" ? "Cerrar" : "Close";
  const copyLabel = locale === "ja" ? "コピー" : locale === "es" ? "Copiar" : "Copy";

  if (payload.kind === "manual_copy") {
    const isPasteCommandFailure = payload.code === "ctrl_v_send_failed";
    const isPasteTargetMissing = payload.code === "paste_target_not_selected";

    if (locale === "ja") {
      return {
        kind: "manual_copy",
        badgeLabel: "手動コピー",
        title: isPasteCommandFailure
          ? "貼り付けを完了できませんでした"
          : isPasteTargetMissing
            ? "貼り付け先が選択されていません"
            : "貼り付け先が見つかりませんでした",
        message: isPasteCommandFailure
          ? "Ctrl+V の送信に失敗しました。下の文章をコピーして手動で貼り付けてください。"
          : isPasteTargetMissing
            ? "入力欄が選択されていないため、自動貼り付けを完了できませんでした。"
            : "自動貼り付けを完了できませんでした。下の文章をコピーしてください。",
        text: payload.text ?? "",
        openLabel,
        closeLabel,
        copyLabel,
        width: 360,
        minHeight: 268,
        autoDismiss: false,
      };
    }

    return locale === "es"
      ? {
          kind: "manual_copy",
          badgeLabel: "Copia manual",
          title: isPasteCommandFailure
            ? "No se pudo completar el pegado"
            : isPasteTargetMissing
              ? "No estaba seleccionado el campo de pegado"
              : "No se encontró el campo de pegado",
          message: isPasteCommandFailure
            ? "Falló el envío de Ctrl+V. Copia el texto de abajo y pégalo manualmente."
            : "No había un campo de texto seleccionado, así que el pegado automático no pudo completarse.",
          text: payload.text ?? "",
          openLabel,
          closeLabel,
          copyLabel,
          width: 360,
          minHeight: 268,
          autoDismiss: false,
        }
      : {
          kind: "manual_copy",
          badgeLabel: "Manual copy",
          title: isPasteCommandFailure
            ? "Paste could not be completed"
            : isPasteTargetMissing
              ? "Paste target was not selected"
              : "Paste target was not available",
          message: isPasteCommandFailure
            ? "Sending Ctrl+V failed. Copy the transcript below and paste it manually."
            : "No input field was selected, so automatic paste could not finish.",
          text: payload.text ?? "",
          openLabel,
          closeLabel,
          copyLabel,
          width: 360,
          minHeight: 268,
          autoDismiss: false,
        };
  }

  const copy =
    payload.code === "auth_required"
      ? locale === "ja"
        ? ["サインインが必要です", "文字起こしを行う前に WhisperType にサインインしてください。"]
        : locale === "es"
          ? ["Necesitas iniciar sesión", "Debes iniciar sesión en WhisperType antes de transcribir."]
          : ["Sign-in required", "You need to sign in to WhisperType before transcribing."]
      : payload.code === "insufficient_credits"
        ? locale === "ja"
          ? ["クレジットが足りません", "現在のプランではこの文字起こしを完了できません。"]
          : locale === "es"
            ? ["No tienes créditos suficientes", "No hay saldo suficiente para transcribir."]
            : ["Insufficient credits", "There are not enough credits to complete this transcription."]
        : payload.code === "transcription_timeout"
          ? locale === "ja"
            ? ["文字起こしがタイムアウトしました", "通信または処理に時間がかかりすぎました。もう一度試してください。"]
            : locale === "es"
              ? ["La transcripción agotó el tiempo", "La solicitud tardó demasiado. Inténtalo de nuevo."]
              : ["Transcription timed out", "The request took too long. Try again."]
          : payload.code === "ctrl_v_send_failed"
            ? locale === "ja"
              ? ["貼り付けを送信できませんでした", "Ctrl+V の送信に失敗しました。"]
              : locale === "es"
                ? ["No se pudo enviar el pegado", "Falló el envío de Ctrl+V."]
                : ["Paste command could not be sent", "Sending Ctrl+V failed."]
            : payload.code === "paste_target_not_selected"
              ? locale === "ja"
                ? ["貼り付け先が選択されていません", "入力欄を選んでからもう一度試してください。"]
                : locale === "es"
                  ? ["No estaba seleccionado el campo de pegado", "Selecciona el destino y vuelve a intentarlo."]
                  : ["Paste target was not selected", "Choose the destination field and try again."]
              : payload.code === "microphone_unavailable"
                ? locale === "ja"
                  ? ["マイクを使用できませんでした", "マイクの権限と入力デバイスを確認してください。"]
                  : locale === "es"
                    ? ["No se pudo usar el micrófono", "Revisa el permiso del micrófono y el dispositivo de entrada."]
                    : ["Microphone unavailable", "Check microphone permissions and the input device."]
                : locale === "ja"
                  ? ["文字起こしに失敗しました", "下に表示されている理由を確認してください。"]
                  : locale === "es"
                    ? ["No se pudo completar la transcripción", "Revisa el motivo mostrado abajo."]
                    : ["Transcription could not be completed", "Review the reason shown below."];

  const detail = payload.detail?.trim()
    ? payload.detail.trim()
    : payload.kind === "error"
      ? `code: ${payload.code}`
      : undefined;

  return {
    kind: "error",
    badgeLabel: locale === "ja" ? "通知" : locale === "es" ? "Aviso" : "Notice",
    title: copy[0],
    message: copy[1],
    detail,
    openLabel,
    closeLabel,
    width: detail ? 360 : 340,
    minHeight: detail ? 236 : 176,
    autoDismiss: false,
  };
}
