"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Stat } from "@/components/ui/Stat";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EquityCurveChart } from "@/components/charts/EquityCurveChart";
import { DrawdownChart } from "@/components/charts/DrawdownChart";
import { PnLBarChart } from "@/components/charts/PnLBarChart";
import { useDashboard } from "@/lib/providers/DashboardProvider";
import {
  formatPct,
  formatSignedPct,
  formatUsd,
} from "@/lib/format";

export default function PerformancePage() {
  const { snapshot } = useDashboard();
  const { performance, equityCurve, trades } = snapshot;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance"
        description="Return, risk and trade quality metrics for RUN-3."
      />

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Equity" value={formatUsd(performance.currentEquityUsd)} />
        <Stat
          label="Total return"
          value={formatSignedPct(performance.totalReturnPct)}
          tone={performance.totalReturnPct >= 0 ? "positive" : "negative"}
        />
        <Stat
          label="CAGR"
          value={formatSignedPct(performance.cagrPct)}
          tone={performance.cagrPct >= 0 ? "positive" : "negative"}
        />
        <Stat
          label="Max DD"
          value={formatPct(performance.maxDrawdownPct)}
          tone="negative"
        />
        <Stat label="Sharpe" value={performance.sharpe.toFixed(2)} />
        <Stat label="Sortino" value={performance.sortino.toFixed(2)} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Win rate" value={formatPct(performance.winRatePct, 1)} />
        <Stat
          label="Profit factor"
          value={performance.profitFactor.toFixed(2)}
        />
        <Stat
          label="Best trade"
          value={formatSignedPct(performance.bestTradePct)}
          tone="positive"
        />
        <Stat
          label="Worst trade"
          value={formatSignedPct(performance.worstTradePct)}
          tone="negative"
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
