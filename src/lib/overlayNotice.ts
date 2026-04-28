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
};

export function classifyOverlayError(errorMessage: string): OverlayNoticePayload {
  const normalized = errorMessage.toLowerCase();

  if (normalized.includes("ctrl_v_send_failed")) return { kind: "error", code: "ctrl_v_send_failed" };
  if (normalized.includes("paste_target_not_selected")) return { kind: "error", code: "paste_target_not_selected" };
  if (normalized.includes("no active session") || normalized.includes("auth required")) return { kind: "error", code: "auth_required" };
  if (normalized.includes("credit")) return { kind: "error", code: "insufficient_credits" };
  if (normalized.includes("invalid_audio")) return { kind: "error", code: "invalid_audio" };
  if (normalized.includes("profile_unavailable")) return { kind: "error", code: "profile_unavailable" };
  if (normalized.includes("provider_unavailable")) return { kind: "error", code: "provider_unavailable" };
  if (normalized.includes("history_store_failed")) return { kind: "error", code: "history_store_failed" };

  return { kind: "error", code: "transcription_failed" };
}

export function buildOverlayNotice(locale: AppLocale, payload: OverlayNoticePayload): OverlayNoticeViewModel {
  const openLabel = locale === "ja" ? "アプリを開く" : locale === "es" ? "Abrir app" : "Open app";
  const closeLabel = locale === "ja" ? "閉じる" : locale === "es" ? "Cerrar" : "Close";
  const copyLabel = locale === "ja" ? "コピー" : locale === "es" ? "Copiar" : "Copy";

  if (payload.kind === "manual_copy") {
    const isPasteCommandFailure = payload.code === "ctrl_v_send_failed";
    const isPasteTargetMissing = payload.code === "paste_target_not_selected";

    return locale === "ja"
      ? {
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
              ? "現在の入力先が選択されていないため、自動貼り付けを完了できませんでした。入力欄を選んでから、下の文章を必要に応じて手動で貼り付けてください。"
              : "自動貼り付けを完了できませんでした。下の文章をコピーして手動で貼り付けてください。",
          text: payload.text ?? "",
          openLabel,
          closeLabel,
          copyLabel,
        }
      : locale === "es"
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
              : isPasteTargetMissing
                ? "La ventana activa es la app, no un campo de texto. Selecciona el destino y vuelve a intentar el pegado."
                : "No había un campo de texto seleccionado, así que el pegado automático no pudo completarse. Copia el texto de abajo y pégalo manualmente.",
            text: payload.text ?? "",
            openLabel,
            closeLabel,
            copyLabel,
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
              : isPasteTargetMissing
                ? "The active window is this app, so no text field was selected. Choose the destination field and try again."
                : "No input field was selected, so automatic paste could not finish. Copy the transcript below and paste it manually.",
            text: payload.text ?? "",
            openLabel,
            closeLabel,
            copyLabel,
          };
  }

  const errorCopy =
    payload.code === "auth_required"
      ? locale === "ja"
        ? ["サインインが必要です", "文字起こしを行う前に WhisperType にサインインしてください。"]
        : locale === "es"
          ? ["Necesitas iniciar sesión", "Debes iniciar sesión en WhisperType antes de transcribir."]
          : ["Sign-in required", "You need to sign in to WhisperType before transcribing."]
      : payload.code === "insufficient_credits"
        ? locale === "ja"
          ? ["クレジットが足りません", "現在のプランではこの文字起こしを完了できません。アプリでプランと残高を確認してください。"]
          : locale === "es"
            ? ["No tienes créditos suficientes", "No hay saldo suficiente para transcribir. Revisa tu plan y tus créditos en la app."]
            : ["Insufficient credits", "There are not enough credits to complete this transcription. Review your plan and balance in the app."]
        : payload.code === "ctrl_v_send_failed"
          ? locale === "ja"
            ? ["貼り付けを送信できませんでした", "Ctrl+V の送信に失敗しました。状態を確認したい場合はアプリを開いてください。"]
            : locale === "es"
              ? ["No se pudo enviar el pegado", "Falló el envío de Ctrl+V. Abre la app si necesitas revisar el estado."]
              : ["Paste command could not be sent", "Sending Ctrl+V failed. Open the app if you need to review the current state."]
          : payload.code === "paste_target_not_selected"
            ? locale === "ja"
              ? ["貼り付け先が選択されていません", "現在の入力先が選択されていないため、自動貼り付けを開始できませんでした。入力欄を選んでからもう一度試してください。"]
              : locale === "es"
                ? ["No estaba seleccionado el campo de pegado", "La ventana activa es la app, no un campo de texto. Selecciona el destino y vuelve a intentarlo."]
                : ["Paste target was not selected", "The active window is this app, so no text field was selected. Choose the destination field and try again."]
          : payload.code === "microphone_unavailable"
            ? locale === "ja"
              ? ["マイクを使用できませんでした", "マイクの権限と現在の入力デバイスを確認してください。"]
              : locale === "es"
                ? ["No se pudo usar el micrófono", "Revisa el permiso del micrófono y el estado del dispositivo de entrada."]
                : ["Microphone unavailable", "Check microphone permissions and the current input device."]
            : locale === "ja"
              ? ["文字起こしに失敗しました", "処理中に問題が発生しました。必要ならアプリを開いて状態を確認してください。"]
              : locale === "es"
                ? ["No se pudo completar la transcripción", "Se produjo un problema durante el proceso. Abre la app si necesitas revisar el estado."]
                : ["Transcription could not be completed", "Something interrupted the request. Open the app if you need to review the current state."];

  return {
    kind: "error",
    badgeLabel: locale === "ja" ? "通知" : locale === "es" ? "Aviso" : "Notice",
    title: errorCopy[0],
    message: errorCopy[1],
    openLabel,
    closeLabel,
  };
}
