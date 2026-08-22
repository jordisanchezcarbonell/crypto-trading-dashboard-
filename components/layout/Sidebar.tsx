"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useDashboard } from "@/lib/providers/DashboardProvider";
import { NAV, isActive } from "./nav";

export function Sidebar() {
  const pathname = usePathname();
  const { source, snapshot } = useDashboard();
  const supabase = source === "supabase";
  const sourceHint = supabase
    ? "Data comes from the Supabase observability replica (read-only)."
    : "Data is served from local RUN-3 fixtures. Supabase is not connected.";

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface/50 px-3 py-5 backdrop-blur-sm lg:flex">
      <Link
        href="/"
        className="mb-7 flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-raised/60"
      >
        <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-accent to-pos shadow-[0_0_16px_-4px_var(--color-accent)]">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 text-base"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m4 16 4.5-5 3.5 3 7.5-8" />
          </svg>
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight text-ink">
            Trading Lab
          </span>
          <span className="num text-[10px] text-faint">{snapshot.runId}</span>
        </span>
      </Link>

      <nav aria-label="Main" className="flex flex-1 flex-col gap-0.5">
        {NAV.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150",
                active
                  ? "bg-raised text-ink"
                  : "text-muted hover:bg-raised/50 hover:text-ink"
              )}
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-accent"
                />
              )}
              <Icon
                className={clsx(
                  "h-4 w-4 shrink-0 transition-colors",
                  active ? "text-accent" : "text-faint group-hover:text-muted"
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 rounded-xl border border-line bg-surface/80 p-3">
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              "h-1.5 w-1.5 rounded-full",
              supabase ? "bg-pos" : "bg-warn"
            )}
            aria-hidden="true"
          />
          <span className="text-xs font-medium text-ink">
            {supabase ? "Supabase mode" : "Mock mode"}
          </span>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-faint">
          {sourceHint}
        </p>
      </div>
    </aside>
  );
}
