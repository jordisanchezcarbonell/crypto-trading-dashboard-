import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

describe("out-of-sample research contract", () => {
  it("selects only the stressed reserve, never development", async () => {
    expect(existsSync(resolve("lib/research/oos.ts"))).toBe(true);
    const { loadOutOfSample } = await import("@/lib/research/oos");
    const data = loadOutOfSample();

    // The whole point of the view: a development result cannot leak into it.
    const experiments = JSON.parse(
      readFileSync(resolve("data/research/export/research_experiments.json"), "utf8"),
    ) as { experiment_id: string; partition_side: string | null; stressed: boolean }[];
    const shown = new Set(data.strategies.map((s) => s.experimentId));
    for (const row of experiments) {
      if (!shown.has(row.experiment_id)) continue;
      expect(row.partition_side).toBe("reserve");
      expect(row.stressed).toBe(true);
    }
    expect(data.strategies.length).toBeGreaterThanOrEqual(6);
    expect(data.universe).toHaveLength(9);
  });

  it("derives every verdict from the asset counts rather than asserting it", async () => {
    const { loadOutOfSample, RULE } = await import("@/lib/research/oos");
    const data = loadOutOfSample();
    for (const strategy of data.strategies) {
      const expected =
        strategy.assetsPositive >= RULE.positiveAssets
          ? "SURVIVES"
          : strategy.assetsPositive >= RULE.marginalAssets
            ? "MARGINAL"
            : "REJECTED";
      expect(strategy.verdict, strategy.strategy).toBe(expected);
      expect(strategy.reason).toContain(String(strategy.assetsPositive));
    }
    // Both outcomes must be present, or the rule is not doing any work.
    const verdicts = new Set(data.strategies.map((s) => s.verdict));
    expect(verdicts.has("SURVIVES")).toBe(true);
    expect(verdicts.has("REJECTED")).toBe(true);
  });

  it("normalises every curve to 100 so the axis is honest", async () => {
    const { loadOutOfSample } = await import("@/lib/research/oos");
    for (const strategy of loadOutOfSample().strategies) {
      expect(strategy.curve.length).toBeGreaterThan(100);
      expect(strategy.curve[0].equity).toBeCloseTo(100, 6);
      expect(strategy.curve[0].drawdown).toBeCloseTo(0, 6);
      const timestamps = strategy.curve.map((point) => point.ts);
      expect([...timestamps].sort((a, b) => a - b)).toEqual(timestamps);
    }
  });

  it("shows the rule and every discard on the page", async () => {
    const { loadOutOfSample } = await import("@/lib/research/oos");
    const { OutOfSampleCompare } = await import("@/components/research/OutOfSampleCompare");
    const data = loadOutOfSample();
    render(<OutOfSampleCompare data={data} />);

    expect(screen.getByText(/FUERA DE MUESTRA · COSTES DUPLICADOS/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(data.rule.slice(0, 40)))).toBeInTheDocument();

    // Discards are rendered, not hidden: showing only survivors would put
    // survivorship bias into our own reporting.
    const rejected = data.strategies.filter((s) => s.verdict === "REJECTED");
    expect(rejected.length).toBeGreaterThan(0);
    for (const strategy of rejected) {
      const card = screen.getByLabelText(strategy.strategy).closest("label");
      expect(card).not.toBeNull();
      expect(within(card as HTMLElement).getByText("DESCARTADA")).toBeInTheDocument();
    }
    expect(screen.getAllByText("DESCARTADA").length).toBe(rejected.length);
  });

  it("starts with the discards unticked so the chart opens on what survived", async () => {
    const { loadOutOfSample } = await import("@/lib/research/oos");
    const { OutOfSampleCompare } = await import("@/components/research/OutOfSampleCompare");
    const data = loadOutOfSample();
    render(<OutOfSampleCompare data={data} />);
    for (const strategy of data.strategies) {
      const box = screen.getByLabelText(strategy.strategy) as HTMLInputElement;
      expect(box.checked, strategy.strategy).toBe(strategy.verdict !== "REJECTED");
    }
  });
});
