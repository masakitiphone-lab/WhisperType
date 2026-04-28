import { cloneElement, createContext, isValidElement, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type DropdownMenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  contentStyle: React.CSSProperties;
  mounted: boolean;
};

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [contentStyle, setContentStyle] = useState<React.CSSProperties>({});

  useLayoutEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.max(rect.width, 256);
      const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
      setContentStyle({
        position: "fixed",
        top: rect.bottom + 10,
        left,
        width,
      });
    };

    updatePosition();
    setMounted(true);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (open) return;
    const id = window.setTimeout(() => setMounted(false), 140);
    return () => window.clearTimeout(id);
  }, [open]);

  const value = useMemo(() => ({ open, setOpen, triggerRef, contentRef, contentStyle, mounted }), [open, contentStyle, mounted]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if ((target as Element | null)?.closest?.("[data-dropdown-content='true']")) return;
      setOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <DropdownMenuContext.Provider value={value}>
      <div className="relative isolate inline-block w-full">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

function DropdownMenuTrigger({
  children,
  asChild = false,
}: {
  children: ReactNode;
  asChild?: boolean;
}) {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx) throw new Error("DropdownMenuTrigger must be used within DropdownMenu");

  if (asChild && isValidElement(children)) {
    return cloneElement(children, {
      ref: ctx.triggerRef,
      onClick: () => ctx.setOpen(!ctx.open),
      "aria-expanded": ctx.open,
    } as never);
  }

  return (
    <button
      type="button"
      ref={ctx.triggerRef}
      onClick={() => ctx.setOpen(!ctx.open)}
      aria-expanded={ctx.open}
      className="contents"
    >
      {children}
    </button>
  );
}

function DropdownMenuContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx) throw new Error("DropdownMenuContent must be used within DropdownMenu");
  if (!ctx.mounted) return null;

  return createPortal(
    <div
      ref={ctx.contentRef}
      data-dropdown-content="true"
      style={ctx.contentStyle}
      className={cn(
        "z-[2147483647] overflow-hidden rounded-[22px] border border-white/40 bg-white/96 p-2 shadow-[0_28px_70px_rgba(15,23,42,0.22)] backdrop-blur-2xl transition-all duration-150 ease-out dark:border-white/10 dark:bg-[#14161a]/96",
        ctx.open ? "scale-100 opacity-100" : "pointer-events-none scale-[0.98] opacity-0",
        className,
      )}
    >
      {children}
    </div>,
    document.body,
  );
}

function DropdownMenuItem({
  children,
  onSelect,
  className = "",
}: {
  children: ReactNode;
  onSelect: () => void;
  className?: string;
}) {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx) throw new Error("DropdownMenuItem must be used within DropdownMenu");

  return (
    <button
      type="button"
      onClick={() => {
        onSelect();
        ctx.setOpen(false);
      }}
      className={cn(
        "flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm text-slate-700 transition-all duration-150 ease-out hover:-translate-y-[1px] hover:bg-black/[0.05] active:translate-y-0 dark:text-slate-200 dark:hover:bg-white/[0.06]",
        className,
      )}
    >
      {children}
    </button>
  );
}

export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger };
