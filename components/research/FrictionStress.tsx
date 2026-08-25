"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CHART,
  ChartFrame,
  ChartTooltip,
  axisProps,
  gridProps,
} from "@/components/charts/chart-theme";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import {
  formatOptionalNumber,
  formatOptionalPct,
  formatOptionalSignedPct,
  formatPct,
} from "@/lib/format";
import type { FrictionScenario } from "@/lib/research/schema";
import { Unavailable } from "./Unavailable";

/**
 * Execution cost stress.
 *
 * Fee, spread and slippage are scaled together — separating them would
 * suggest a precision the model does not have, and a candidate that only
 * survives at the exact frictions we happened to assume is the thing this
 * panel is looking for.
 *
 * CAGR and max drawdown share one axis because they share one unit and,
 * more importantly, because the reader must see them move together: an edge
 * that thins while the drawdown holds is a different finding from one where
 * both deteriorate.
 */
export function FrictionStress({
  scenarios,
  unavailableReason,
}: {
  scenarios: FrictionScenario[] | null;
  unavailableReason: string | null;
}) {
  const measured =
    scenarios?.filter(
      (s) => s.cagrPct !== null || s.maxDrawdownPct !== null
    ) ?? [];

  return (
    <Card>
      <CardHeader
        title="Execution Cost Stress"
        subtitle="Fee, spread and slippage scaled together — 1.0x is the protocol baseline"
      />
      <CardBody className="space-y-4">
        {scenarios === null || scenarios.length === 0 ? (
          <Unavailable reason={unavailableReason} />
        ) : (
          <>
            {measured.length > 0 && (
              <ChartFrame height={220}>
                <ResponsiveContainer>
                  <BarChart
                    data={scenarios.map((s) => ({
                      label: s.label,
                      cagr: s.cagrPct,
                      maxDd: s.maxDrawdownPct,
                    }))}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    barGap={4}
                  >
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="label" {...axisProps} />
                    <YAxis
                      tickFormatter={(v) => `${Number(v).toFixed(0)}%`}
                      width={52}
                      {...axisProps}
                    />
                    <ReferenceLine y={0} stroke={CHART.grid} />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.03)" }}
                      content={
                        <ChartTooltip
                          valueFormatter={(value) => formatPct(value)}
                        />
                      }
                    />
                    <Legend
                      iconType="square"
                      iconSize={10}
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                      formatter={(value) => (
                        <span className="text-muted">{String(value)}</span>
                      )}
                    />
                    <Bar
                      dataKey="cagr"
                      name="CAGR"
                      fill={CHART.accent}
                      fillOpacity={0.75}
                      radius={[3, 3, 0, 0]}
                    />
                    <Bar
                      dataKey="maxDd"
                      name="Max Drawdown"
                      fill={CHART.neg}
                      fillOpacity={0.7}
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartFrame>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              {scenarios.map((scenario) => (
                <div
                  key={scenario.scale}
                  className="rounded-card border border-line bg-raised/40 px-4 py-3"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="num text-sm font-semibold text-ink">
                      {scenario.label}
                    </span>
                    <span className="eyebrow">
                      {scenario.scale === 1 ? "Baseline" : "Stressed"}
                    </span>
                  </div>
                  <dl className="mt-2 space-y-1 text-xs">
                    <Row
                      label="Return"
                      value={formatOptionalSignedPct(scenario.returnPct)}
                    />
                    <Row
                      label="CAGR"
                      value={formatOptionalSignedPct(scenario.cagrPct)}
                    />
                    <Row
                      label="Sharpe"
                      value={formatOptionalNumber(scenario.sharpe, 3)}
                    />
                    <Row
                      label="Max DD"
                      value={formatOptionalPct(scenario.maxDrawdownPct)}
                    />
                    <Row
                      label="Profit factor"
                      value={formatOptionalNumber(scenario.profitFactor, 3)}
                    />
                  </dl>
                </div>
              ))}
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="num font-medium text-ink">{value}</dd>
    </div>
  );
}
