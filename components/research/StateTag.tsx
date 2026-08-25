import { Badge } from "@/components/ui/Badge";
import { STATE_PRESENTATION } from "@/lib/research/states";
import type { ResearchState } from "@/lib/research/schema";

export function StateTag({
  state,
  className,
}: {
  state: ResearchState;
  className?: string;
}) {
  const { label, tone, meaning } = STATE_PRESENTATION[state];
  return (
    <Badge tone={tone} className={`tracking-wider ${className ?? ""}`} title={meaning}>
      {label}
    </Badge>
  );
}
