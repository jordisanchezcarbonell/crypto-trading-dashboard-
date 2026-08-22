import clsx from "clsx";
import type { ReactNode } from "react";

export interface Metric {
  label: string;
  value: ReactNode;
  tone?: "default" | "positive" | "negative" | "neutral";
}

const toneClass = {
  default: "text-ink",
  positive: "text-pos",
  negative: "text-neg",
  neutral: "text-faint",
} as const;

/**
 * Secondary metrics, presented as a strip rather than as more cards.
 *
 * These are the numbers a reader consults rather than scans — Sharpe,
 * Sortino, win rate. They were previously smuggled into the `hint` line of
 * an unrelated stat, where `truncate` could silently cut them off; giving
 * each its own card instead would have restored the flat, entry-point-less
 * grid this layout is trying to escape.
 *
 * A strip solves both: every metric is fully legible and individually
 * labelled, while the horizontal, low-contrast treatment reads as
 * subordinate to the hero figure by construction.
 *
 * Rendered as a description list so the label/value pairing survives for a
 * screen reader, which a row of visually-adjacent divs would not convey.
 */
export function MetricStrip({
  metrics,
  className,
}: {
  metrics: Metric[];
  className?: string;
}) {
  return (
    <dl
      className={clsx(
        "flex flex-wrap items-center gap-x-6 gap-y-3 rounded-card border border-line bg-surface/50 px-5 py-3",
        className
      )}
    >
      {metrics.map((m) => (
        <div key={m.label} className="flex items-baseline gap-2">
          <dt className="eyebrow">{m.label}</dt>
          <dd
            className={clsx(
              "num text-sm font-medium",
              toneClass[m.tone ?? "default"]
            )}
          >
            {m.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
