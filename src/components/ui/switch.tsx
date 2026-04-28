import type { ButtonHTMLAttributes } from "react";

type SwitchProps = {
  checked: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type">;

export function Switch({ checked, className = "", ...props }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={[
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border p-[2px] transition-all duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:focus-visible:ring-white/20",
        className,
      ].join(" ")}
      style={{
        backgroundColor: checked ? "#000000" : "#ffffff",
        borderColor: checked ? "#000000" : "#94a3b8",
      }}
      {...props}
    >
      <span
        className={[
          "pointer-events-none block h-5 w-5 rounded-full transition-transform duration-200 ease-out",
          checked ? "translate-x-5" : "translate-x-0",
        ].join(" ")}
        style={{ backgroundColor: checked ? "#ffffff" : "#e2e8f0" }}
      />
    </button>
  );
}
