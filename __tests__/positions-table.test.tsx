import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PositionsTable } from "@/components/tables/PositionsTable";
import { UNAVAILABLE } from "@/lib/format";
import { run3Snapshot } from "@/lib/mock/run3-fixtures";

describe("<PositionsTable />", () => {
  it("renders one row per position with headers", () => {
    render(<PositionsTable positions={run3Snapshot.positions} />);
    expect(screen.getByText("Symbol")).toBeInTheDocument();
    for (const p of run3Snapshot.positions) {
      expect(screen.getAllByText(p.symbol).length).toBeGreaterThan(0);
    }
  });

  it("renders empty state when there are no positions", () => {
    render(<PositionsTable positions={[]} />);
    expect(screen.getByText(/no open positions/i)).toBeInTheDocument();
  });

  it("renders em-dash for null mark/entry, NOT $0.00", () => {
    const withNullPrices = [
      {
        ...run3Snapshot.positions[0],
        id: "test-nullable-position",
        markPrice: null,
        entryPrice: null,
      },
    ];
    render(<PositionsTable positions={withNullPrices} />);
    // Two cells (entry + mark) must render "—".
    const unknowns = screen.getAllByText(UNAVAILABLE);
    expect(unknowns.length).toBeGreaterThanOrEqual(2);
    // Regression: no zero-priced entry/mark cells emitted.
    expect(screen.queryByText(/^\$0\.00$/)).toBeNull();
  });
});
