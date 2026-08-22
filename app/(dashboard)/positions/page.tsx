"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Stat } from "@/components/ui/Stat";
import { PositionsTable } from "@/components/tables/PositionsTable";
import { useDashboard } from "@/lib/providers/DashboardProvider";
import { formatSignedUsd, formatUsd } from "@/lib/format";

export default function PositionsPage() {
  const { snapshot } = useDashboard();
  const { positions } = snapshot;

  const longs = positions.filter((p) => p.side === "long");
  const shorts = positions.filter((p) => p.side === "short");
  const grossExposure = positions.reduce(
    (s, p) => s + Math.abs(p.notionalUsd),
    0
  );
  const unrealized = positions.reduce((s, p) => s + p.unrealizedPnlUsd, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Positions"
        description={`${positions.length} open · ${longs.length} long / ${shorts.length} short`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Gross exposure" value={formatUsd(grossExposure)} />
        <Stat
          label="Unrealized PnL"
          value={formatSignedUsd(unrealized)}
          tone={unrealized >= 0 ? "positive" : "negative"}
        />
        <Stat label="Positions" value={positions.length.toString()} />
      </div>

      <PositionsTable positions={positions} />
    </div>
  );
}
