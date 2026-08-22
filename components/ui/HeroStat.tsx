import clsx from "clsx";
import type { ReactNode } from "react";

/**
 * The one figure a page is about.
 *
 * A grid of equally-sized stats has no entry point: every number shouts at
 * the same volume, so the eye has nowhere to land and the reader ends up
 * scanning all of them to find the one that matters. This component exists
 * to break that tie — it is deliberately the largest thing on the page, and
 * a page should have exactly one.
 *
 * The delta rides alongside the value rather than underneath it, because
 * "how much" and "which direction" are read together.
 *
 * `aside` fills the right half. At two grid columns wide this card had a
 * headline number using a third of its width and nothing beyond it, so the
 * emphasis read as an accident of the grid rather than a decision. A
 * sparkline there costs no vertical space and answers the question the
 * figure provokes — "and before that?" — without a second card.
 */
export function HeroStat({
  label,
  value,
  delta,
  deltaTone = "neutral",
  caption,
  aside,
  className,
}: {
  label: string;
  value: ReactNode;
  delta?: ReactNode;
  deltaTone?: "positive" | "negative" | "neutral";
  caption?: ReactNode;
  /** Optional visual to the right of the figure — a sparkline, typically. */
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-card border border-line bg-surface/70 px-5 py-4 transition-colors duration-200 hover:border-edge",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "absolute inset-x-0 top-0 h-px bg-linear-to-r to-transparent",
          deltaTone === "positive"
            ? "from-pos/50"
            : deltaTone === "negative"
              ? "from-neg/50"
              : "from-edge"
        )}
      />
      <div className="flex items-stretch justify-between gap-6">
        <div className="min-w-0">
          <div className="eyebrow">{label}</div>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="num text-3xl font-semibold leading-none tracking-tight text-ink sm:text-4xl">
              {value}
            </span>
            {delta && (
              <span
                className={clsx(
                  "num rounded-md border px-1.5 py-0.5 text-sm font-medium leading-5",
                  deltaTone === "positive" &&
                    "border-pos/25 bg-pos/10 text-pos",
                  deltaTone === "negative" &&
                    "border-neg/25 bg-neg/10 text-neg",
                  deltaTone === "neutral" &&
                    "border-line bg-raised text-faint"
                )}
              >
                {delta}
              </span>
            )}
          </div>
          {caption && (
            <div className="mt-2 text-xs text-muted">{caption}</div>
          )}
        </div>
        {/* Hidden on narrow cards: below `sm` the figure needs the full
            width, and a 90px-wide sparkline is a smudge, not a trend. */}
        {aside && (
          <div className="hidden min-w-0 flex-1 items-end justify-end sm:flex">
            {aside}
          </div>
        )}
      </div>
    </div>
  );
}
