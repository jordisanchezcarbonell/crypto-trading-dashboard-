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

    const experiments = JSON.parse(
      readFileSync(resolve("data/research/export/research_experiments.json"), "utf8"),
    ) as { experiment_id: string; partition_side: string | null; stressed: boolean }[];
    const shown = new Set(data.scopes.flatMap((s) => s.strategies.map((x) => x.experimentId)));
    for (const row of experiments) {
      if (!shown.has(row.experiment_id)) continue;
      expect(row.partition_side).toBe("reserve");
      expect(row.stressed).toBe(true);
    }
  });

  it("keeps the two universes apart and puts the widest first", async () => {
    const { loadOutOfSample } = await import("@/lib/research/oos");
    const { scopes } = loadOutOfSample();

    // Two scopes, and the wide one leads: it is the evidence that governs.
    expect(scopes.length).toBeGreaterThanOrEqual(2);
    expect(scopes[0].size).toBeGreaterThan(scopes[1].size);
    expect(scopes[0].size).toBeGreaterThan(9);
    expect(scopes[scopes.length - 1].size).toBe(9);

    // Every strategy in a scope really covers that scope's universe. A row from
    // one universe leaking into the other is the failure this split prevents.
    for (const scope of scopes) {
      expect(scope.strategies.length).toBeGreaterThan(0);
      for (const strategy of scope.strategies) {
        expect(strategy.assetsTotal, `${scope.size} / ${strategy.strategy}`).toBe(scope.size);
      }
    }
  });

  it("warns, on the narrow scope only, that its returns are selection-inflated", async () => {
    const { loadOutOfSample } = await import("@/lib/research/oos");
    const { scopes } = loadOutOfSample();
    const narrow = scopes.find((s) => s.size === 9);
    const wide = scopes.find((s) => s.size > 9);
    expect(narrow?.note).toMatch(/inflados/);
    expect(wide?.note).toMatch(/regla mecánica/);
  });

  it("derives every verdict from the asset counts rather than asserting it", async () => {
    const { loadOutOfSample, RULE } = await import("@/lib/research/oos");
    for (const scope of loadOutOfSample().scopes) {
      for (const strategy of scope.strategies) {
        const expected =
          strategy.assetsPositive >= RULE.positiveAssets
            ? "SURVIVES"
            : strategy.assetsPositive >= RULE.marginalAssets
              ? "MARGINAL"
              : "REJECTED";
        expect(strategy.verdict, strategy.strategy).toBe(expected);
      }
    }
  });

  it("normalises every curve to 100 so the axis is honest", async () => {
    const { loadOutOfSample } = await import("@/lib/research/oos");
    for (const scope of loadOutOfSample().scopes) {
      for (const strategy of scope.strategies) {
        expect(strategy.curve.length).toBeGreaterThan(100);
        expect(strategy.curve[0].equity).toBeCloseTo(100, 6);
        const timestamps = strategy.curve.map((point) => point.ts);
        expect([...timestamps].sort((a, b) => a - b)).toEqual(timestamps);
      }
    }
  });

  it("opens on the wide universe and lets you switch, one at a time", async () => {
    const { loadOutOfSample } = await import("@/lib/research/oos");
    const { OutOfSampleCompare } = await import("@/components/research/OutOfSampleCompare");
    const data = loadOutOfSample();
    render(<OutOfSampleCompare data={data} />);

    const tabs = screen.getAllByRole("button", { name: /activos/ });
    expect(tabs.length).toBe(data.scopes.length);
    expect(tabs[0]).toHaveAttribute("aria-pressed", "true");
    expect(tabs[1]).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText(data.scopes[0].note)).toBeInTheDocument();

    // Only the selected universe's strategies are on the page: the two are
    // never rendered together, which is the point of splitting them.
    const other = data.scopes[1].strategies.find(
      (s) => !data.scopes[0].strategies.some((w) => w.strategy === s.strategy),
    );
    if (other) expect(screen.queryByLabelText(other.strategy)).toBeNull();
  });

  it("shows the rule and every discard on the page", async () => {
    const { loadOutOfSample } = await import("@/lib/research/oos");
    const { OutOfSampleCompare } = await import("@/components/research/OutOfSampleCompare");
    const data = loadOutOfSample();
    render(<OutOfSampleCompare data={data} />);

    expect(screen.getByText(/FUERA DE MUESTRA · COSTES DUPLICADOS/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(data.rule.slice(0, 40)))).toBeInTheDocument();

    for (const strategy of data.scopes[0].strategies) {
      const card = screen.getByLabelText(strategy.strategy).closest("label");
      expect(card).not.toBeNull();
      const badge = strategy.verdict === "REJECTED" ? "DESCARTADA" : /SUPERA|MARGINAL/;
      expect(within(card as HTMLElement).getByText(badge)).toBeInTheDocument();
    }
  });

  it("starts with the discards unticked so the chart opens on what survived", async () => {
    const { loadOutOfSample } = await import("@/lib/research/oos");
    const { OutOfSampleCompare } = await import("@/components/research/OutOfSampleCompare");
    const data = loadOutOfSample();
    render(<OutOfSampleCompare data={data} />);
    for (const strategy of data.scopes[0].strategies) {
      const box = screen.getByLabelText(strategy.strategy) as HTMLInputElement;
      expect(box.checked, strategy.strategy).toBe(strategy.verdict !== "REJECTED");
    }
  });
});
