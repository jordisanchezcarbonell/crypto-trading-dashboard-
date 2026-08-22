"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { NAV, isActive } from "./nav";
import { SHELL_WIDTH } from "./shell";

/** Horizontal scroller that replaces the sidebar below the `lg` breakpoint. */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className={`${SHELL_WIDTH} flex gap-1 overflow-x-auto border-b border-line bg-surface/60 py-2 backdrop-blur-sm lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
    >
      {NAV.map(({ href, label, Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-raised text-ink"
                : "text-muted hover:bg-raised/50 hover:text-ink"
            )}
          >
            <Icon
              className={clsx("h-3.5 w-3.5", active ? "text-accent" : "text-faint")}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
