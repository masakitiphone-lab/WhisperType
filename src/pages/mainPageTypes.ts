export type PromoRpcRow = {
  status: string;
  message: string;
  reward_credits: number | null;
  remaining_credits: number | null;
};

export type PromoResult = { kind: "success" | "error"; title: string; message: string } | null;

export type PlanKey = "free" | "plus";

export type RecentHistoryItem = {
  id: string;
  transcribed_text: string;
  created_at: string;
  credits_used: number;
};

export const NAV_ITEMS = [
  { id: "home", label: { en: "Home", ja: "ホーム" } },
  { id: "history", label: { en: "History", ja: "履歴" } },
  { id: "settings", label: { en: "Settings", ja: "設定" } },
  { id: "plan", label: { en: "Plan", ja: "プラン" } },
] as const;

export type MainPageSectionId = (typeof NAV_ITEMS)[number]["id"];

export const GLASS_CARD =
  "rounded-[30px] border border-white/40 bg-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/6 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_70px_rgba(0,0,0,0.34)]";

export const GLASS_PANEL =
  "rounded-[24px] border border-white/35 bg-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.78),0_12px_28px_rgba(15,23,42,0.06)] backdrop-blur-2xl transition-all duration-200 ease-out dark:border-white/10 dark:bg-white/6";
