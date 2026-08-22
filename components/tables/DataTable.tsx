import clsx from "clsx";
import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  render: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  emptyLabel = "No data",
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  emptyLabel?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-10 text-center text-sm text-zinc-400">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-900/40">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800/80 text-xs uppercase tracking-wide text-zinc-500">
            {columns.map((c) => (
              <th
                key={c.key}
                className={clsx(
                  "px-4 py-3 font-medium",
                  c.align === "right"
                    ? "text-right"
                    : c.align === "center"
                      ? "text-center"
                      : "text-left"
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="text-zinc-200 hover:bg-zinc-800/30"
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={clsx(
                    "px-4 py-3 tabular-nums",
                    c.align === "right"
                      ? "text-right"
                      : c.align === "center"
                        ? "text-center"
                        : "text-left",
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
