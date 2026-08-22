"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Stat } from "@/components/ui/Stat";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EquityCurveChart } from "@/components/charts/EquityCurveChart";
import { DrawdownChart } from "@/components/charts/DrawdownChart";
import { PnLBarChart } from "@/components/charts/PnLBarChart";
import { useDashboard } from "@/lib/providers/DashboardProvider";
import {
  formatOptionalNumber,
  formatOptionalPct,
  formatOptionalSignedPct,
  formatUsd,
} from "@/lib/format";

export default function PerformancePage() {
  const { snapshot } = useDashboard();
  const { performance, equityCurve, trades } = snapshot;

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        title="Performance"
        description="Return, risk and trade quality metrics for RUN-3."
      />

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Stat size="sm" label="Equity" value={formatUsd(performance.currentEquityUsd)} />
        <Stat
          size="sm"
          label="Total return"
          value={formatOptionalSignedPct(performance.totalReturnPct)}
          tone={
            performance.totalReturnPct == null
              ? "neutral"
              : performance.totalReturnPct >= 0
                ? "positive"
                : "negative"
          }
        />
        <Stat
          size="sm"
          label="CAGR"
          value={formatOptionalSignedPct(performance.cagrPct)}
          tone={
            performance.cagrPct == null
              ? "neutral"
              : performance.cagrPct >= 0
                ? "positive"
                : "negative"
          }
        />
        <Stat
          size="sm"
          label="Max DD"
          value={formatOptionalPct(performance.maxDrawdownPct)}
          tone={performance.maxDrawdownPct == null ? "neutral" : "negative"}
        />
        <Stat size="sm" label="Sharpe" value={formatOptionalNumber(performance.sharpe)} />
        <Stat size="sm" label="Sortino" value={formatOptionalNumber(performance.sortino)} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat
          label="Win rate"
          value={formatOptionalPct(performance.winRatePct, 1)}
        />
        <Stat
          label="Profit factor"
          value={formatOptionalNumber(performance.profitFactor)}
        />
        <Stat
          label="Best trade"
          value={formatOptionalSignedPct(performance.bestTradePct)}
          tone={performance.bestTradePct == null ? "neutral" : "positive"}
        />
        <Stat
          label="Worst trade"
          value={formatOptionalSignedPct(performance.worstTradePct)}
          tone={performance.worstTradePct == null ? "neutral" : "negative"}
        />
      </div>

      <Card>
        <CardHeader title="Equity curve" />
        <CardBody>
          <EquityCurveChart points={equityCurve} height={300} />
        </CardBody>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
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
