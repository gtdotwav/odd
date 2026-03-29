import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import MarketCard from "@/components/MarketCard";
import EmptyState from "@/components/EmptyState";
import { getMarkets } from "@/lib/queries/markets";

export const metadata: Metadata = {
  title: "Watchlist",
  description: "Mercados que voce esta acompanhando na Odd.",
};

export default async function WatchlistPage() {
  // TODO: fetch from /api/watchlist — for now show a sample of markets
  // Once auth + watchlist API is ready, replace with actual watchlist data
  const { markets } = await getMarkets({ limit: 6, sort: "relevance" });

  // Simulate empty watchlist for unauthenticated users
  const isAuthenticated = false;
  const watchlistMarkets = isAuthenticated ? markets : [];

  return (
    <div className="flex max-w-[1440px] mx-auto">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-text">Watchlist</h1>
          {watchlistMarkets.length > 0 && (
            <span className="text-xs text-text-tertiary">
              {watchlistMarkets.length} {watchlistMarkets.length === 1 ? "mercado" : "mercados"}
            </span>
          )}
        </div>

        {watchlistMarkets.length === 0 ? (
          <EmptyState
            icon="star"
            title="Sua watchlist esta vazia"
            description="Adicione mercados a sua watchlist clicando no icone de estrela em qualquer mercado."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {watchlistMarkets.map((m) => (
              <MarketCard key={m.id} market={m} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
