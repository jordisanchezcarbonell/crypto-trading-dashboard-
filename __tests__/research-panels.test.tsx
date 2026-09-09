import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MetricCardRow } from "@/components/research/MetricCards";
import { TemporalRobustness } from "@/components/research/TemporalRobustness";
import { ParameterStability } from "@/components/research/ParameterStability";
import { ResearchDecision } from "@/components/research/ResearchDecision";
import { UNAVAILABLE } from "@/lib/format";
import { loadResearchLab } from "@/lib/research/data";
import type {
  ParameterGrid,
  ResearchMetrics,
  TemporalBlock,
} from "@/lib/research/schema";

const lab = loadResearchLab();
const ema = lab.strategies.find((s) => s.id === "ema-v2-risk")!;
const csm = lab.strategies.find((s) => s.id === "cross-sectional-momentum-v1")!;

/**
 * Fixtures below are SYNTHETIC and exist only to exercise the rendering paths
 * that have no measurement in the repository yet. They are never imported by
 * application code — `data/research/*.json` is the only source the page reads.
 */
const SYNTHETIC_BLOCKS: TemporalBlock[] = [
  {
    id: "B1",
    label: "Block 1",
    startAt: "2020-01-01T00:00:00+00:00",
    endAt: "2022-01-01T00:00:00+00:00",
    returnPct: 90,
    sharpe: 1.2,
    maxDrawdownPct: -20,
  },
  {
    id: "B2",
    label: "Block 2",
    startAt: "2022-01-01T00:00:00+00:00",
    endAt: "2024-01-01T00:00:00+00:00",
    returnPct: 10,
    sharpe: 0.3,
    maxDrawdownPct: -35,
  },
  {
    id: "B3",
    label: "Block 3",
    startAt: "2024-01-01T00:00:00+00:00",
    endAt: "2026-08-19T12:00:00+00:00",
    returnPct: null,
    sharpe: null,
    maxDrawdownPct: null,
  },
];

describe("<MetricCardRow />", () => {
  it("renders the unavailable reason when a candidate has no metrics", () => {
    render(
      <MetricCardRow metrics={null} unavailableReason="No experiment run." />
    );
    expect(screen.getByText(/No experiment run\./)).toBeInTheDocument();
    expect(screen.queryByText("0.00%")).not.toBeInTheDocument();
  });

  it("renders risk with the same prominence as return", () => {
    render(<MetricCardRow metrics={ema.metrics} unavailableReason="" />);
    expect(screen.getByText("Total Return")).toBeInTheDocument();
    expect(screen.getByText("Max Drawdown")).toBeInTheDocument();
    expect(screen.getByText("-23.24%")).toBeInTheDocument();
    expect(screen.getByText("+28.18%")).toBeInTheDocument();
  });

  it("renders unmeasured metrics as the unavailable glyph, never as zero", () => {
    render(<MetricCardRow metrics={ema.metrics} unavailableReason="" />);
    // profitFactor and turnover are null in the shipped payload.
    expect(screen.getAllByText(UNAVAILABLE).length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("0.000")).not.toBeInTheDocument();
    expect(screen.queryByText("0.00x")).not.toBeInTheDocument();
  });

  it("marks a derived value and leaves published values unmarked", () => {
    render(<MetricCardRow metrics={ema.metrics} unavailableReason="" />);
    const marks = screen.getAllByTitle(/Derived by this dashboard/);
    expect(marks).toHaveLength(1);
  });

  it("does not mark anything as derived when nothing was derived", () => {
    const metrics: ResearchMetrics = {
      ...ema.metrics!,
      source: { ...ema.metrics!.source, derivedFields: [] },
    };
    render(<MetricCardRow metrics={metrics} unavailableReason="" />);
    expect(screen.queryByTitle(/Derived by this dashboard/)).toBeNull();
  });
});

describe("<TemporalRobustness />", () => {
  it("explains why blocks are missing instead of drawing empty bars", () => {
    render(
      <TemporalRobustness
        blocks={null}
        unavailableReason={ema.temporalUnavailableReason}
      />
    );
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
    expect(
      screen.getByText(/No temporal block split has been run/)
    ).toBeInTheDocument();
  });

  it("renders one column per block and keeps an unmeasured block blank", () => {
    render(
      <TemporalRobustness blocks={SYNTHETIC_BLOCKS} unavailableReason={null} />
    );
    expect(screen.getByText("Block 1")).toBeInTheDocument();
    expect(screen.getByText("+90.00%")).toBeInTheDocument();
    expect(screen.getByText("+10.00%")).toBeInTheDocument();
    // B3 has no measurement: three em dashes, no zeros.
    expect(screen.getAllByText(UNAVAILABLE)).toHaveLength(3);
    expect(screen.queryByText("0.00%")).not.toBeInTheDocument();
  });
});

describe("<ParameterStability />", () => {
  it("marks the preregistered baseline and nothing else", () => {
    render(
      <ParameterStability grid={csm.parameterGrid} unavailableReason={null} />
    );
    expect(screen.getAllByText("Baseline")).toHaveLength(1);
  });

  it("renders every declared cell as unavailable while unmeasured", () => {
    render(
      <ParameterStability grid={csm.parameterGrid} unavailableReason={null} />
    );
    const table = screen.getByRole("table");
    expect(within(table).getAllByText(UNAVAILABLE)).toHaveLength(9);
  });

  it("does not single out the highest-scoring cell", () => {
    const grid: ParameterGrid = {
      ...csm.parameterGrid!,
      cells: csm.parameterGrid!.cells.map((cell, i) => ({
        ...cell,
        values: {
          x1: { sharpe: i / 10, cagrPct: i, profitFactor: 1 + i / 10 },
          x2: { sharpe: i / 20, cagrPct: i / 2, profitFactor: 1 + i / 20 },
        },
      })),
    };
    render(<ParameterStability grid={grid} unavailableReason={null} />);
    // The only annotated cell remains the baseline, not the max (0.800).
    expect(screen.getAllByText("Baseline")).toHaveLength(1);
    expect(screen.getByText("0.800")).toBeInTheDocument();
  });
});

describe("<ResearchDecision />", () => {
  it("prints the evidence behind every tag", () => {
    render(<ResearchDecision strategies={lab.strategies} />);
    expect(screen.getAllByText("FROZEN CANDIDATE").length).toBeGreaterThan(0);
    expect(screen.getByText(/NOT production approved/)).toBeInTheDocument();
    expect(screen.getAllByText("REJECTED").length).toBeGreaterThan(0);
    expect(screen.getByText(/record rejected mean reversion v1/)).toBeInTheDocument();
  });
});
