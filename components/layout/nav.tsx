import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

const OverviewIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="3" width="7" height="8" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="11" width="7" height="10" rx="1.5" />
  </Icon>
);

const PositionsIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" />
    <path d="m4 12 8 4.5 8-4.5" />
    <path d="m4 16.5 8 4.5 8-4.5" />
  </Icon>
);

const TradesIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 8h13l-3-3" />
    <path d="M20 16H7l3 3" />
  </Icon>
);

const DecisionsIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="6" cy="6" r="2.5" />
    <circle cx="6" cy="18" r="2.5" />
    <circle cx="18" cy="12" r="2.5" />
    <path d="M6 8.5v7M8.5 6h4a3 3 0 0 1 3 3v1M8.5 18h4a3 3 0 0 0 3-3v-1" />
  </Icon>
);

const PerformanceIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 20h18" />
    <path d="m4 15 5-6 4 4 6-8" />
    <path d="M19 5h-3.5M19 5v3.5" />
  </Icon>
);

const CompareIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 21V9M12 21V4M19 21v-7" />
  </Icon>
);

const ResearchIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M10 3h4" />
    <path d="M11 3v6.2L5.6 18A2 2 0 0 0 7.3 21h9.4a2 2 0 0 0 1.7-3L13 9.2V3" />
    <path d="M8.5 14h7" />
  </Icon>
);

const SystemIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="7" rx="2" />
    <rect x="3" y="13" width="18" height="7" rx="2" />
    <path d="M7 7.5h.01M7 16.5h.01" />
  </Icon>
);

export const NAV = [
  { href: "/", label: "Overview", Icon: OverviewIcon },
  { href: "/positions", label: "Positions", Icon: PositionsIcon },
  { href: "/trades", label: "Trades", Icon: TradesIcon },
  { href: "/decisions", label: "Decisions", Icon: DecisionsIcon },
  { href: "/performance", label: "Performance", Icon: PerformanceIcon },
  { href: "/compare", label: "Compare", Icon: CompareIcon },
  { href: "/research", label: "Research", Icon: ResearchIcon },
  { href: "/system", label: "System", Icon: SystemIcon },
] as const;

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
