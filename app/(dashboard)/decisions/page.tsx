"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
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
    <div className="space-y-6">
      <PageHeader
        title="Agent decisions"
        description={`${decisions.length} of ${snapshot.decisions.length} decisions`}
        right={
          <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/40 p-0.5 text-xs">
            {(["all", "executed", "skipped"] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={
                  filter === f
                    ? "rounded-md bg-zinc-800 px-3 py-1 font-medium text-zinc-100"
                    : "rounded-md px-3 py-1 text-zinc-400 hover:text-zinc-200"
                }
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        }
      />

      <DecisionsTimeline decisions={decisions} />
    </div>
  );
}
