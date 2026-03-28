import Sidebar from "@/components/Sidebar";
import { getMarkets } from "@/lib/queries/markets";
import MarketGrid from "./MarketGrid";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const category = params.category;
  const tab = params.tab;
  const sort = params.sort || "relevance";
  const search = params.search;

  const { markets, total } = await getMarkets({
    category,
    tab,
    sort,
    search,
    limit: 30,
  });

  return (
    <div className="flex max-w-[1440px] mx-auto">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
        <h1 className="text-xl font-bold text-text mb-4">Explorar mercados</h1>
        <MarketGrid
          initialMarkets={markets}
          total={total}
          activeCategory={category}
          activeTab={tab}
          activeSort={sort}
          activeSearch={search}
        />
      </main>
    </div>
  );
}
