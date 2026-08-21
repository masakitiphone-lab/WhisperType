import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Copy, Trash2, Trash, Download, History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GLASS_CARD, GLASS_PANEL } from "@/pages/mainPageTypes";
import type { AppLocale } from "@/lib/appLocale";
import {
  clearTranscriptionHistory,
  deleteTranscriptionHistoryEntry,
  formatHistoryDate,
  getTranscriptionHistory,
  type TranscriptionHistoryEntry,
} from "@/lib/transcriptionHistory";

export function MainPageHistorySection({ appLocale }: { appLocale: AppLocale }) {
  const [entries, setEntries] = useState<TranscriptionHistoryEntry[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refresh = async () => {
    const data = await getTranscriptionHistory();
    setEntries(data);
  };

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 3000);
    const onFocus = () => void refresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const handleCopy = async (entry: TranscriptionHistoryEntry) => {
    try {
      await navigator.clipboard.writeText(entry.text);
    } catch {
      await invoke("type_text", { text: entry.text, useClipboardPaste: true }).catch(() => {});
      try {
        await navigator.clipboard.writeText(entry.text);
      } catch {}
    }
    setCopiedId(entry.id);
    window.setTimeout(() => setCopiedId((v) => (v === entry.id ? null : v)), 1500);
  };

  const handleDelete = async (id: string) => {
    const next = await deleteTranscriptionHistoryEntry(id);
    setEntries(next);
  };

  const handleClear = async () => {
    if (!confirm(appLocale === "ja" ? "履歴をすべて削除しますか？" : appLocale === "es" ? "¿Borrar todo el historial?" : "Clear all history?")) return;
    const next = await clearTranscriptionHistory();
    setEntries(next);
  };

  const handleExport = () => {
    if (entries.length === 0) return;
    const lines = entries
      .slice()
      .reverse()
      .map((e) => `[${new Date(e.createdAtMs || e.createdAt).toLocaleString()}] ${e.text}`)
      .join("\n\n");
    const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whispertype-history-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyAll = async () => {
    const all = entries.map((e) => e.text).join("\n");
    if (!all) return;
    try {
      await navigator.clipboard.writeText(all);
      setCopiedId("__all__");
      window.setTimeout(() => setCopiedId((v) => (v === "__all__" ? null : v)), 1500);
    } catch {}
  };

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center gap-3">
        <History className="h-5 w-5 text-slate-600 dark:text-slate-200" />
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {appLocale === "ja" ? "文字起こし履歴" : appLocale === "es" ? "Historial" : "Transcription History"}
        </p>
        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs text-white dark:bg-white dark:text-slate-900">{entries.length}</span>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={entries.length === 0} onClick={handleCopyAll}>
            <Copy className="mr-1 h-3.5 w-3.5" />
            {copiedId === "__all__" ? (appLocale === "ja" ? "コピー済み" : "Copied") : appLocale === "ja" ? "すべてコピー" : "Copy all"}
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={entries.length === 0} onClick={handleExport}>
            <Download className="mr-1 h-3.5 w-3.5" />
            {appLocale === "ja" ? "テキスト出力" : "Export .txt"}
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={entries.length === 0} onClick={handleClear}>
            <Trash className="mr-1 h-3.5 w-3.5" />
            {appLocale === "ja" ? "全削除" : "Clear"}
          </Button>
        </div>
      </div>
      <Card className={GLASS_CARD}>
        <CardContent className="pt-6">
          {entries.length === 0 ? (
            <div className={GLASS_PANEL + " p-6 text-center"}>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {appLocale === "ja" ? "まだ履歴がありません。文字起こしを行うとここに保存されます。" : appLocale === "es" ? "Aún no hay historial. Aparecerá aquí después de transcribir." : "No history yet. Transcriptions will appear here."}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                {appLocale === "ja" ? "テキストはこのPCのアプリデータに保存され、アプリ内でいつでも参照できます。" : "Saved as text on this PC. View anytime in the app."}
              </p>
            </div>
          ) : (
            <div className="max-h-[420px] space-y-3 overflow-auto pr-1">
              {entries.map((entry) => (
                <div key={entry.id} className={GLASS_PANEL + " p-4"}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-400">
                      {formatHistoryDate(entry, appLocale)} · {entry.language} · {entry.model === "whisper-large-v3" ? "full" : "turbo"}
                    </span>
                    <div className="flex gap-1">
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={() => void handleCopy(entry)}>
                        <Copy className="h-3.5 w-3.5" />
                        <span className="ml-1 text-xs">{copiedId === entry.id ? (appLocale === "ja" ? "コピー済み" : "Copied") : appLocale === "ja" ? "コピー" : "Copy"}</span>
                      </Button>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-red-500 hover:text-red-600" onClick={() => void handleDelete(entry.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800 dark:text-slate-100">{entry.text}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
