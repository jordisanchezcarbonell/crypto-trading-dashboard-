import clsx from "clsx";
import type { ReactNode } from "react";

export type BadgeTone =
  | "neutral"
  | "info"
  | "warning"
  | "success"
  | "danger"
  | "muted"
  | "accent";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "border-edge bg-overlay text-ink",
  info: "border-info/25 bg-info/10 text-info",
  accent: "border-accent/25 bg-accent/10 text-accent",
  warning: "border-warn/25 bg-warn/10 text-warn",
  success: "border-pos/25 bg-pos/10 text-pos",
  danger: "border-neg/25 bg-neg/10 text-neg",
  muted: "border-line bg-raised text-muted",
};

export function Badge({
  children,
  tone = "neutral",
  className,
  title,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
  /** Native tooltip — for badges whose meaning is carried by an icon. */
  title?: string;
  /** Required when the badge renders no text of its own. */
  "aria-label"?: string;
}) {
  return (
    <span
      title={title}
      aria-label={ariaLabel}
      // A bare span is generic, and `aria-label` on a generic element is not
      // reliably exposed. `role="img"` makes the icon-only badge a labelled
      // object, which is what it is. Text badges stay generic.
      role={ariaLabel ? "img" : undefined}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium leading-5",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
