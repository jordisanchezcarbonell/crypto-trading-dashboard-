import clsx from "clsx";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import {
  UNAVAILABLE,
  formatOptionalNumber,
  formatOptionalPct,
  formatOptionalSignedPct,
} from "@/lib/format";
import type {
  ResearchComparison,
  ResearchStrategyResult,
} from "@/lib/research/schema";
import { StateTag } from "./StateTag";

/**
 * Strategy comparison — a table with no podium.
 *
 * Rows follow the declared order, never a metric. Sorting by CAGR would
 * answer "which is best?", and that is not a question a research page should
 * make easy to ask: a candidate with a lower return and a low correlation to
 * the incumbents can be worth more to a portfolio than the top row.
 *
 * Correlation is shown against the strategy currently under study, because
 * that is the number that decides whether a candidate adds anything.
 */
function correlationBetween(
  comparison: ResearchComparison,
  a: string,
  b: string
): number | null {
  const found = comparison.correlations.find(
    (c) => (c.a === a && c.b === b) || (c.a === b && c.b === a)
  );
  return found?.value ?? null;
}

export function StrategyComparison({
  strategies,
  comparison,
  selectedId,
}: {
  strategies: ResearchStrategyResult[];
  comparison: ResearchComparison;
  selectedId: string;
}) {
  const rows = strategies.filter((s) =>
    comparison.strategyIds.includes(s.id)
  );
  const selectedLabel =
    strategies.find((s) => s.id === selectedId)?.label ?? selectedId;

  return (
    <Card>
      <CardHeader
        title="Strategy Comparison"
        subtitle="Declared order, not a ranking. Low correlation can matter more than a higher CAGR."
      />
      <CardBody className="space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[42rem] text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th scope="col" className="eyebrow py-2 pr-4">
                  Strategy
                </th>
                <th scope="col" className="eyebrow py-2 pr-4 text-right">
                  CAGR
                </th>
                <th scope="col" className="eyebrow py-2 pr-4 text-right">
                  Max DD
                </th>
                <th scope="col" className="eyebrow py-2 pr-4 text-right">
                  Sharpe
                </th>
                <th scope="col" className="eyebrow py-2 pr-4 text-right">
                  Corr vs {selectedLabel}
                </th>
                <th scope="col" className="eyebrow py-2">
                  State
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((strategy) => {
                const isSelected = strategy.id === selectedId;
                const correlation = isSelected
                  ? null
                  : correlationBetween(comparison, selectedId, strategy.id);
                return (
                  <tr
                    key={strategy.id}
                    className={clsx(
                      "border-b border-line/60 last:border-b-0",
                      isSelected && "bg-raised/40"
                    )}
                  >
                    <th
                      scope="row"
                      className="py-2.5 pr-4 text-left font-medium text-ink"
                    >
                      <span className="flex items-center gap-2">
                        {strategy.label}
                        {isSelected && (
                          <span className="eyebrow text-accent">Selected</span>
                        )}
                      </span>
                    </th>
                    <td className="num py-2.5 pr-4 text-right text-ink">
                      {formatOptionalSignedPct(strategy.metrics?.cagrPct ?? null)}
                    </td>
                    <td className="num py-2.5 pr-4 text-right text-ink">
                      {formatOptionalPct(strategy.metrics?.maxDrawdownPct ?? null)}
                    </td>
                    <td className="num py-2.5 pr-4 text-right text-ink">
                      {formatOptionalNumber(strategy.metrics?.sharpe ?? null, 3)}
                    </td>
                    <td className="num py-2.5 pr-4 text-right text-ink">
                      {isSelected ? (
                        <span className="text-faint">{UNAVAILABLE}</span>
                      ) : (
                        formatOptionalNumber(correlation, 2)
                      )}
                    </td>
                    <td className="py-2.5">
                      <span className="flex flex-wrap gap-1">
                        {strategy.states.map((tag) => (
                          <StateTag key={tag.state} state={tag.state} />
                        ))}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="rounded-card border border-line bg-surface/50 px-4 py-3 text-xs leading-relaxed text-muted">
          <span className="eyebrow mr-2">Correlation</span>
          {comparison.source.label} — {comparison.source.scope}
          {comparison.source.caveat && (
            <span className="mt-1.5 block border-l-2 border-warn/40 pl-3">
              {comparison.source.caveat}
            </span>
          )}
        </p>
      </CardBody>
    </Card>
  );
}
