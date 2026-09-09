"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Segmented";
import { UNAVAILABLE, formatOptionalNumber, formatOptionalSignedPct } from "@/lib/format";
import type {
  CostScaleKey,
  ParameterGrid,
  ParameterMetricKey,
} from "@/lib/research/schema";
import { Unavailable } from "./Unavailable";

const METRIC_OPTIONS = ["Sharpe", "CAGR", "Profit factor"] as const;
type MetricOption = (typeof METRIC_OPTIONS)[number];

const METRIC_KEY: Record<MetricOption, ParameterMetricKey> = {
  Sharpe: "sharpe",
  CAGR: "cagrPct",
  "Profit factor": "profitFactor",
};

const COST_OPTIONS = ["1x", "2x"] as const;
type CostOption = (typeof COST_OPTIONS)[number];

const COST_KEY: Record<CostOption, CostScaleKey> = { "1x": "x1", "2x": "x2" };

function formatCell(key: ParameterMetricKey, value: number | null): string {
  if (value === null) return UNAVAILABLE;
  return key === "cagrPct"
    ? formatOptionalSignedPct(value)
    : formatOptionalNumber(value, 3);
}

/**
 * Parameter stability — a map, not a leaderboard.
 *
 * The only cell this panel is allowed to single out is the preregistered
 * baseline. Highlighting the best-scoring cell is how a stability read turns
 * into a parameter search: the eye goes to the winner, the winner becomes the
 * proposal, and the region — the actual finding — disappears.
 *
 * Shading is therefore a single low-contrast hue keyed to the value's rank
 * within the grid, not a diverging scale with a hot spot. A flat sheet of
 * near-identical tiles means the neighbourhood is stable; one bright tile
 * surrounded by dark ones means the result lives at a point, which is the
 * failure this panel exists to expose.
 */
export function ParameterStability({
  grid,
  unavailableReason,
}: {
  grid: ParameterGrid | null;
  unavailableReason: string | null;
}) {
  const [metric, setMetric] = useState<MetricOption>("Sharpe");
  const [cost, setCost] = useState<CostOption>("1x");

  const metricKey = METRIC_KEY[metric];
  const costKey = COST_KEY[cost];

  const cellValue = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const cell of grid?.cells ?? []) {
      map.set(
        `${cell.rowValue}:${cell.colValue}`,
        cell.values[costKey]?.[metricKey] ?? null
      );
    }
    return map;
  }, [grid, costKey, metricKey]);

  const range = useMemo(() => {
    const values = [...cellValue.values()].filter(
      (v): v is number => v !== null
    );
    if (values.length === 0) return null;
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [cellValue]);

  return (
    <Card>
      <CardHeader
        title="Parameter Stability"
        subtitle="Read the neighbourhood, not the maximum. Only the preregistered baseline is marked."
        right={
          grid === null ? undefined : (
            <div className="flex flex-wrap items-center gap-2">
              <Segmented
                options={METRIC_OPTIONS}
                value={metric}
                onChange={setMetric}
                label="Grid metric"
              />
              <Segmented
                options={COST_OPTIONS}
                value={cost}
                onChange={setCost}
                label="Cost scale"
              />
            </div>
          )
        }
      />
      <CardBody className="space-y-3">
        {grid === null ? (
          <Unavailable reason={unavailableReason} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[28rem] border-separate border-spacing-1 text-sm">
                <caption className="sr-only">
                  {`${metric} by ${grid.rowLabel} and ${grid.colLabel} at ${cost} execution costs`}
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className="eyebrow w-32 px-2 text-left">
                      {grid.rowLabel} \ {grid.colLabel}
                    </th>
                    {grid.colValues.map((col) => (
                      <th
                        key={col}
                        scope="col"
                        className="eyebrow px-2 text-center"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {grid.rowValues.map((row) => (
                    <tr key={row}>
                      <th
                        scope="row"
                        className="num px-2 text-left text-xs font-medium text-muted"
                      >
                        {row}
                      </th>
                      {grid.colValues.map((col) => {
                        const key = `${row}:${col}`;
                        const value = cellValue.get(key) ?? null;
                        const isBaseline = Boolean(
                          grid.cells.find(
                            (c) => c.rowValue === row && c.colValue === col
                          )?.isBaseline
                        );
                        const intensity =
                          value === null || range === null
                            ? 0
                            : range.max === range.min
                              ? 0.5
                              : (value - range.min) / (range.max - range.min);
                        return (
                          <td key={col} className="p-0">
                            <div
                              className={clsx(
                                "relative flex h-16 flex-col items-center justify-center rounded-lg border px-2",
                                value === null
                                  ? "border-dashed border-line bg-surface/40"
                                  : "border-line bg-raised/40",
                                isBaseline && "border-accent/60"
                              )}
                              style={
                                value === null
                                  ? undefined
                                  : {
                                      background: `color-mix(in oklab, var(--color-accent) ${(
                                        8 +
                                        intensity * 22
                                      ).toFixed(1)}%, var(--color-surface))`,
                                    }
                              }
                            >
                              {isBaseline && (
                                <span className="eyebrow absolute left-1.5 top-1.5 rounded border border-accent/40 bg-overlay px-1 text-[9px] leading-4 text-accent">
                                  Baseline
                                </span>
                              )}
                              <span
                                className={clsx(
                                  "num text-sm font-medium",
                                  value === null ? "text-faint" : "text-ink"
                                )}
                              >
                                {formatCell(metricKey, value)}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="rounded-card border border-line bg-surface/50 px-4 py-3 text-xs leading-relaxed text-muted">
              <span className="eyebrow mr-2">Source</span>
              {grid.source.label} — {grid.source.scope}
              {grid.source.caveat && (
                <span className="mt-1.5 block border-l-2 border-warn/40 pl-3">
                  {grid.source.caveat}
                </span>
              )}
            </p>
          </>
        )}
      </CardBody>
    </Card>
  );
}
