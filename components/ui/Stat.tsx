import clsx from "clsx";
import type { ReactNode } from "react";

export interface StatProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "positive" | "negative" | "warning";
}

const toneClass: Record<NonNullable<StatProps["tone"]>, string> = {
  default: "text-zinc-100",
  positive: "text-emerald-400",
  negative: "text-rose-400",
  warning: "text-amber-400",
};

export function Stat({ label, value, hint, tone = "default" }: StatProps) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-5 py-4">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className={clsx("mt-1 text-2xl font-semibold tabular-nums", toneClass[tone])}>
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-zinc-400">{hint}</div>}
    </div>
  );
}
