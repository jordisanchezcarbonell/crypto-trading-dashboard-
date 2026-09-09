import clsx from "clsx";
import type { ReactNode } from "react";
import {
  UNAVAILABLE,
  formatOptionalNumber,
  formatOptionalPct,
  formatOptionalSignedPct,
} from "@/lib/format";
import type { ResearchMetrics } from "@/lib/research/schema";
import { Unavailable } from "./Unavailable";

/**
 * A research metric, rendered without applause.
 *
 * The operational dashboard colours a number by direction because there the
 * question is "are we up?". Here the question is "is this evidence?", and a
 * green +785% would answer a question nobody asked while making the -23%
 * beside it look like the small print. So every value is rendered in the same
 * ink, and the only colour on the row marks RISK: the drawdown card carries
 * the warn hairline that a gain would carry elsewhere.
 *
 * `derived` marks a value this dashboard reconstructed by arithmetic on
 * published numbers rather than one the source printed. It is a footnote, not
 * a disclaimer — but it must be visible on the number itself.
 */
export function ResearchMetricCard({
  label,
  value,
  hint,
  kind = "performance",
  derived = false,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  kind?: "performance" | "risk";
  derived?: boolean;
}) {
  const missing = value === UNAVAILABLE;

  return (
    <div className="relative overflow-hidden rounded-card border border-line bg-surface/70 px-4 py-3.5 transition-colors duration-200 hover:border-edge">
      <span
        aria-hidden="true"
        className={clsx(
          "absolute inset-x-0 top-0 h-px bg-linear-to-r to-transparent",
          kind === "risk" ? "from-warn/50" : "from-edge"
        )}
      />
      <div className="flex items-baseline justify-between gap-2">
        <span className="eyebrow truncate" title={label}>
          {label}
        </span>
        {kind === "risk" && (
          <span className="eyebrow shrink-0 text-warn/80">Risk</span>
        )}
      </div>
      <div
        className={clsx(
          "num mt-1.5 text-2xl font-semibold",
          missing ? "text-faint" : "text-ink"
        )}
      >
        {value}
        {derived && !missing && (
          <sup
            className="ml-1 cursor-help text-[10px] font-medium tracking-wide text-warn"
            title="Derived by this dashboard from published values — see the source note below."
          >
            D
          </sup>
        )}
      </div>
      {hint && <div className="mt-1 truncate text-xs text-muted">{hint}</div>}
    </div>
  );
}

const TURNOVER_HINT = "Annualised, portfolio level";

/** Formats a turnover multiple ("9.31x") or the unavailable glyph. */
function formatTurnover(value: number | null): string {
  return value === null ? UNAVAILABLE : `${value.toFixed(2)}x`;
}

export function MetricCardRow({
  metrics,
  unavailableReason,
}: {
  metrics: ResearchMetrics | null;
  unavailableReason: string;
}) {
  if (metrics === null) {
    return <Unavailable reason={unavailableReason} />;
  }

  const derived = new Set(metrics.source.derivedFields);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <ResearchMetricCard
        label="Total Return"
        value={formatOptionalSignedPct(metrics.totalReturnPct)}
        hint="Whole research window"
        derived={derived.has("totalReturnPct")}
      />
      <ResearchMetricCard
        label="CAGR"
        value={formatOptionalSignedPct(metrics.cagrPct)}
        hint="Compounded, annualised"
        derived={derived.has("cagrPct")}
      />
      <ResearchMetricCard
        label="Max Drawdown"
        kind="risk"
        value={formatOptionalPct(metrics.maxDrawdownPct)}
        hint="Peak to trough"
        derived={derived.has("maxDrawdownPct")}
      />
      <ResearchMetricCard
        label="Sharpe"
        value={formatOptionalNumber(metrics.sharpe, 3)}
        hint="2191.5 periods/year"
        derived={derived.has("sharpe")}
      />
      <ResearchMetricCard
        label="Profit Factor"
        value={formatOptionalNumber(metrics.profitFactor, 3)}
        hint="Gross win / gross loss"
        derived={derived.has("profitFactor")}
      />
      <ResearchMetricCard
        label="Turnover"
        kind="risk"
        value={formatTurnover(metrics.turnover)}
        hint={TURNOVER_HINT}
        derived={derived.has("turnover")}
      />
    </div>
  );
}

/**
 * The provenance line under the metric row.
 *
 * Rendered as prose rather than a tooltip because it is not an aside: it is
 * the difference between "the research engine measured this" and "we read it
 * off a phase-1.8 report with a different universe".
 */
export function MetricSourceNote({ metrics }: { metrics: ResearchMetrics }) {
  const { source } = metrics;
  return (
    <div className="rounded-card border border-line bg-surface/50 px-5 py-3 text-xs leading-relaxed text-muted">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="eyebrow">Source</span>
        <span className="text-ink">{source.label}</span>
        <span className="num text-faint">{source.ref}</span>
      </div>
      <p className="mt-1.5">
        <span className="eyebrow mr-2">Scope</span>
        {source.scope}
      </p>
      {source.caveat && (
        <p className="mt-1.5 border-l-2 border-warn/40 pl-3 text-muted">
          {source.caveat}
        </p>
      )}
    </div>
  );
}
