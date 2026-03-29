import type { Metadata } from "next";
import MarketCard from "@/components/MarketCard";
import Sidebar from "@/components/Sidebar";
import EmptyState from "@/components/EmptyState";
import { getDailyMarkets } from "@/lib/queries/markets";
import type { Market } from "@/types/market";
import Icon from "@/components/Icon";
import CountdownBadge from "./CountdownBadge";

export const metadata: Metadata = {
  title: "Diárias",
  description: "Mercados que resolvem nas próximas 48 horas na Odd. Aposte e veja o resultado hoje ou amanhã.",
};

function groupByCategory(markets: Market[]): Record<string, Market[]> {
  const groups: Record<string, Market[]> = {};
  for (const m of markets) {
    const cat = m.category || "Outros";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(m);
  }
  return groups;
}

export default async function DiariasPage() {
  const markets = await getDailyMarkets();
  const grouped = groupByCategory(markets);
  const categories = Object.entries(grouped);

  return (
    <div className="flex max-w-[1440px] mx-auto">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
        <div className="flex items-center gap-3 mb-5">
          <h1 className="text-xl font-bold text-text">Diárias</h1>
          <span className="text-xs text-text-tertiary">Resolvem nas próximas 48h</span>
          <span className="flex items-center gap-1.5 ml-auto px-2.5 py-1 rounded-full bg-highlight/10 text-highlight text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-highlight animate-pulse-live" />
            {markets.length} {markets.length === 1 ? "mercado" : "mercados"}
          </span>
        </div>

        {markets.length === 0 ? (
          <EmptyState
            icon="clock"
            title="Nenhum mercado resolve em breve"
            description="Não há mercados com resolução nas próximas 48 horas. Volte amanhã ou explore os mercados de longo prazo."
          />
        ) : (
          <>
            {/* Quick scroll of all dailies */}
            <div className="mb-6 p-4 rounded-xl border border-border bg-gradient-to-r from-surface via-surface to-highlight/5">
              <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                Próximos a resolver
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                {markets.slice(0, 8).map((m) => (
                  <div key={m.id} className="shrink-0 w-64">
                    <div className="mb-1.5">
                      <CountdownBadge resolutionDate={m.resolutionDate} />
                    </div>
                    <MarketCard market={m} />
                  </div>
                ))}
              </div>
            </div>

            {/* Grouped by category */}
            {categories.map(([category, items]) => (
              <section key={category} className="mb-6">
                <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                  {category}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {items.map((m) => (
                    <div key={m.id} className="relative">
                      <div className="absolute -top-1 right-2 z-10">
                        <CountdownBadge resolutionDate={m.resolutionDate} />
                      </div>
                      <MarketCard market={m} />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </main>
    </div>
  );
}
