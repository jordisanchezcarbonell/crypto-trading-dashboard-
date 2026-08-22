"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import { Stat } from "@/components/ui/Stat";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { TradesTable } from "@/components/tables/TradesTable";
import { PnLBarChart } from "@/components/charts/PnLBarChart";
import { useDashboard } from "@/lib/providers/DashboardProvider";
import {
  formatPct,
  formatSignedPct,
  formatSignedUsd,
} from "@/lib/format";

type SideFilter = "all" | "long" | "short";

export default function TradesPage() {
  const { snapshot } = useDashboard();
  const { trades } = snapshot;
  const [side, setSide] = useState<SideFilter>("all");

  const filtered = useMemo(
    () => (side === "all" ? trades : trades.filter((t) => t.side === side)),
    [trades, side]
  );

  const wins = filtered.filter((t) => t.pnlUsd > 0);
  const netPnl = filtered.reduce((s, t) => s + t.pnlUsd, 0);
  const avgPct =
    filtered.length === 0
      ? 0
      : filtered.reduce((s, t) => s + t.pnlPct, 0) / filtered.length;
  const winRate =
    filtered.length === 0 ? 0 : (wins.length / filtered.length) * 100;

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        title="Closed trades"
        description={`${filtered.length} of ${trades.length} trades`}
        right={
          <Segmented
            label="Filter trades by side"
            options={["all", "long", "short"] as const}
            value={side}
            onChange={setSide}
          />
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Stat
          label="Net PnL"
          value={formatSignedUsd(netPnl)}
          tone={netPnl >= 0 ? "positive" : "negative"}
        />
        <Stat
          label="Avg return"
          value={formatSignedPct(avgPct)}
          tone={avgPct >= 0 ? "positive" : "negative"}
        />
        <Stat label="Win rate" value={formatPct(winRate, 1)} />
        <Stat label="Trades" value={filtered.length.toString()} />
      </div>

      <Card>
        <CardHeader title="PnL per trade" />
        <CardBody>
          <PnLBarChart trades={filtered} height={220} />
        </CardBody>
      </Card>

      <TradesTable trades={filtered} />
    </div>
  );
}
