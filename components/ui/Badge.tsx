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
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
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
