import { MarketCardSkeleton } from "@/components/Skeleton";
import { Skeleton } from "@/components/Skeleton";

export default function HomeLoading() {
  return (
    <div className="flex max-w-[1440px] mx-auto">
      <div className="hidden lg:block w-60 shrink-0" />
      <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
        {/* Hero skeleton */}
        <div className="rounded-xl border border-border bg-surface p-6 mb-6">
          <Skeleton className="h-8 w-2/3 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-5" />
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>

        {/* Stats skeleton */}
        <div className="flex items-center gap-6 mb-6 py-3 px-4 rounded-lg bg-surface border border-border">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <MarketCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
