export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-surface-raised ${className}`} />;
}

export function MarketCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-3" />
      <div className="space-y-1.5 mb-3">
        <div className="flex h-1.5 rounded-full overflow-hidden bg-border">
          <Skeleton className="w-3/5 rounded-none" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="flex gap-2 mt-3">
        <Skeleton className="flex-1 h-9 rounded-md" />
        <Skeleton className="flex-1 h-9 rounded-md" />
      </div>
    </div>
  );
}

export function MarketGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <MarketCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function MarketDetailSkeleton() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-8 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-3" />
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex-1 space-y-5">
          <div className="bg-surface rounded-lg border border-border p-4">
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-[220px] w-full rounded" />
          </div>
          <div className="bg-surface rounded-lg border border-border p-4">
            <Skeleton className="h-5 w-32 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <div className="lg:w-80 shrink-0">
          <div className="bg-surface rounded-lg border border-border p-4">
            <Skeleton className="h-5 w-20 mb-3" />
            <Skeleton className="h-10 w-full rounded-md mb-4" />
            <Skeleton className="h-10 w-full rounded-md mb-3" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
