export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-10 text-center">
      <p className="text-sm font-medium text-zinc-300">{title}</p>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}
