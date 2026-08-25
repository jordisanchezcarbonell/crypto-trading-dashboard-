"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Segmented";
import type { ResearchStrategyResult } from "@/lib/research/schema";
import { ResearchEquityChart, type EquityView } from "./ResearchEquityChart";
import { Unavailable } from "./Unavailable";

const VIEWS = ["equity", "drawdown"] as const;

export function EquityPanel({
  strategy,
}: {
  strategy: ResearchStrategyResult;
}) {
  const [view, setView] = useState<EquityView>("equity");
  const points = strategy.equity;

  return (
    <Card>
      <CardHeader
        title="Equity Curve"
        subtitle="Indexed to 100 at the first bar of the research window"
        right={
          <div className="flex flex-wrap items-center gap-2">
            {/* Stated on the panel itself, not only in the page header: this
                chart is the one element a reader screenshots, and it must
                carry its own segment label when it travels. */}
            <Badge tone="muted" className="tracking-wider">
              HISTORICAL RESEARCH
            </Badge>
            <Segmented
              options={VIEWS}
              value={view}
              onChange={(next) => setView(next as EquityView)}
              label="Equity view"
            />
          </div>
        }
      />
      <CardBody>
        {points === null || points.length === 0 ? (
          <Unavailable reason={strategy.equityUnavailableReason} />
        ) : (
          <ResearchEquityChart points={points} view={view} height={320} />
        )}
      </CardBody>
    </Card>
  );
}
