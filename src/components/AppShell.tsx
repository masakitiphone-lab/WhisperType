import type { ReactNode } from "react";
import type { AppLocale } from "@/lib/appLocale";

export function AppShell({ appLocale, children }: { appLocale: AppLocale; children: ReactNode }) {
  return <div className="relative h-screen overflow-hidden bg-[#fafafa] text-slate-900 dark:bg-[#0f1115] dark:text-slate-50">
    <main className="relative h-screen overflow-y-auto px-8 py-7"><div className="mx-auto max-w-5xl">
      <header className="mb-8 flex items-center justify-between"><div><p className="text-sm font-semibold">WhisperType</p><p className="text-xs text-slate-500">{appLocale === "ja" ? "ローカル設定" : "Local setup"}</p></div></header>
      {children}
    </div></main>
  </div>;
}
