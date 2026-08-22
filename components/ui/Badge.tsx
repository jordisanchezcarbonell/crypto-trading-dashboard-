import clsx from "clsx";
import type { ReactNode } from "react";

export type BadgeTone =
  | "neutral"
  | "info"
  | "warning"
  | "success"
  | "danger"
  | "muted";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "border-zinc-700 bg-zinc-800/60 text-zinc-200",
  info: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  danger: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  muted: "border-zinc-800 bg-zinc-900/60 text-zinc-400",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
