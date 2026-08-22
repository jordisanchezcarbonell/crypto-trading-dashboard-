import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { Decision, DecisionAction } from "@/lib/domain/schemas";
import {
  UNAVAILABLE,
  formatDateTime,
  formatPct,
  formatRelative,
} from "@/lib/format";

/**
 * When the decision actually became knowable.
 *
 * `d.timestamp` is the FEATURE BAR — the candle the features came from. A
 * decision whose feature bar is 08:00 on a 4h timeframe could not be known
 * until that bar closed at 12:00, so ordering or labelling the timeline by
 * the bar claims the agent saw the future. `signalAvailableAt` is the
 * causally correct instant and is what this timeline sorts and renders by.
 *
 * `null` means the row predates migration 002 and carries no availability
 * timestamp. We fall back to the feature bar rather than dropping the row,
 * and the UI marks that fallback explicitly instead of passing the bar off
 * as a decision time.
 */
function decidedAt(d: Decision): string {
  return d.signalAvailableAt ?? d.timestamp;
}

const ACTION_TONE: Record<DecisionAction, BadgeTone> = {
  open_long: "success",
  scale_in: "success",
  open_short: "danger",
  scale_out: "warning",
  close: "info",
  hold: "muted",
  skip: "muted",
};

const ACTION_LABEL: Record<DecisionAction, string> = {
  open_long: "OPEN LONG",
  open_short: "OPEN SHORT",
  scale_in: "SCALE IN",
  scale_out: "SCALE OUT",
  close: "CLOSE",
  hold: "HOLD",
  skip: "SKIP",
};

export function DecisionsTimeline({ decisions }: { decisions: Decision[] }) {
  const sorted = [...decisions].sort(
    (a, b) => new Date(decidedAt(b)).getTime() - new Date(decidedAt(a)).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-10 text-center text-sm text-zinc-400">
        No decisions recorded.
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {sorted.map((d) => (
        <li
          key={d.id}
          className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge tone={ACTION_TONE[d.action]}>{ACTION_LABEL[d.action]}</Badge>
              <span className="text-sm font-medium text-zinc-100">
                {d.symbol}
              </span>
              <span className="text-xs text-zinc-500">
                confidence{" "}
                {d.confidence == null
                  ? UNAVAILABLE
                  : formatPct(d.confidence * 100, 0)}
              </span>
              {!d.executed && (
                <Badge tone="muted" className="text-[10px]">
                  NOT EXECUTED
                </Badge>
              )}
            </div>
            <div className="flex flex-col items-end text-right">
              <time
                className="text-xs text-zinc-500"
                dateTime={decidedAt(d)}
                title={
                  d.signalAvailableAt
                    ? `Signal available at ${formatDateTime(d.signalAvailableAt)}`
                    : `Availability not exported for this decision; showing its feature bar (${formatDateTime(d.timestamp)})`
                }
                suppressHydrationWarning
              >
                {formatRelative(decidedAt(d))}
                {d.signalAvailableAt === null && (
                  <span className="ml-1 text-zinc-600">(bar)</span>
                )}
              </time>
              {/* The feature bar stays visible as provenance: it says which
                  candle produced the signal, which is genuinely useful, but
                  it is never the headline time. */}
              <span className="text-[11px] text-zinc-600" suppressHydrationWarning>
                bar {formatDateTime(d.timestamp)}
              </span>
            </div>
          </div>
          <p className="mt-2 text-sm leading-snug text-zinc-300">
            {d.rationale}
          </p>
          {d.signals.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {d.signals.map((s) => (
                <span
                  key={s.name}
                  className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-950/60 px-2 py-0.5 font-mono text-[11px] text-zinc-400"
                >
                  <span className="text-zinc-500">{s.name}</span>
                  <span className="text-zinc-200">{String(s.value)}</span>
                </span>
              ))}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
