import clsx from "clsx";
import type { ReactNode } from "react";

export interface StatProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  // `neutral` is for "unknown / not applicable" values (the em-dash case).
  // Distinct from `default` (bright white) so the user does not confuse an
  // absent metric with a real number close to zero.
  tone?: "default" | "positive" | "negative" | "warning" | "neutral";
  /** Renders the value smaller — for dense 6-up rows. */
  size?: "md" | "sm";
  className?: string;
}

const toneClass: Record<NonNullable<StatProps["tone"]>, string> = {
  default: "text-ink",
  positive: "text-pos",
  negative: "text-neg",
  warning: "text-warn",
  neutral: "text-faint",
};

// Colour bleeding in from the top edge, keyed to the same tone as the value.
const glowClass: Record<NonNullable<StatProps["tone"]>, string> = {
  default: "from-accent/40",
  positive: "from-pos/50",
  negative: "from-neg/50",
  warning: "from-warn/50",
  neutral: "from-edge",
};

export function Stat({
  label,
  value,
  hint,
  tone = "default",
  size = "md",
  className,
}: StatProps) {
  return (
    <div
      className={clsx(
        "group relative overflow-hidden rounded-card border border-line bg-surface/70 px-4 py-3.5 transition-colors duration-200 hover:border-edge hover:bg-raised/70",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "absolute inset-x-0 top-0 h-px bg-linear-to-r to-transparent",
          glowClass[tone]
        )}
      />
      <div className="eyebrow truncate" title={label}>
        {label}
      </div>
      <div
        className={clsx(
          "num mt-1.5 font-semibold",
          size === "sm" ? "text-xl" : "text-2xl",
          toneClass[tone]
        )}
      >
        {value}
      </div>
      {hint && <div className="mt-1 truncate text-xs text-muted">{hint}</div>}
    </div>
  );
}
