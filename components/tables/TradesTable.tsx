import { SideTag } from "@/components/ui/SideTag";
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
    render: (r) => <span className="font-semibold tracking-tight text-ink">{r.symbol}</span>,
  },
  {
    key: "side",
    header: "Side",
    render: (r) => <SideTag side={r.side} />,
  },
  // Column priority for narrow viewports: Symbol, Side and PnL are why
  // anyone opens this table, so they never drop. Cost and provenance go
  // first as the viewport shrinks.
  {
    key: "qty",
    header: "Qty",
    align: "right",
    hideBelow: "md",
    render: (r) => formatQty(r.qty),
  },
  {
    key: "entry",
    header: "Entry",
    align: "right",
    hideBelow: "lg",
    render: (r) => formatUsd(r.entryPrice),
  },
  {
    key: "exit",
    header: "Exit",
    align: "right",
    hideBelow: "sm",
    render: (r) => formatUsd(r.exitPrice),
  },
  {
    key: "pnl",
    header: "PnL",
    align: "right",
    render: (r) => (
      <span className={pnlToneClass(r.pnlUsd)}>
        {formatSignedUsd(r.pnlUsd)}{" "}
        <span className="text-[11px] text-faint">
          ({formatSignedPct(r.pnlPct)})
        </span>
      </span>
    ),
  },
  {
    key: "fees",
    header: "Fees",
    align: "right",
    hideBelow: "xl",
    render: (r) => <span className="text-muted">{formatUsd(r.feesUsd)}</span>,
  },
  {
    key: "strategy",
    header: "Strategy",
    hideBelow: "lg",
    render: (r) => <span className="text-muted">{r.strategy}</span>,
  },
  {
    key: "reason",
    header: "Reason",
    hideBelow: "xl",
    render: (r) => <span className="text-muted">{r.reason}</span>,
  },
  {
    key: "closed",
    header: "Closed",
    align: "right",
    hideBelow: "md",
    render: (r) => (
      <span className="text-muted">{formatDateTime(r.closedAt)}</span>
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
      emptyLabel="No closed trades"
      emptyHint="Closed trades appear here once a position is exited."
      caption="Closed trades with entry, exit, PnL and close reason"
    />
  );
}
