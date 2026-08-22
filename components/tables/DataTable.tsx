import clsx from "clsx";
import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  render: (row: T) => ReactNode;
  className?: string;
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
  caption,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  emptyLabel?: string;
  caption?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-edge bg-surface/40 px-6 py-12 text-center text-sm text-muted">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-card border border-line bg-surface/70 shadow-card">
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
                  alignClass[c.align ?? "left"]
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
