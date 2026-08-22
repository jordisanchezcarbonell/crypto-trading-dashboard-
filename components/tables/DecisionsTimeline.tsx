import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { Decision, DecisionAction } from "@/lib/domain/schemas";
import { UNAVAILABLE, formatPct, formatRelative } from "@/lib/format";

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
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
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
            <span
              className="text-xs text-zinc-500"
              suppressHydrationWarning
            >
              {formatRelative(d.timestamp)}
            </span>
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
