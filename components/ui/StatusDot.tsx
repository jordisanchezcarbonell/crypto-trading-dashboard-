import clsx from "clsx";
import type { HealthStatus } from "@/lib/domain/schemas";

const dotClasses: Record<HealthStatus, string> = {
  ok: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
  degraded: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]",
  down: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]",
};

export function StatusDot({
  status,
  className,
}: {
  status: HealthStatus;
  className?: string;
}) {
  return (
    <span
      aria-label={`status ${status}`}
      className={clsx(
        "inline-block h-2 w-2 rounded-full",
        dotClasses[status],
        className
      )}
    />
  );
}
