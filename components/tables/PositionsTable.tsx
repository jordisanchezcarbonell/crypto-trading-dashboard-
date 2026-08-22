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
  // Column priority for narrow viewports. Symbol, Side and uPnL are the
  // reason anyone opens this table, so they never drop. Everything else
  // falls away in reverse order of usefulness as the viewport shrinks.
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
    render: (r) => formatOptionalUsd(r.entryPrice),
  },
  {
    key: "mark",
    header: "Mark",
    align: "right",
    hideBelow: "sm",
    render: (r) => formatOptionalUsd(r.markPrice),
  },
  {
    key: "notional",
    header: "Notional",
    align: "right",
    hideBelow: "xl",
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
    hideBelow: "lg",
    render: (r) => <span className="text-muted">{r.strategy}</span>,
  },
  {
    key: "opened",
    header: "Opened",
    align: "right",
    hideBelow: "md",
    render: (r) => (
      <span className="text-muted" suppressHydrationWarning>
        {formatRelative(r.openedAt)}
      </span>
    ),
  },
];

/**
 * The columns a summary card can actually fit.
 *
 * `hideBelow` drops columns by VIEWPORT width, which is the wrong question
 * when the table sits in a two-of-three-column card: on a wide screen every
 * breakpoint is satisfied, all nine columns render, and they overflow the
 * narrow container instead — clipping uPnL, the one column worth showing.
 * A summary card gets a summary; the full table lives on /positions.
 */
const COMPACT_KEYS = new Set(["symbol", "side", "qty", "mark", "pnl"]);
const compactColumns = columns.filter((c) => COMPACT_KEYS.has(c.key));

export function PositionsTable({
  positions,
  frame,
  compact = false,
}: {
  positions: Position[];
  frame?: boolean;
  /** Summary view for a narrow container — see COMPACT_KEYS. */
  compact?: boolean;
}) {
  return (
    <DataTable
      rows={positions}
      columns={compact ? compactColumns : columns}
      rowKey={(p) => p.id}
      emptyLabel="No open positions"
      emptyHint="Positions appear here once a strategy opens one."
      caption="Open positions with entry, mark price and unrealized PnL"
      frame={frame}
    />
  );
}
