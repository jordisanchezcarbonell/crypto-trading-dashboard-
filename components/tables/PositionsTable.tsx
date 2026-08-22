import { SideTag } from "@/components/ui/SideTag";
import { DataTable, type Column } from "./DataTable";
import type { Position } from "@/lib/domain/schemas";
import {
  formatOptionalUsd,
  formatQty,
  formatRelative,
  formatSignedPct,
  formatSignedUsd,
  formatUsd,
  pnlToneClass,
} from "@/lib/format";

const columns: Column<Position>[] = [
  {
    key: "symbol",
    header: "Symbol",
    render: (r) => <span className="font-semibold tracking-tight text-ink">{r.symbol}</span>,
  },
  {
    key: "side",
    header: "Side",
    render: (r) => <SideTag side={r.side} />,
  },
  { key: "qty", header: "Qty", align: "right", render: (r) => formatQty(r.qty) },
  {
    key: "entry",
    header: "Entry",
    align: "right",
    render: (r) => formatOptionalUsd(r.entryPrice),
  },
  {
    key: "mark",
    header: "Mark",
    align: "right",
    render: (r) => formatOptionalUsd(r.markPrice),
  },
  {
    key: "notional",
    header: "Notional",
    align: "right",
    render: (r) => formatUsd(r.notionalUsd),
  },
  {
    key: "pnl",
    header: "uPnL",
    align: "right",
    render: (r) => (
      <span className={pnlToneClass(r.unrealizedPnlUsd)}>
        {formatSignedUsd(r.unrealizedPnlUsd)}{" "}
        <span className="text-[11px] text-faint">
          ({formatSignedPct(r.unrealizedPnlPct)})
        </span>
      </span>
    ),
  },
  {
    key: "strategy",
    header: "Strategy",
    render: (r) => <span className="text-muted">{r.strategy}</span>,
  },
  {
    key: "opened",
    header: "Opened",
    align: "right",
    render: (r) => (
      <span className="text-muted" suppressHydrationWarning>
        {formatRelative(r.openedAt)}
      </span>
    ),
  },
];

export function PositionsTable({ positions }: { positions: Position[] }) {
  return (
    <DataTable
      rows={positions}
      columns={columns}
      rowKey={(p) => p.id}
      emptyLabel="No open positions."
      caption="Open positions with entry, mark price and unrealized PnL"
    />
  );
}
