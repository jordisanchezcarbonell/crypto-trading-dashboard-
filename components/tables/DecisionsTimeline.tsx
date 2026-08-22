import clsx from "clsx";
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

// The rail marker inherits the action colour, so the timeline can be scanned
// vertically without reading a single label.
const MARKER_CLASS: Record<BadgeTone, string> = {
  neutral: "bg-edge",
  info: "bg-info",
  accent: "bg-accent",
  warning: "bg-warn",
  success: "bg-pos",
  danger: "bg-neg",
  muted: "bg-faint",
};

export function DecisionsTimeline({ decisions }: { decisions: Decision[] }) {
  const sorted = [...decisions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-edge bg-surface/40 px-6 py-12 text-center text-sm text-muted">
        No decisions recorded.
      </div>
    );
  }

  return (
    <ol className="relative space-y-2.5 pl-6">
      <span
        aria-hidden="true"
        className="absolute bottom-3 left-[7px] top-3 w-px bg-linear-to-b from-line via-line to-transparent"
      />
      {sorted.map((d) => {
        const tone = ACTION_TONE[d.action];
        return (
          <li key={d.id} className="relative">
            <span
              aria-hidden="true"
              className={clsx(
                "absolute -left-[20.5px] top-[22px] h-2 w-2 rounded-full ring-4 ring-base",
                MARKER_CLASS[tone]
              )}
            />
            <article className="rounded-card border border-line bg-surface/70 p-4 transition-colors duration-150 hover:border-edge hover:bg-raised/50">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={tone} className="tracking-wider">
                    {ACTION_LABEL[d.action]}
                  </Badge>
                  <span className="text-sm font-semibold tracking-tight text-ink">
                    {d.symbol}
                  </span>
                  {/* Label and value stay in one element so the rendered
                      text reads as a single "confidence 75%" string. */}
                  <span className="num text-[11px] text-muted">
                    confidence{" "}
                    {d.confidence == null
                      ? UNAVAILABLE
                      : formatPct(d.confidence * 100, 0)}
                  </span>
                  {!d.executed && (
                    <Badge tone="muted" className="text-[10px] tracking-wider">
                      NOT EXECUTED
                    </Badge>
                  )}
                </div>
                <time
                  className="num text-[11px] text-faint"
                  dateTime={d.timestamp}
                  suppressHydrationWarning
                >
                  {formatRelative(d.timestamp)}
                </time>
              </div>

              <p className="mt-2 text-sm leading-relaxed text-muted">
                {d.rationale}
              </p>

              {d.signals.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {d.signals.map((s) => (
                    <span
                      key={s.name}
                      className="num inline-flex items-center gap-1.5 rounded-md border border-line bg-base/60 px-2 py-0.5 text-[11px]"
                    >
                      <span className="text-faint">{s.name}</span>
                      <span className="text-ink">{String(s.value)}</span>
                    </span>
                  ))}
                </div>
              )}
            </article>
          </li>
        );
      })}
    </ol>
  );
}
