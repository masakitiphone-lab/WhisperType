import type { AppLocale } from "@/lib/appLocale";

type AuthFlowCopy = {
  preparing: string;
  openingBrowser: string;
  waitingForBrowser: string;
  exchangingCode: string;
  signInComplete: string;
  callbackMissingCode: string;
  callbackFailed: string;
  openBrowserFailed: string;
  exchangeFailed: string;
  pkceFailed: string;
  signOutFailed: string;
};

export function getAuthFlowCopy(locale: AppLocale): AuthFlowCopy {
  if (locale === "ja") {
    return {
      preparing: "ログインを準備しています...",
      openingBrowser: "ブラウザで Google ログインを開いています...",
      waitingForBrowser: "ブラウザでログインを完了してください...",
      exchangingCode: "ログインを完了しています...",
      signInComplete: "ログインが完了しました。",
      callbackMissingCode: "ログインを確認できませんでした。もう一度お試しください。",
      callbackFailed: "ブラウザ側のログインを確認できませんでした。もう一度お試しください。",
      openBrowserFailed: "Google ログインを開始できませんでした。",
      exchangeFailed: "ログインを完了できませんでした。もう一度お試しください。",
      pkceFailed: "ログイン確認に失敗しました。アプリを開いたまま、もう一度お試しください。",
      signOutFailed: "ログアウトできませんでした。もう一度お試しください。",
    };
  }

  if (locale === "es") {
    return {
      preparing: "Preparando el inicio de sesión...",
      openingBrowser: "Abriendo Google en el navegador...",
      waitingForBrowser: "Completa el inicio de sesión en el navegador...",
      exchangingCode: "Finalizando el acceso...",
      signInComplete: "Inicio de sesión completado.",
      callbackMissingCode: "No se pudo confirmar el inicio de sesión. Inténtalo de nuevo.",
      callbackFailed: "No se pudo confirmar el acceso desde el navegador. Inténtalo de nuevo.",
      openBrowserFailed: "No se pudo iniciar el acceso con Google.",
      exchangeFailed: "No se pudo completar el inicio de sesión. Inténtalo de nuevo.",
      pkceFailed: "No se pudo verificar el acceso. Deja la app abierta e inténtalo de nuevo.",
      signOutFailed: "No se pudo cerrar la sesión. Inténtalo de nuevo.",
    };
  }

  return {
    preparing: "Preparing sign-in...",
    openingBrowser: "Opening Google sign-in in your browser...",
    waitingForBrowser: "Complete sign-in in your browser...",
    exchangingCode: "Finishing sign-in...",
    signInComplete: "Sign-in complete.",
    callbackMissingCode: "Sign-in could not be confirmed. Please try again.",
    callbackFailed: "The browser sign-in could not be confirmed. Please try again.",
    openBrowserFailed: "Google sign-in could not be started.",
    exchangeFailed: "Sign-in could not be completed. Please try again.",
    pkceFailed: "The sign-in confirmation could not be verified. Keep the app open and try again.",
    signOutFailed: "Sign-out could not be completed. Please try again.",
  };
}
