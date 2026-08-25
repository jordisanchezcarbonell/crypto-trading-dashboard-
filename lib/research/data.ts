import contextJson from "@/data/research/context.json";
import comparisonJson from "@/data/research/comparison.json";
import emaV2Json from "@/data/research/strategies/ema-v2-risk.json";
import donchianJson from "@/data/research/strategies/donchian-v1.json";
import csmJson from "@/data/research/strategies/cross-sectional-momentum-v1.json";
import meanReversionJson from "@/data/research/strategies/mean-reversion-v1.json";
import {
  ResearchComparisonSchema,
  ResearchContextSchema,
  ResearchStrategyResultSchema,
  type ResearchDataset,
  type ResearchLab,
  type ResearchProtocol,
  type ResearchStrategyResult,
} from "./schema";

/**
 * The research payload, validated at the boundary.
 *
 * The files under `data/research/` are hand-transcribed from artefacts in the
 * lab repository, which is exactly the kind of source that drifts silently. So
 * they are parsed, not cast: a metric that arrives as a string, a state tag
 * with no evidence line or a timestamp without an offset fails the build-time
 * import rather than rendering as a confident wrong number.
 *
 * This module is intentionally the ONLY place the JSON is read. Components
 * receive typed objects and never import a file.
 */

const STRATEGY_SOURCES = [
  emaV2Json,
  donchianJson,
  csmJson,
  meanReversionJson,
] as const;

export function loadResearchLab(): ResearchLab {
  const context = ResearchContextSchema.parse(contextJson);
  const comparison = ResearchComparisonSchema.parse(comparisonJson);
  const strategies = STRATEGY_SOURCES.map((raw) =>
    ResearchStrategyResultSchema.parse(raw)
  );

  const known = new Set(strategies.map((s) => s.id));
  for (const id of comparison.strategyIds) {
    if (!known.has(id)) {
      throw new Error(`comparison references unknown strategy "${id}"`);
    }
  }

  return { context, strategies, comparison };
}

export function findProtocol(
  context: ResearchLab["context"],
  id: string | null
): ResearchProtocol | null {
  if (id === null) return null;
  return context.protocols.find((p) => p.id === id) ?? null;
}

export function findDataset(
  context: ResearchLab["context"],
  id: string | null
): ResearchDataset | null {
  if (id === null) return null;
  return context.datasets.find((d) => d.id === id) ?? null;
}

/**
 * The dataset boundary shown in the header.
 *
 * Every experiment on this page shares one frozen dataset, and its last bar is
 * the line between research and forward evidence. Taking the maximum across
 * datasets rather than assuming a single one keeps the header honest if a
 * second dataset is ever added.
 */
export function lastHistoricalBar(context: ResearchLab["context"]): string {
  return context.datasets
    .map((d) => d.lastHistoricalBar)
    .reduce((latest, candidate) =>
      new Date(candidate).getTime() > new Date(latest).getTime()
        ? candidate
        : latest
    );
}

/** Strategies in the order the comparison panel declares, then the rest. */
export function orderedStrategies(lab: ResearchLab): ResearchStrategyResult[] {
  const rank = new Map(lab.comparison.strategyIds.map((id, i) => [id, i]));
  return [...lab.strategies].sort(
    (a, b) =>
      (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
      (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER)
  );
}
