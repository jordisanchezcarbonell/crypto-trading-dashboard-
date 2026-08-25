import clsx from "clsx";

/**
 * The honest empty state.
 *
 * A research panel with no data must say which measurement is missing and
 * why, because "why" is the difference between "we have not run it" and "it
 * failed". Both are research findings; a blank rectangle is neither.
 *
 * Deliberately not styled as an error: an unmeasured panel is the normal
 * state of a lab, not a fault.
 */
export function Unavailable({
  reason,
  compact = false,
  className,
}: {
  reason: string | null;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex items-start gap-3 rounded-card border border-dashed border-edge bg-surface/40",
        compact ? "px-4 py-3" : "px-5 py-8",
        className
      )}
    >
      <span className="eyebrow mt-px shrink-0 rounded border border-line bg-raised px-1.5 py-0.5 text-faint">
        Unavailable
      </span>
      <p className="min-w-0 text-xs leading-relaxed text-muted">
        {reason ?? "No measurement recorded."}
      </p>
    </div>
  );
}
