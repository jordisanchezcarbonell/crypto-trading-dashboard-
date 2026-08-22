"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { CompareChart } from "@/components/charts/CompareChart";
import { useDashboard } from "@/lib/providers/DashboardProvider";
import { formatSignedPct } from "@/lib/format";

export default function ComparePage() {
  const { snapshot } = useDashboard();
  const { comparisons } = snapshot;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compare"
        description="RUN-3 vs baselines (indexed to 100 at start)."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {comparisons.map((s) => {
          const first = s.points[0]?.valueIndexed ?? 100;
          const last = s.points[s.points.length - 1]?.valueIndexed ?? first;
          const change = ((last - first) / first) * 100;
          return (
            <Stat
              key={s.label}
              label={s.label}
              value={last.toFixed(2)}
              hint={formatSignedPct(change)}
              tone={change >= 0 ? "positive" : "negative"}
            />
          );
        })}
      </div>

      <Card>
        <CardHeader
          title="Indexed equity curves"
          subtitle="Base = 100 at RUN-3 start"
        />
        <CardBody>
          <CompareChart series={comparisons} height={340} />
        </CardBody>
      </Card>
    </div>
  );
}
