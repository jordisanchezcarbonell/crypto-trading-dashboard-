import clsx from "clsx";
import type { ReactNode } from "react";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-zinc-800/80 bg-zinc-900/40 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-800/60 px-5 py-4">
      <div>
        <h3 className="text-sm font-medium text-zinc-100">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p>
        )}
      </div>
      {right}
    </div>
  );
}

export function CardBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={clsx("px-5 py-4", className)}>{children}</div>;
}
