import clsx from "clsx";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Breakpoint below which a column is dropped entirely.
 *
 * Nine columns of prices do not fit a phone, and a silent horizontal scroll
 * hides the one number the reader came for. Rather than let the viewport
 * decide what falls off the right edge, each column declares how important
 * it is: identity and PnL survive everywhere, provenance drops first.
 */
export type ColumnBreakpoint = "sm" | "md" | "lg" | "xl";

const HIDE_BELOW: Record<ColumnBreakpoint, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  render: (row: T) => ReactNode;
  className?: string;
  /** Hide this column below the given breakpoint. Omit to always show. */
  hideBelow?: ColumnBreakpoint;
}

const alignClass = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const;

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  emptyLabel = "No data",
  emptyHint,
  caption,
  frame = true,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  emptyLabel?: string;
  emptyHint?: string;
  caption?: string;
  /**
   * Draw the table's own card chrome (border, radius, shadow).
   *
   * `true` for a table that IS the page (/positions, /trades). Pass `false`
   * when the table already sits inside a <Card>, otherwise the two borders
   * stack into a doubled hairline.
   */
  frame?: boolean;
}) {
  if (rows.length === 0) {
    // One empty state for the whole app — see components/ui/EmptyState.
    return <EmptyState title={emptyLabel} hint={emptyHint} />;
  }

  return (
    <div
      // A horizontally scrollable region has to be reachable by keyboard,
      // and needs an accessible name to be announced when it takes focus.
      role="region"
      aria-label={caption ?? "Data table"}
      tabIndex={0}
      className={clsx(
        "overflow-x-auto",
        frame && "rounded-card border border-line bg-surface/70 shadow-card"
      )}
    >
      <table className="min-w-full border-separate border-spacing-0 text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={clsx(
                  "eyebrow whitespace-nowrap border-b border-line bg-raised/40 px-4 py-2.5",
                  alignClass[c.align ?? "left"],
                  c.hideBelow && HIDE_BELOW[c.hideBelow]
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="group text-ink transition-colors duration-100 hover:bg-raised/60"
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={clsx(
                    "whitespace-nowrap border-b border-line/60 px-4 py-2.5 group-last:border-b-0",
                    // Numbers live in the right-aligned columns: give them the
                    // monospaced, tabular treatment so digits stack in a grid.
                    c.align === "right" && "num",
                    alignClass[c.align ?? "left"],
                    c.hideBelow && HIDE_BELOW[c.hideBelow],
                    c.className
                  )}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
