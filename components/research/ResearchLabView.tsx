"use client";

import { useState } from "react";
import { findDataset, findProtocol } from "@/lib/research/data";
import type { ResearchLab } from "@/lib/research/schema";
import { EquityPanel } from "./EquityPanel";
import { FrictionStress } from "./FrictionStress";
import { MetricCardRow, MetricSourceNote } from "./MetricCards";
import { ParameterStability } from "./ParameterStability";
import { ProvenancePanel } from "./ProvenancePanel";
import { ResearchDecision } from "./ResearchDecision";
import { ResearchHeader } from "./ResearchHeader";
import { StrategyComparison } from "./StrategyComparison";
import { TemporalRobustness } from "./TemporalRobustness";

/**
 * The single research page.
 *
 * One selected candidate drives the whole column: metrics, equity, robustness,
 * stress and provenance all describe the same experiment, and the comparison
 * table below places it against the others. Splitting these across routes
 * would let a reader see a Sharpe without the friction stress that qualifies
 * it, which is the mistake this layout is built to prevent.
 */
export function ResearchLabView({
  lab,
  lastBar,
}: {
  lab: ResearchLab;
  lastBar: string;
}) {
  const [selectedId, setSelectedId] = useState(lab.strategies[0]?.id ?? "");
  const selected =
    lab.strategies.find((s) => s.id === selectedId) ?? lab.strategies[0];

  if (!selected) return null;

  const protocol = findProtocol(lab.context, selected.provenance.protocol);
  const dataset = findDataset(lab.context, selected.provenance.datasetId);

  return (
    <div className="animate-rise space-y-6">
      <ResearchHeader
        strategies={lab.strategies}
        selected={selected}
        onSelect={setSelectedId}
        protocol={protocol}
        dataset={dataset}
        lastBar={lastBar}
      />

      <section className="space-y-3" aria-label="Headline metrics">
        <MetricCardRow
          metrics={selected.metrics}
          unavailableReason={`No metric block has been recorded for ${selected.label}. ${
            selected.states[0]?.evidence ?? ""
          }`}
        />
        {selected.metrics && <MetricSourceNote metrics={selected.metrics} />}
      </section>

      <EquityPanel strategy={selected} />

      <div className="grid gap-4 xl:grid-cols-2">
        <TemporalRobustness
          blocks={selected.temporalBlocks}
          unavailableReason={selected.temporalUnavailableReason}
        />
        <FrictionStress
          scenarios={selected.frictionScenarios}
          unavailableReason={selected.frictionUnavailableReason}
        />
      </div>

      <ParameterStability
        grid={selected.parameterGrid}
        unavailableReason={selected.parameterUnavailableReason}
      />

      <StrategyComparison
        strategies={lab.strategies}
        comparison={lab.comparison}
        selectedId={selected.id}
      />

      <ResearchDecision strategies={lab.strategies} />

      <ProvenancePanel
        provenance={selected.provenance}
        protocol={protocol}
        dataset={dataset}
      />
    </div>
  );
}
