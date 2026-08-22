import { Badge, type BadgeTone } from "./Badge";
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

export function FreshnessPill({ freshness }: { freshness: Freshness }) {
  const label = LEVEL_LABEL[freshness.level];
  const hint =
    freshness.ageSeconds === null
      ? "no snapshot published yet"
      : `${freshness.ageSeconds}s since last snapshot`;
  return (
    <Badge tone={LEVEL_TONE[freshness.level]} className="tracking-wide">
      <span>{label}</span>
      <span className="text-[10px] font-normal text-current/70">· {hint}</span>
    </Badge>
  );
}
