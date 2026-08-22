import { Badge } from "@/components/ui/Badge";
import { DataTable, type Column } from "./DataTable";
import type { Position } from "@/lib/domain/schemas";
import {
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
    render: (r) => <span className="font-medium text-zinc-50">{r.symbol}</span>,
  },
  {
    key: "side",
    header: "Side",
    render: (r) => (
      <Badge tone={r.side === "long" ? "success" : "danger"}>
        {r.side.toUpperCase()}
      </Badge>
    ),
  },
  { key: "qty", header: "Qty", align: "right", render: (r) => formatQty(r.qty) },
  {
    key: "entry",
    header: "Entry",
    align: "right",
    render: (r) => formatUsd(r.entryPrice),
  },
  {
    key: "mark",
    header: "Mark",
    align: "right",
    render: (r) => formatUsd(r.markPrice),
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
        <span className="text-xs text-zinc-500">
          ({formatSignedPct(r.unrealizedPnlPct)})
        </span>
      </span>
    ),
  },
  {
    key: "strategy",
    header: "Strategy",
    render: (r) => <span className="text-zinc-400">{r.strategy}</span>,
  },
  {
    key: "opened",
    header: "Opened",
    align: "right",
    render: (r) => (
      <span className="text-zinc-400" suppressHydrationWarning>
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
    />
  );
}
