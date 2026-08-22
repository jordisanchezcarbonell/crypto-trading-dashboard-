"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { EquityCurveChart } from "@/components/charts/EquityCurveChart";
import { DecisionsTimeline } from "@/components/tables/DecisionsTimeline";
import { PositionsTable } from "@/components/tables/PositionsTable";
import { useDashboard } from "@/lib/providers/DashboardProvider";
import {
  formatPct,
  formatSignedPct,
  formatSignedUsd,
  formatUsd,
} from "@/lib/format";

export default function OverviewPage() {
  const { snapshot, source } = useDashboard();
  const {
    performance,
    equityCurve,
    positions,
    decisions,
  } = snapshot;

  const unrealized = positions.reduce((s, p) => s + p.unrealizedPnlUsd, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description={`Snapshot of ${snapshot.runId} — read via ${source === "supabase" ? "Supabase" : "local mock"} (read-only).`}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Equity"
          value={formatUsd(performance.currentEquityUsd)}
          hint={`Starting capital ${formatUsd(performance.startingCapitalUsd)}`}
        />
        <Stat
          label="Total return"
          value={formatSignedPct(performance.totalReturnPct)}
          tone={performance.totalReturnPct >= 0 ? "positive" : "negative"}
          hint={`CAGR ${formatSignedPct(performance.cagrPct)}`}
        />
        <Stat
          label="Max drawdown"
          value={formatPct(performance.maxDrawdownPct)}
          tone="negative"
          hint={`Sharpe ${performance.sharpe.toFixed(2)} · Sortino ${performance.sortino.toFixed(2)}`}
        />
        <Stat
          label="Open uPnL"
          value={formatSignedUsd(unrealized)}
          tone={unrealized >= 0 ? "positive" : "negative"}
          hint={`${positions.length} open positions`}
        />
      </div>

      <Card>
        <CardHeader
          title="Equity curve"
          subtitle={`${equityCurve.length} daily points`}
        />
        <CardBody>
          <EquityCurveChart points={equityCurve} height={280} />
        </CardBody>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card>
            <CardHeader title="Open positions" />
            <CardBody className="px-0 py-0">
              <PositionsTable positions={positions} />
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
