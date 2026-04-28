"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowEffect?: boolean;
  children: React.ReactNode;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, glowEffect = true, children, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative isolate overflow-hidden flex flex-col items-stretch",
          "border border-white/22 bg-white/10 backdrop-blur-[22px]",
          "shadow-[0_16px_34px_rgba(0,0,0,0.20),0_6px_14px_rgba(0,0,0,0.10),inset_0_1px_0_rgba(255,255,255,0.58),inset_0_-1px_0_rgba(255,255,255,0.05)]",
          "transition-[transform,box-shadow,filter] duration-200 ease-out will-change-transform",
          className,
        )}
        style={{
          borderRadius: "inherit",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.18) 14%, rgba(255,255,255,0.10) 48%, rgba(255,255,255,0.05) 100%)",
          boxShadow:
            "0 16px 34px rgba(0,0,0,0.20), 0 6px 14px rgba(0,0,0,0.10), 0 0 0 1px rgba(255,255,255,0.16), inset 0 1px 0 rgba(255,255,255,0.58), inset 0 -1px 0 rgba(255,255,255,0.05)",
          ...style,
        }}
        {...props}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 16% 10%, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.52) 10%, rgba(255,255,255,0.16) 24%, transparent 56%), linear-gradient(145deg, rgba(255,255,255,0.52) 0%, rgba(255,255,255,0.18) 18%, rgba(255,255,255,0.00) 46%)",
            mixBlendMode: "screen",
            opacity: 1,
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.00) 28%, rgba(120,200,255,0.14) 68%, rgba(255,255,255,0.08) 100%)",
            mixBlendMode: "soft-light",
            opacity: 1,
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.48) 0%, rgba(255,255,255,0.30) 12%, rgba(255,255,255,0.10) 24%, transparent 44%)",
            mixBlendMode: "screen",
            opacity: 1,
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 52% 8%, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.52) 8%, rgba(255,255,255,0.10) 22%, transparent 42%)",
            mixBlendMode: "screen",
            opacity: 0.92,
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.00) 54%, rgba(255,255,255,0.12) 100%)",
            opacity: 0.9,
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(115deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, rgba(255,255,255,0.00) 3px, rgba(255,255,255,0.00) 7px)",
            mixBlendMode: "overlay",
            opacity: 0.58,
            filter: "blur(0.35px)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.00) 55%)",
            mixBlendMode: "soft-light",
            opacity: 0.92,
          }}
        />
        {glowEffect ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-8"
            style={{
              background:
                "radial-gradient(circle at 50% 0%, rgba(170,226,255,0.50) 0%, rgba(120,206,255,0.24) 18%, rgba(110,192,255,0.08) 34%, transparent 72%)",
              filter: "blur(20px)",
              opacity: 0.92,
            }}
          />
        ) : null}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.64), inset 0 -12px 26px rgba(0,0,0,0.10), inset 0 0 0 1px rgba(255,255,255,0.09), inset 0 12px 20px rgba(255,255,255,0.08)",
          }}
        />
        <div className="relative z-[1] w-full h-full">{children}</div>
      </div>
    );
  },
);
GlassCard.displayName = "GlassCard";

const GlassCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />,
);
GlassCardHeader.displayName = "GlassCardHeader";

const GlassCardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-xl font-semibold text-white leading-none tracking-tight", className)} {...props} />
  ),
);
GlassCardTitle.displayName = "GlassCardTitle";

const GlassCardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <p ref={ref} className={cn("text-sm text-white/60", className)} {...props} />,
);
GlassCardDescription.displayName = "GlassCardDescription";

const GlassCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
GlassCardContent.displayName = "GlassCardContent";

const GlassCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />,
);
GlassCardFooter.displayName = "GlassCardFooter";

export { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent, GlassCardFooter };
