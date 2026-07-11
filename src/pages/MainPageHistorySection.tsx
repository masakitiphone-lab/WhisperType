import type React from "react";
import { Copy, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GLASS_CARD, type RecentHistoryItem } from "@/pages/mainPageTypes";

type HistoryCopy = {
  recent: string;
  recentDescription: string;
  noRecent: string;
  noTextReturned: string;
  copy: string;
};

type Props = {
  copy: HistoryCopy;
  copiedHistoryId: string | null;
  historyLabel: string;
  recentHistory: RecentHistoryItem[];
  sectionAccent: React.ReactNode;
  sectionHeaderClass: string;
  sectionIconClass: string;
  sectionTitleClass: string;
  onCopyHistory: (item: RecentHistoryItem) => void;
  setSectionRef: (element: HTMLElement | null) => void;
};

export function MainPageHistorySection({
  copy,
  copiedHistoryId,
  historyLabel,
  recentHistory,
  sectionAccent,
  sectionHeaderClass,
  sectionIconClass,
  sectionTitleClass,
  onCopyHistory,
  setSectionRef,
}: Props) {
  return (
    <section ref={setSectionRef} id="history" className="scroll-mt-8">
      <div className="mb-3">
        <div className={sectionHeaderClass}>
          <History className={sectionIconClass} />
          <p className={sectionTitleClass}>{historyLabel}</p>
          {sectionAccent}
        </div>
      </div>
      <Card className={GLASS_CARD}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">{copy.recent}</CardTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400">{copy.recentDescription}</p>
        </CardHeader>
        <CardContent>
          {recentHistory.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-black/8 bg-white/55 px-4 py-5 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
              {copy.noRecent}
            </div>
          ) : (
            <div className="space-y-3">
              {recentHistory.map((item) => (
                <div key={item.id} className="rounded-[20px] border border-white/35 bg-white/70 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-start justify-between gap-4">
                    <p className="min-w-0 flex-1 text-sm leading-6 text-slate-700 dark:text-slate-200">
                      {item.transcribed_text || copy.noTextReturned}
                    </p>
                    <Button type="button" variant="ghost" size="sm" onClick={() => onCopyHistory(item)} className="h-8 shrink-0 rounded-full px-3 text-xs" disabled={!item.transcribed_text}>
                      <Copy className="h-3.5 w-3.5" />
                      {copiedHistoryId === item.id ? "Copied" : copy.copy}
                    </Button>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{new Date(item.created_at).toLocaleString()}</p>
                    <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:border-white/10 dark:bg-[#101114] dark:text-slate-300">
                      -{item.credits_used}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
