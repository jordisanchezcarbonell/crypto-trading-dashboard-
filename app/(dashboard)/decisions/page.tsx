"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import { DecisionsTimeline } from "@/components/tables/DecisionsTimeline";
import { useDashboard } from "@/lib/providers/DashboardProvider";

type Filter = "all" | "executed" | "skipped";

export default function DecisionsPage() {
  const { snapshot } = useDashboard();
  const [filter, setFilter] = useState<Filter>("all");

  const decisions = useMemo(() => {
    if (filter === "executed") {
      return snapshot.decisions.filter((d) => d.executed);
    }
    if (filter === "skipped") {
      return snapshot.decisions.filter((d) => !d.executed);
    }
    return snapshot.decisions;
  }, [snapshot.decisions, filter]);

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        title="Agent decisions"
        description={`${decisions.length} of ${snapshot.decisions.length} decisions`}
        right={
          <Segmented
            label="Filter decisions"
            options={["all", "executed", "skipped"] as const}
            value={filter}
            onChange={setFilter}
          />
        }
      />

      <DecisionsTimeline decisions={decisions} />
    </div>
  );
}
