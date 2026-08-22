"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { HeroStat } from "@/components/ui/HeroStat";
import { MetricStrip, type Metric } from "@/components/ui/MetricStrip";
import { Stat } from "@/components/ui/Stat";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EquityCurveChart } from "@/components/charts/EquityCurveChart";
import { Sparkline } from "@/components/charts/Sparkline";
import { DrawdownChart } from "@/components/charts/DrawdownChart";
import { PnLBarChart } from "@/components/charts/PnLBarChart";
import { useDashboard } from "@/lib/providers/DashboardProvider";
import { describeSeries } from "@/lib/domain/series";
import {
  formatOptionalNumber,
  formatOptionalPct,
  formatOptionalSignedPct,
  formatUsd,
} from "@/lib/format";

export default function PerformancePage() {
  const { snapshot } = useDashboard();
  const { performance, equityCurve, trades } = snapshot;

  // Risk ratios and the trade distribution: consulted, not scanned.
  const qualityMetrics: Metric[] = [
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
      label: "Profit factor",
      value: formatOptionalNumber(performance.profitFactor),
      tone: performance.profitFactor == null ? "neutral" : "default",
    },
    {
      label: "Avg trade",
      value: formatOptionalSignedPct(performance.avgTradePct),
      tone:
        performance.avgTradePct == null
          ? "neutral"
          : performance.avgTradePct >= 0
            ? "positive"
            : "negative",
    },
    {
      label: "Best",
      value: formatOptionalSignedPct(performance.bestTradePct),
      tone: performance.bestTradePct == null ? "neutral" : "positive",
    },
    {
      label: "Worst",
      value: formatOptionalSignedPct(performance.worstTradePct),
      tone: performance.worstTradePct == null ? "neutral" : "negative",
    },
  ];

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        title="Performance"
        description="Return, risk and trade quality metrics for RUN-3."
      />

      {/* The weight used to run backwards here: Equity and Total return sat
          in `size="sm"` while Best trade got the full-size treatment, so the
          page shouted loudest about its least important number. Return leads
          — it is what a performance page is for — then risk, then the trade
          distribution as a strip. */}
      <div className="grid gap-4 lg:grid-cols-4">
        <HeroStat
          className="lg:col-span-2"
          label="Total return"
          value={formatOptionalSignedPct(performance.totalReturnPct)}
          delta={
            performance.cagrPct == null
              ? undefined
              : `${formatOptionalSignedPct(performance.cagrPct)} CAGR`
          }
          deltaTone={
            performance.cagrPct == null
              ? "neutral"
              : performance.cagrPct >= 0
                ? "positive"
                : "negative"
          }
          caption={`${formatUsd(performance.currentEquityUsd)} equity now`}
          aside={
            <Sparkline
              values={equityCurve.map((p) => p.equityUsd)}
              tone={
                performance.totalReturnPct == null
                  ? "accent"
                  : performance.totalReturnPct >= 0
                    ? "positive"
                    : "negative"
              }
              className="h-14 w-full max-w-[280px]"
            />
          }
        />
        <Stat
          size="sm"
          label="Max drawdown"
          value={formatOptionalPct(performance.maxDrawdownPct)}
          tone={performance.maxDrawdownPct == null ? "neutral" : "negative"}
          hint="Peak-to-trough, whole run"
        />
        <Stat
          size="sm"
          label="Win rate"
          value={formatOptionalPct(performance.winRatePct, 1)}
          hint={`${performance.totalTrades} closed trades`}
        />
      </div>

      <MetricStrip
        metrics={qualityMetrics}
        emptyHint="Trade quality metrics — risk ratios and the per-trade distribution — are computed from closed trades. They appear once this run closes its first position."
      />

      <Card>
        <CardHeader title="Equity curve" subtitle={describeSeries(equityCurve)} />
        <CardBody>
          <EquityCurveChart points={equityCurve} height={300} />
        </CardBody>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Drawdown" />
          <CardBody>
            <DrawdownChart points={equityCurve} height={240} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="PnL per trade" />
          <CardBody>
            <PnLBarChart trades={trades} height={240} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
