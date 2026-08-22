import clsx from "clsx";
import { type BadgeTone } from "./Badge";
import { formatDuration } from "@/lib/format";
import type { Freshness } from "@/lib/domain/schemas";

const LEVEL_TONE: Record<Freshness["level"], BadgeTone> = {
  fresh: "success",
  delayed: "warning",
  stale: "danger",
  no_data: "muted",
};

const LEVEL_LABEL: Record<Freshness["level"], string> = {
  fresh: "FRESH",
  delayed: "DELAYED",
  stale: "STALE",
  no_data: "NO DATA",
};

const RING: Record<BadgeTone, string> = {
  neutral: "border-edge bg-overlay text-ink",
  info: "border-info/25 bg-info/10 text-info",
  accent: "border-accent/25 bg-accent/10 text-accent",
  warning: "border-warn/25 bg-warn/10 text-warn",
  success: "border-pos/25 bg-pos/10 text-pos",
  danger: "border-neg/25 bg-neg/10 text-neg",
  muted: "border-line bg-raised text-muted",
};

export function FreshnessPill({ freshness }: { freshness: Freshness }) {
  const tone = LEVEL_TONE[freshness.level];
  const label = LEVEL_LABEL[freshness.level];
  // Raw seconds are unreadable past a minute or two — "19896s since last
  // snapshot" tells a human nothing, and this pill exists precisely to be
  // read at a glance. formatDuration renders the same value as "5 h 31 min".
  const hint =
    freshness.ageSeconds === null
      ? "no snapshot published yet"
      : `${formatDuration(freshness.ageSeconds)} since last snapshot`;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-md border py-0.5 pl-2 pr-2 text-[11px] font-medium leading-5",
        RING[tone]
      )}
    >
      <span className="tracking-wider">{label}</span>
      <span aria-hidden="true" className="h-3 w-px bg-current/25" />
      <span className="num font-normal text-current/70">{hint}</span>
    </span>
  );
}
