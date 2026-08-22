import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PositionsTable } from "@/components/tables/PositionsTable";
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
});
