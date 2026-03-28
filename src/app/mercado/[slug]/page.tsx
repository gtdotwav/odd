import { notFound } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { getMarketBySlug } from "@/lib/queries/markets";
import MarketView from "./MarketView";

export default async function MarketPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const market = await getMarketBySlug(slug);

  if (!market) {
    notFound();
  }

  return (
    <div className="flex max-w-[1440px] mx-auto">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
        <MarketView market={market} />
      </main>
    </div>
  );
}
