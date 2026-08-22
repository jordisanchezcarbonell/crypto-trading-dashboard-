import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataTable, type Column } from "@/components/tables/DataTable";

interface Row {
  id: string;
  symbol: string;
  note: string;
}

const rows: Row[] = [{ id: "1", symbol: "BTC-USDT", note: "provenance" }];

const columns: Column<Row>[] = [
  { key: "symbol", header: "Symbol", render: (r) => r.symbol },
  { key: "note", header: "Note", hideBelow: "lg", render: (r) => r.note },
];

describe("<DataTable />", () => {
  it("renders the shared empty state, with its hint", () => {
    // Regression: DataTable and DecisionsTimeline each used to hand-roll a
    // dashed-border block while components/ui/EmptyState sat unused, so the
    // app showed three different empty states.
    render(
      <DataTable
        rows={[]}
        columns={columns}
        rowKey={(r) => r.id}
        emptyLabel="No open positions"
        emptyHint="Positions appear here once a strategy opens one."
      />
    );
    expect(screen.getByText("No open positions")).toBeInTheDocument();
    expect(
      screen.getByText("Positions appear here once a strategy opens one.")
    ).toBeInTheDocument();
  });

  it("keeps low-priority columns in the DOM but hidden on small viewports", () => {
    // The column still renders — this is a CSS-driven drop, so the data
    // stays available to assistive tech and reappears when the viewport
    // grows. What matters is that it carries the responsive class rather
    // than silently scrolling off the right edge.
    const { container } = render(
      <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} />
    );
    const noteHeader = screen.getByText("Note");
    expect(noteHeader.className).toContain("hidden");
    expect(noteHeader.className).toContain("lg:table-cell");
    // A column with no `hideBelow` is never hidden.
    expect(screen.getByText("Symbol").className).not.toContain("hidden");
    expect(container.querySelectorAll("tbody tr")).toHaveLength(1);
  });

  it("exposes the scroll container as a focusable, named region", () => {
    // A horizontally scrollable box is unreachable by keyboard unless it is
    // focusable, and unannounced unless it is named.
    render(
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        caption="Open positions"
      />
    );
    const region = screen.getByRole("region", { name: "Open positions" });
    expect(region).toHaveAttribute("tabIndex", "0");
  });

  it("drops its own card chrome when framed by a parent Card", () => {
    // Regression: on the Overview the table sits inside a <Card>, and its
    // own border stacked a second hairline on the first.
    const { container: framed } = render(
      <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} />
    );
    const { container: bare } = render(
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        frame={false}
      />
    );
    expect(framed.firstElementChild?.className).toContain("border");
    expect(bare.firstElementChild?.className).not.toContain("border");
  });
});
