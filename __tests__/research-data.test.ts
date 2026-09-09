import { describe, expect, it } from "vitest";
import {
  findDataset,
  findProtocol,
  lastHistoricalBar,
  loadResearchLab,
  orderedStrategies,
} from "@/lib/research/data";
import {
  ResearchStateTagSchema,
  ResearchStrategyResultSchema,
} from "@/lib/research/schema";

const lab = loadResearchLab();

describe("research payload", () => {
  it("parses every shipped strategy against the contract", () => {
    expect(lab.strategies.length).toBeGreaterThan(0);
    for (const strategy of lab.strategies) {
      expect(() =>
        ResearchStrategyResultSchema.parse(strategy)
      ).not.toThrow();
    }
  });

  it("resolves the protocol and dataset each strategy declares", () => {
    for (const strategy of lab.strategies) {
      expect(findProtocol(lab.context, strategy.provenance.protocol)).not.toBeNull();
      expect(findDataset(lab.context, strategy.provenance.datasetId)).not.toBeNull();
    }
  });

  it("reports the frozen dataset boundary as the last historical bar", () => {
    expect(lastHistoricalBar(lab.context)).toBe("2026-08-19T12:00:00+00:00");
  });

  it("orders strategies as the comparison declares them", () => {
    const ordered = orderedStrategies(lab).map((s) => s.id);
    expect(ordered.slice(0, lab.comparison.strategyIds.length)).toEqual(
      lab.comparison.strategyIds
    );
  });

  it("carries evidence on every state tag", () => {
    for (const strategy of lab.strategies) {
      expect(strategy.states.length).toBeGreaterThan(0);
      for (const tag of strategy.states) {
        expect(tag.evidence.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("rejects a state tag with no evidence", () => {
    expect(() =>
      ResearchStateTagSchema.parse({ state: "REJECTED", evidence: "" })
    ).toThrow();
  });

  it("marks every value it derived rather than read from a source", () => {
    const ema = lab.strategies.find((s) => s.id === "ema-v2-risk");
    expect(ema?.metrics?.source.derivedFields).toContain("totalReturnPct");
    // The published figures must NOT be flagged as derived.
    expect(ema?.metrics?.source.derivedFields).not.toContain("sharpe");
    expect(ema?.metrics?.source.derivedFields).not.toContain("cagrPct");
  });

  it("keeps unmeasured metrics null instead of zero", () => {
    const donchian = lab.strategies.find((s) => s.id === "donchian-v1");
    expect(donchian?.metrics).toBeNull();

    const ema = lab.strategies.find((s) => s.id === "ema-v2-risk");
    expect(ema?.metrics?.profitFactor).toBeNull();
    expect(ema?.metrics?.turnover).toBeNull();
    expect(ema?.metrics?.sharpe).toBe(1.401);
  });

  it("reproduces the published EMA-v2 figures exactly", () => {
    const ema = lab.strategies.find((s) => s.id === "ema-v2-risk");
    // reports/phase_1_8.md § Carteras equal-weight OOS
    expect(ema?.metrics?.cagrPct).toBe(28.18);
    expect(ema?.metrics?.maxDrawdownPct).toBe(-23.24);
    expect(ema?.metrics?.sortino).toBe(1.986);
    expect(ema?.metrics?.calmar).toBe(1.212);
    expect(ema?.metrics?.finalEquity).toBe(619684.0);
  });

  it("derives total return with the arithmetic the source itself validates", () => {
    const ema = lab.strategies.find((s) => s.id === "ema-v2-risk");
    const finalEquity = ema?.metrics?.finalEquity ?? 0;
    // 7 scoring sleeves of 10,000 each, per protocol-v1 frictions.
    const derived = (finalEquity / 70_000 - 1) * 100;
    expect(ema?.metrics?.totalReturnPct).toBeCloseTo(derived, 2);
  });

  it("ships no correlation it has not measured", () => {
    for (const c of lab.comparison.correlations) {
      expect(c.value).toBeNull();
    }
  });

  it("never ships a fabricated hash the repository has not recorded", () => {
    const donchian = lab.strategies.find((s) => s.id === "donchian-v1");
    expect(donchian?.provenance.strategyCodeHash).toBeNull();
    expect(donchian?.provenance.experimentId).toBeNull();
    // What IS known stays populated.
    expect(donchian?.provenance.protocolHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("separates results never run from results not exported", () => {
    // The defect this guards: a candidate whose baseline, stress and stability
    // runs were done and reviewed must not be described as unmeasured. The
    // panels stay Unavailable either way — what changes is the claim made
    // about WHY, and that claim is the one thing a reader cannot verify.
    const notExported = ["cross-sectional-momentum-v1", "donchian-v1"];
    for (const id of notExported) {
      const strategy = lab.strategies.find((s) => s.id === id);
      expect(strategy?.states.map((t) => t.state)).toContain(
        "RESULTS_NOT_EXPORTED"
      );
      // Still no numbers: the fix is to the claim, never to the data.
      expect(strategy?.metrics).toBeNull();
      expect(strategy?.equity).toBeNull();
    }

    const reasons = lab.strategies.flatMap((s) => [
      s.equityUnavailableReason,
      s.temporalUnavailableReason,
      s.frictionUnavailableReason,
      s.parameterUnavailableReason,
      s.parameterGrid?.source.caveat ?? null,
    ]);
    for (const reason of reasons) {
      expect(reason ?? "").not.toMatch(/no experiment has been run/i);
    }
  });

  it("describes the correlations as unexported rather than uncomputed", () => {
    // Pairwise strategy-return correlations were computed in the CSM-v1
    // diagnostics. They are not in this repository, which is a statement about
    // the export pipeline — not about whether anyone ran the analysis.
    const { source, correlations } = lab.comparison;
    expect(source.label).not.toMatch(/not computed/i);
    expect(source.ref).not.toMatch(/not started/i);
    expect(`${source.label} ${source.ref} ${source.caveat ?? ""}`).toMatch(
      /not persisted|not exported/i
    );
    // And still no number: the claim was wrong, the data was not.
    for (const c of correlations) {
      expect(c.value).toBeNull();
    }
  });

  it("marks only the preregistered CSM cell as baseline", () => {
    const csm = lab.strategies.find(
      (s) => s.id === "cross-sectional-momentum-v1"
    );
    const baselines = csm?.parameterGrid?.cells.filter((c) => c.isBaseline) ?? [];
    expect(baselines).toHaveLength(1);
    expect(baselines[0]?.rowValue).toBe(180);
    expect(baselines[0]?.colValue).toBe(3);
  });
});
