"use client";

import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatusDot } from "@/components/ui/StatusDot";
import { useDashboard } from "@/lib/providers/DashboardProvider";
import {
  UNAVAILABLE,
  formatDateTime,
  formatDuration,
  formatRelative,
} from "@/lib/format";
import {
  computeProcessingStatus,
  processingTone,
  type ProcessingStatus,
} from "@/lib/domain/processing";

const STATUS_TONE = {
  ok: "success",
  degraded: "warning",
  down: "danger",
} as const;

export default function SystemPage() {
  const { snapshot, source } = useDashboard();
  const { health, freshness, runId, mode, readOnly } = snapshot;
  // Recomputed on render rather than memoised: "overdue" is a function of
  // wall-clock time, and a memo keyed on the snapshot would keep reporting
  // "due in 2 min" long after the deadline passed.
  const processing = computeProcessingStatus(health);

  return (
    <div className="animate-rise space-y-6">
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
          {/* Exporter freshness — how recently the replica was written. This
              is `generated_at`, and it is the ONLY field that answers "is
              this page's data current?". It is a different question from
              the runner's cadence below, which the old "Last sync" label
              conflated with it. */}
          <Field
            label="Data exported"
            value={
              <span suppressHydrationWarning>
                {freshness.generatedAt == null
                  ? UNAVAILABLE
                  : `${formatDateTime(freshness.generatedAt)} (${formatRelative(freshness.generatedAt)})`}
              </span>
            }
          />
          <Field
            label="Last processing"
            value={
              <span suppressHydrationWarning>
                {processing.lastProcessingAt == null
                  ? UNAVAILABLE
                  : `${formatDateTime(processing.lastProcessingAt)} (${formatRelative(processing.lastProcessingAt)})`}
              </span>
            }
          />
          <Field
            label="Next processing"
            value={<NextProcessing status={processing} />}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Components"
          right={
            <div className="flex items-center gap-2 rounded-md border border-line bg-raised px-2 py-1 text-xs text-muted">
              <StatusDot status={health.overall} />
              <span className="capitalize">Overall {health.overall}</span>
            </div>
          }
        />
        <CardBody className="space-y-2">
          {health.components.map((c) => (
            <div
              key={c.name}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-base/50 px-4 py-3 text-sm transition-colors hover:border-edge"
            >
              <div className="flex items-center gap-3">
                <StatusDot status={c.status} />
                <span className="font-medium text-ink">{c.name}</span>
                <Badge tone={STATUS_TONE[c.status]}>
                  {c.status.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted">
                {c.detail && <span>{c.detail}</span>}
                {typeof c.latencyMs === "number" && (
                  <span className="num rounded border border-line bg-raised px-1.5 py-0.5 text-ink">
                    {c.latencyMs} ms
                  </span>
                )}
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}

/**
 * Renders the cadence without ever hiding a miss.
 *
 * An overdue runner is shown as overdue — we never advance the deadline to
 * the next future slot to make the countdown look healthy, because a
 * deadline in the past is exactly the evidence that a bar went unprocessed.
 */
function NextProcessing({ status }: { status: ProcessingStatus }) {
  if (status.state === "unknown") {
    return (
      <span className="text-zinc-400">
        {UNAVAILABLE}{" "}
        <span className="text-xs text-zinc-500">
          (exporter reported no next bar)
        </span>
      </span>
    );
  }

  const tone = processingTone(status);
  return (
    <span suppressHydrationWarning>
      {formatDateTime(status.nextProcessing!)}{" "}
      {status.state === "overdue" ? (
        <Badge tone={tone} className="ml-1 align-middle text-[10px]">
          {formatDuration(status.deltaSeconds!)} OVERDUE
        </Badge>
      ) : (
        <span className="text-xs text-zinc-500">
          (in {formatDuration(status.deltaSeconds!)})
        </span>
      )}
    </span>
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
      <div className="eyebrow">{label}</div>
      <div className="num mt-1 text-ink">{value}</div>
    </div>
  );
}
