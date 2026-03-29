import { MarketDetailSkeleton } from "@/components/Skeleton";

export default function MarketLoading() {
  return (
    <div className="flex max-w-[1440px] mx-auto">
      <div className="hidden lg:block w-60 shrink-0" />
      <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
        <MarketDetailSkeleton />
      </main>
    </div>
  );
}
