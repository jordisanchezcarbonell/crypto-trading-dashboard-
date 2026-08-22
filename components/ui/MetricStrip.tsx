import clsx from "clsx";
import type { ReactNode } from "react";
import { UNAVAILABLE } from "@/lib/format";

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
 *
 * When every metric is unknown the strip renders `emptyHint` instead. A run
 * with no closed trades has no Sharpe, no Sortino, no win rate and no profit
 * factor, and six em dashes in a row is a full-width band that says nothing
 * six times — worse than silence, because the reader has to check each one
 * to learn that. One sentence explaining *when* the numbers arrive is the
 * same pixels spent on actual information.
 */
export function MetricStrip({
  metrics,
  emptyHint,
  className,
}: {
  metrics: Metric[];
  /** Shown in place of the metrics when every value is unavailable. */
  emptyHint?: ReactNode;
  className?: string;
}) {
  const allUnavailable =
    metrics.length > 0 && metrics.every((m) => m.value === UNAVAILABLE);

  if (emptyHint && allUnavailable) {
    return (
      <p
        className={clsx(
          "rounded-card border border-line bg-surface/50 px-5 py-3 text-xs text-muted",
          className
        )}
      >
        {emptyHint}
      </p>
    );
  }

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
