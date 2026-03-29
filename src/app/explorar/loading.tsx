import { MarketGridSkeleton, Skeleton } from "@/components/Skeleton";

export default function ExplorarLoading() {
  return (
    <div className="flex max-w-[1440px] mx-auto">
      <div className="hidden lg:block w-60 shrink-0" />
      <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="flex gap-2 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-md" />
          ))}
        </div>
        <MarketGridSkeleton count={9} />
      </main>
    </div>
  );
}
