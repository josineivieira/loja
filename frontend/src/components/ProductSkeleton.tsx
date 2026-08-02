export function ProductSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 p-3 shadow-sm">
      <div className="aspect-square animate-pulse rounded-md bg-slate-100" />
      <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-slate-100" />
      <div className="mt-3 h-3 w-full animate-pulse rounded bg-slate-100" />
      <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-slate-100" />
      <div className="mt-5 h-5 w-20 animate-pulse rounded bg-slate-100" />
    </div>
  );
}

