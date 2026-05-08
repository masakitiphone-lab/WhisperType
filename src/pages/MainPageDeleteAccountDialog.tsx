import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

type DeleteAccountCopy = {
  title: string;
  description: string;
  confirm: string;
  cancel: string;
};

type MainPageDeleteAccountDialogProps = {
  copy: DeleteAccountCopy;
  error: string | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function MainPageDeleteAccountDialog({
  copy,
  error,
  isDeleting,
  onCancel,
  onConfirm,
}: MainPageDeleteAccountDialogProps) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 px-4 backdrop-blur-[3px]">
      <div className="w-full max-w-md rounded-[28px] border border-black/8 bg-white/96 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[#121316]/96">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
          <TriangleAlert className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{copy.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{copy.description}</p>
        {error ? <p className="mt-3 text-sm leading-6 text-rose-600 dark:text-rose-300">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isDeleting} className="rounded-2xl">
            {copy.cancel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-2xl bg-rose-600 text-white hover:bg-rose-700"
          >
            {isDeleting ? `${copy.confirm}...` : copy.confirm}
          </Button>
        </div>
      </div>
    </div>
  );
}
