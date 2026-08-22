"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useDashboard } from "@/lib/providers/DashboardProvider";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/positions", label: "Positions" },
  { href: "/trades", label: "Trades" },
  { href: "/decisions", label: "Decisions" },
  { href: "/performance", label: "Performance" },
  { href: "/compare", label: "Compare" },
  { href: "/system", label: "System" },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { source } = useDashboard();
  const sourceLabel = source === "supabase" ? "Supabase mode" : "Mock mode";
  const sourceHint =
    source === "supabase"
      ? "Data comes from the Supabase observability replica (read-only)."
      : "Data is served from local RUN-3 fixtures. Supabase is not connected.";
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-zinc-800/80 bg-zinc-950/80 px-4 py-6">
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="h-6 w-6 rounded bg-gradient-to-br from-cyan-400 to-emerald-500" />
        <span className="font-semibold tracking-tight">Trading Lab</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-zinc-800/80 text-zinc-50"
                  : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6 rounded-lg border border-zinc-800/70 bg-zinc-900/40 p-3 text-xs text-zinc-400">
        <div className="font-medium text-zinc-200">{sourceLabel}</div>
        <p className="mt-1 leading-snug">{sourceHint}</p>
      </div>
    </aside>
  );
}
