import type { AppLocale } from "@/lib/appLocale";
import type { PlanKey } from "@/pages/mainPageTypes";

export type MainPagePlanMeta = Record<
  PlanKey,
  {
    title: string;
    price: string;
    features: readonly string[];
    notes: readonly string[];
  }
>;

export type DeleteAccountCopy = {
  title: string;
  description: string;
  open: string;
  confirm: string;
  cancel: string;
  error: string;
};

export function getMainPagePlanMeta(appLocale: AppLocale): MainPagePlanMeta {
  return {
    free: {
      title: appLocale === "ja" ? "フリー" : "Free",
      price: appLocale === "ja" ? "¥0" : "$0",
      features: appLocale === "ja" ? ["毎日 50 クレジット", "標準の文字起こし", "最近の履歴"] : ["50 daily credits", "Standard transcription", "Recent history"],
      notes: appLocale === "ja" ? ["毎日リセットされます", "まず試したい方向け"] : ["Resets every day", "Good for getting started"],
    },
    plus: {
      title: "WhisperType Plus",
      price: appLocale === "ja" ? "¥300" : "$3",
      features: appLocale === "ja" ? ["文字起こし無制限", "高速書き起こし", "優先サポート"] : ["Unlimited transcription", "Faster transcription", "Priority support"],
      notes: appLocale === "ja" ? ["月額 300 円", "いつでも解約できます"] : ["Billed monthly", "Cancel anytime"],
    },
  };
}

export function getMainPageLocaleLabel(appLocale: AppLocale) {
  if (appLocale === "ja") return "日本語";
  if (appLocale === "es") return "Español";
  return "English";
}

export function getDeleteAccountCopy(appLocale: AppLocale): DeleteAccountCopy {
  if (appLocale === "ja") {
    return {
      title: "アカウントデータを削除しますか？",
      description:
        "プロフィール、文字起こし履歴、利用回数データを削除してサインアウトします。この操作は元に戻せません。Microsoft Storeのサブスクリプションは別途Microsoft側で解約してください。",
      open: "アカウントデータを削除",
      confirm: "削除する",
      cancel: "キャンセル",
      error: "削除できませんでした。接続を確認してもう一度お試しください。",
    };
  }

  return {
    title: "Delete account data?",
    description:
      "This deletes your profile, transcription history, and usage data, then signs you out. This cannot be undone. Microsoft Store subscriptions must be cancelled separately in Microsoft.",
    open: "Delete account data",
    confirm: "Delete",
    cancel: "Cancel",
    error: "Could not delete account data. Check your connection and try again.",
  };
}
