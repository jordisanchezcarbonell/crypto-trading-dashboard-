"use client";

import clsx from "clsx";

/**
 * Single-choice filter control. Shared by the pages that filter a list so the
 * toggles look and behave identically everywhere (arrow keys, aria-pressed).
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex items-center gap-0.5 rounded-lg border border-line bg-surface/80 p-0.5"
    >
      {options.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option)}
            className={clsx(
              "rounded-[0.4rem] px-3 py-1 text-xs font-medium tracking-wide transition-colors duration-150",
              active
                ? "bg-overlay text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                : "text-muted hover:bg-raised hover:text-ink"
            )}
          >
            {option.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
