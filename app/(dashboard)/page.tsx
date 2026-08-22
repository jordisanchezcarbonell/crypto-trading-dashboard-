"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { HeroStat } from "@/components/ui/HeroStat";
import { MetricStrip, type Metric } from "@/components/ui/MetricStrip";
import { Stat } from "@/components/ui/Stat";
import { EquityCurveChart } from "@/components/charts/EquityCurveChart";
import { DecisionsTimeline } from "@/components/tables/DecisionsTimeline";
import { PositionsTable } from "@/components/tables/PositionsTable";
import { useDashboard } from "@/lib/providers/DashboardProvider";
import {
  formatOptionalNumber,
  formatOptionalPct,
  formatOptionalSignedPct,
  formatOptionalUsd,
  formatSignedUsd,
  formatUsd,
} from "@/lib/format";

export default function OverviewPage() {
  const { snapshot } = useDashboard();
  const { performance, equityCurve, positions, decisions } = snapshot;

  const unrealized = positions.reduce((s, p) => s + p.unrealizedPnlUsd, 0);

  // Sharpe, Sortino and friends used to live inside the `hint` line of an
  // unrelated stat, where `truncate` could cut them mid-number. They are
  // consulted rather than scanned, so they belong in a strip: fully legible,
  // individually labelled, and visibly subordinate to the equity figure.
  const riskMetrics: Metric[] = [
    {
      label: "Sharpe",
      value: formatOptionalNumber(performance.sharpe),
      tone: performance.sharpe == null ? "neutral" : "default",
    },
    {
      label: "Sortino",
      value: formatOptionalNumber(performance.sortino),
      tone: performance.sortino == null ? "neutral" : "default",
    },
    {
      label: "Win rate",
      value: formatOptionalPct(performance.winRatePct, 0),
      tone: performance.winRatePct == null ? "neutral" : "default",
    },
    {
      label: "Profit factor",
      value: formatOptionalNumber(performance.profitFactor),
      tone: performance.profitFactor == null ? "neutral" : "default",
    },
    {
      label: "CAGR",
      value: formatOptionalSignedPct(performance.cagrPct),
      tone: performance.cagrPct == null ? "neutral" : "default",
    },
    { label: "Trades", value: performance.totalTrades },
  ];

  return (
    <div className="animate-rise space-y-6">
      {/* The run id, data source and read-only status are already stated by
          the three badges in the app header. Repeating them here as prose
          spends the most prominent line on the page saying nothing new, so
          this description reports the shape of the data instead. */}
      <PageHeader
        title="Overview"
        description={`${equityCurve.length} days of equity · ${performance.totalTrades} closed trades · ${positions.length} open`}
      />

      {/* One figure leads. Equity is what the reader came for; everything
          else on this row is context for it. */}
      <div className="grid gap-4 lg:grid-cols-4">
        <HeroStat
          className="lg:col-span-2"
          label="Equity"
          value={formatUsd(performance.currentEquityUsd)}
          delta={formatOptionalSignedPct(performance.totalReturnPct)}
          deltaTone={
            performance.totalReturnPct == null
              ? "neutral"
              : performance.totalReturnPct >= 0
                ? "positive"
                : "negative"
          }
          caption={`From ${formatOptionalUsd(performance.startingCapitalUsd)} starting capital`}
        />
        <Stat
          size="sm"
          label="Open uPnL"
          value={formatSignedUsd(unrealized)}
          tone={unrealized >= 0 ? "positive" : "negative"}
          hint={`${positions.length} open positions`}
        />
        <Stat
          size="sm"
          label="Max drawdown"
          value={formatOptionalPct(performance.maxDrawdownPct)}
          tone={performance.maxDrawdownPct == null ? "neutral" : "negative"}
          hint="Peak-to-trough, whole run"
        />
      </div>

      <MetricStrip metrics={riskMetrics} />

      <Card>
        <CardHeader
          title="Equity curve"
          subtitle={`${equityCurve.length} daily points`}
        />
        <CardBody>
          <EquityCurveChart points={equityCurve} height={280} />
        </CardBody>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card>
            <CardHeader title="Open positions" />
            {/* `frame={false}`: the table is already inside a Card, and its
                own chrome would stack a second hairline on the first. */}
            <CardBody className="px-0 py-0">
              <PositionsTable positions={positions} frame={false} />
            </CardBody>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader title="Latest decisions" />
            <CardBody>
              <DecisionsTimeline decisions={decisions.slice(0, 4)} />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
