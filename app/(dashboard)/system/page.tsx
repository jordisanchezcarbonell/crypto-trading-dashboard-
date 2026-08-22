"use client";

import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatusDot } from "@/components/ui/StatusDot";
import { useDashboard } from "@/lib/providers/DashboardProvider";
import { formatDateTime, formatRelative } from "@/lib/format";

const STATUS_TONE = {
  ok: "success",
  degraded: "warning",
  down: "danger",
} as const;

export default function SystemPage() {
  const { snapshot, source } = useDashboard();
  const { health, runId, mode, readOnly } = snapshot;

  return (
    <div className="space-y-6">
      <PageHeader
        title="System"
        description="Health of the trading lab components feeding this dashboard."
      />

      <Card>
        <CardHeader title="Run" />
        <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <Field label="Run ID" value={runId} />
          <Field label="Mode" value={mode.toUpperCase()} />
          <Field label="Read-only" value={readOnly ? "yes" : "no"} />
          <Field label="Data source" value={source} />
          <Field
            label="Last sync"
            value={
              <span suppressHydrationWarning>
                {formatDateTime(health.lastSync)} ({formatRelative(health.lastSync)})
              </span>
            }
          />
          <Field
            label="Next processing"
            value={
              <span suppressHydrationWarning>
                {formatDateTime(health.nextProcessing)} ({formatRelative(health.nextProcessing)})
              </span>
            }
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Components"
          right={
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <StatusDot status={health.overall} />
              <span>Overall {health.overall}</span>
            </div>
          }
        />
        <CardBody className="space-y-2">
          {health.components.map((c) => (
            <div
              key={c.name}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800/60 bg-zinc-950/40 px-4 py-3 text-sm"
            >
              <div className="flex items-center gap-3">
                <StatusDot status={c.status} />
                <span className="font-medium text-zinc-100">{c.name}</span>
                <Badge tone={STATUS_TONE[c.status]}>
                  {c.status.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-zinc-400">
                {c.detail && <span>{c.detail}</span>}
                {typeof c.latencyMs === "number" && (
                  <span className="font-mono">{c.latencyMs} ms</span>
                )}
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-zinc-100">{value}</div>
    </div>
  );
}
