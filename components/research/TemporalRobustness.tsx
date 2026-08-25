import clsx from "clsx";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import {
  UNAVAILABLE,
  formatDateUtc,
  formatOptionalNumber,
  formatOptionalPct,
  formatOptionalSignedPct,
} from "@/lib/format";
import type { TemporalBlock } from "@/lib/research/schema";
import { Unavailable } from "./Unavailable";

/**
 * Temporal robustness — the panel whose job is to make decay visible.
 *
 * Three numbers in three cards hide a trend; three bars on one shared scale
 * do not. Each metric row is scaled to the largest magnitude across the
 * blocks, so a candidate that earned everything in B1 and nothing since shows
 * one long bar and two stubs, which is the finding.
 *
 * A block with no measurement renders an empty track rather than a zero-width
 * bar: absence and zero must not look alike.
 */
function blockScale(values: (number | null)[]): number {
  const magnitudes = values
    .filter((v): v is number => v !== null)
    .map((v) => Math.abs(v));
  return magnitudes.length === 0 ? 0 : Math.max(...magnitudes);
}

function MetricRow({
  label,
  blocks,
  values,
  format,
  tone,
}: {
  label: string;
  blocks: TemporalBlock[];
  values: (number | null)[];
  format: (value: number | null) => string;
  tone: "neutral" | "risk";
}) {
  const scale = blockScale(values);

  return (
    <div className="border-t border-line py-3 first:border-t-0 first:pt-0">
      <div className="eyebrow mb-2">{label}</div>
      <div className="grid gap-2 sm:grid-cols-3">
        {blocks.map((block, i) => {
          const value = values[i] ?? null;
          const width =
            value === null || scale === 0
              ? 0
              : Math.max(2, (Math.abs(value) / scale) * 100);
          return (
            <div key={block.id} className="min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="num text-[11px] font-medium text-faint">
                  {block.id}
                </span>
                <span
                  className={clsx(
                    "num text-sm font-medium",
                    value === null ? "text-faint" : "text-ink"
                  )}
                >
                  {format(value)}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-raised">
                <div
                  className={clsx(
                    "h-full rounded-full",
                    tone === "risk" ? "bg-warn/70" : "bg-accent/70"
                  )}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TemporalRobustness({
  blocks,
  unavailableReason,
}: {
  blocks: TemporalBlock[] | null;
  unavailableReason: string | null;
}) {
  return (
    <Card>
      <CardHeader
        title="Temporal Robustness"
        subtitle="Same protocol, consecutive windows — a candidate that only worked once should look like it"
      />
      <CardBody>
        {blocks === null || blocks.length === 0 ? (
          <Unavailable reason={unavailableReason} />
        ) : (
          <>
            <div className="mb-3 grid gap-2 sm:grid-cols-3">
              {blocks.map((block) => (
                <div
                  key={block.id}
                  className="rounded-lg border border-line bg-raised/40 px-3 py-2"
                >
                  <div className="text-xs font-medium text-ink">
                    {block.label}
                  </div>
                  <div className="num mt-0.5 text-[11px] text-faint">
                    {block.startAt === null || block.endAt === null
                      ? UNAVAILABLE
                      : `${formatDateUtc(block.startAt)} → ${formatDateUtc(block.endAt)}`}
                  </div>
                </div>
              ))}
            </div>
            <MetricRow
              label="Return"
              blocks={blocks}
              values={blocks.map((b) => b.returnPct)}
              format={formatOptionalSignedPct}
              tone="neutral"
            />
            <MetricRow
              label="Sharpe"
              blocks={blocks}
              values={blocks.map((b) => b.sharpe)}
              format={(v) => formatOptionalNumber(v, 3)}
              tone="neutral"
            />
            <MetricRow
              label="Max Drawdown"
              blocks={blocks}
              values={blocks.map((b) => b.maxDrawdownPct)}
              format={(v) => formatOptionalPct(v)}
              tone="risk"
            />
          </>
        )}
      </CardBody>
    </Card>
  );
}
