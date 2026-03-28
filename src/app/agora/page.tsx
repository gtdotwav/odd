import MarketCard from "@/components/MarketCard";
import Sidebar from "@/components/Sidebar";
import { getTopMovers } from "@/lib/queries/markets";
import { formatVariation } from "@/lib/utils";

export default async function AgoraPage() {
  const movers = await getTopMovers(10);

  // Sort by absolute variation descending
  const sorted = [...movers].sort((a, b) => Math.abs(b.variation24h) - Math.abs(a.variation24h));

  return (
    <div className="flex max-w-[1440px] mx-auto">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
        <div className="flex items-center gap-3 mb-5">
          <h1 className="text-xl font-bold text-text">Agora</h1>
          <span className="text-xs text-text-tertiary">Maiores movimentos nas últimas 24h</span>
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="w-2 h-2 rounded-full bg-down animate-pulse-live" />
            <span className="text-xs text-text-secondary">Atualizando ao vivo</span>
          </div>
        </div>

        {/* Hero mover */}
        {sorted[0] && (
          <div className="mb-6 p-5 rounded-xl border border-border bg-gradient-to-r from-surface via-surface to-accent/5">
            <span className="text-xs text-text-tertiary uppercase tracking-wider">Maior movimento</span>
            <h2 className="text-lg font-bold text-text mt-1">{sorted[0].title}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-2xl font-mono font-bold ${sorted[0].variation24h >= 0 ? "text-up" : "text-down"}`}>
                {formatVariation(sorted[0].variation24h)}
              </span>
              <span className="text-sm text-text-secondary">nas últimas 24h</span>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="px-4 py-2 rounded-md bg-up/10 text-up text-sm font-semibold hover:bg-up/20 transition-colors">
                Sim R${sorted[0].priceYes.toFixed(2)}
              </button>
              <button className="px-4 py-2 rounded-md bg-down/10 text-down text-sm font-semibold hover:bg-down/20 transition-colors">
                Não R${sorted[0].priceNo.toFixed(2)}
              </button>
            </div>
          </div>
        )}

        {/* Movers list */}
        <div className="space-y-3">
          {sorted.slice(1).map((m, i) => (
            <div key={m.id} className="flex items-center gap-4">
              <span className="text-lg font-mono text-text-tertiary w-6 text-right">{i + 2}</span>
              <div className="flex-1">
                <MarketCard market={m} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
