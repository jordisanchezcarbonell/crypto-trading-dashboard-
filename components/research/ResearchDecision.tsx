import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { STATE_PRESENTATION } from "@/lib/research/states";
import type { ResearchStrategyResult } from "@/lib/research/schema";
import { StateTag } from "./StateTag";

/**
 * Research Decision — where a state must show its evidence.
 *
 * Multiple tags per strategy is the point: "stable region" and
 * "friction-sensitive" are both true of the same candidate often enough that
 * collapsing them into one verdict would destroy the finding. Each tag is
 * printed with the artefact it comes from, so a reader can go and check it.
 */
export function ResearchDecision({
  strategies,
}: {
  strategies: ResearchStrategyResult[];
}) {
  return (
    <Card>
      <CardHeader
        title="Research Decision"
        subtitle="Every tag carries the artefact it comes from. No tag is inferred from the numbers on this page."
      />
      <CardBody className="divide-y divide-line">
        {strategies.map((strategy) => (
          <div key={strategy.id} className="py-3 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-ink">
                {strategy.label}
              </span>
              {strategy.states.map((tag) => (
                <StateTag key={tag.state} state={tag.state} />
              ))}
            </div>
            <ul className="mt-2 space-y-1.5">
              {strategy.states.map((tag) => (
                <li
                  key={tag.state}
                  className="flex gap-2 text-xs leading-relaxed text-muted"
                >
                  <span className="eyebrow mt-px shrink-0 text-faint">
                    {STATE_PRESENTATION[tag.state].label}
                  </span>
                  <span className="min-w-0">{tag.evidence}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
