import { Badge } from "@/components/ui/Badge";
import { DataTable, type Column } from "./DataTable";
import type { ClosedTrade } from "@/lib/domain/schemas";
import {
  formatDateTime,
  formatQty,
  formatSignedPct,
  formatSignedUsd,
  formatUsd,
  pnlToneClass,
} from "@/lib/format";

const columns: Column<ClosedTrade>[] = [
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
    key: "exit",
    header: "Exit",
    align: "right",
    render: (r) => formatUsd(r.exitPrice),
  },
  {
    key: "pnl",
    header: "PnL",
    align: "right",
    render: (r) => (
      <span className={pnlToneClass(r.pnlUsd)}>
        {formatSignedUsd(r.pnlUsd)}{" "}
        <span className="text-xs text-zinc-500">
          ({formatSignedPct(r.pnlPct)})
        </span>
      </span>
    ),
  },
  {
    key: "fees",
    header: "Fees",
    align: "right",
    render: (r) => <span className="text-zinc-400">{formatUsd(r.feesUsd)}</span>,
  },
  {
    key: "strategy",
    header: "Strategy",
    render: (r) => <span className="text-zinc-400">{r.strategy}</span>,
  },
  {
    key: "reason",
    header: "Reason",
    render: (r) => <span className="text-zinc-400">{r.reason}</span>,
  },
  {
    key: "closed",
    header: "Closed",
    align: "right",
    render: (r) => (
      <span className="text-zinc-400">{formatDateTime(r.closedAt)}</span>
    ),
  },
];

export function TradesTable({ trades }: { trades: ClosedTrade[] }) {
  const sorted = [...trades].sort(
    (a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime()
  );
  return (
    <DataTable
      rows={sorted}
      columns={columns}
      rowKey={(t) => t.id}
      emptyLabel="No closed trades."
    />
  );
}
