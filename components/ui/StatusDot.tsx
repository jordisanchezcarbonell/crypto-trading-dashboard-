import clsx from "clsx";
import type { HealthStatus } from "@/lib/domain/schemas";

const dotClasses: Record<HealthStatus, string> = {
  ok: "bg-pos shadow-[0_0_0_3px_rgba(52,211,153,0.15),0_0_10px_rgba(52,211,153,0.6)]",
  degraded:
    "bg-warn shadow-[0_0_0_3px_rgba(251,191,36,0.15),0_0_10px_rgba(251,191,36,0.6)]",
  down: "bg-neg shadow-[0_0_0_3px_rgba(251,113,133,0.18),0_0_10px_rgba(251,113,133,0.7)]",
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
      role="img"
      className={clsx(
        "inline-block h-2 w-2 shrink-0 rounded-full",
        // Only a non-ok status animates: motion is the alert channel.
        status !== "ok" && "animate-pulse-dot",
        dotClasses[status],
        className
      )}
    />
  );
}
