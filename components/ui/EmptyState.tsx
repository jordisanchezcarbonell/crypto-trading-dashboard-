export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-card border border-dashed border-edge bg-surface/40 px-6 py-12 text-center">
      <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-raised text-faint">
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path
            d="M4 18V9m5 9V5m5 13v-6m5 6V8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <p className="text-sm font-medium text-ink">{title}</p>
      {hint && <p className="mt-1 text-xs text-faint">{hint}</p>}
    </div>
  );
}
