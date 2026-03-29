import { getTopMovers } from "@/lib/queries/markets";
import { formatVolume, formatVariation } from "@/lib/utils";
import Icon from "./Icon";

export default async function RightRail() {
  const movers = await getTopMovers(5);

  const trending = [...movers].sort((a, b) => Math.abs(b.variation24h) - Math.abs(a.variation24h));

  // TODO: Replace with real activity_log query when users exist
  const recentActivity = [
    { user: "@macro_king", action: "comprou Sim", market: "Selic sobe em maio?", amount: "R$ 50K", time: "agora" },
    { user: "@ana_trade", action: "vendeu Não", market: "Lula reeleito?", amount: "R$ 2K", time: "1min" },
    { user: "@bbb_expert", action: "comprou Sim", market: "BBB: Ana vence?", amount: "R$ 800", time: "2min" },
    { user: "@cripto_br", action: "vendeu Sim", market: "BTC > $100K?", amount: "R$ 5K", time: "3min" },
    { user: "@fla_sempre", action: "comprou Sim", market: "Fla campeão?", amount: "R$ 1.2K", time: "5min" },
  ];

  const rankBadge = (rank: number) => {
    if (rank === 1) return "text-accent font-bold";
    if (rank === 2) return "text-text-secondary font-semibold";
    if (rank === 3) return "text-text-tertiary font-semibold";
    return "text-text-tertiary";
  };

  return (
    <aside className="hidden xl:block w-80 shrink-0 border-l border-border overflow-y-auto h-[calc(100vh-80px)] sticky top-20 p-4 space-y-6">
      {/* Trending */}
      <section>
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">
          <Icon name="fire" className="w-3.5 h-3.5 text-accent opacity-70" />
          Em alta
        </h3>
        <div className="space-y-2">
          {trending.map((m) => (
            <div key={m.id} className="flex items-start gap-2 py-1.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text truncate">{m.title}</p>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <span className="font-mono">{Math.round(m.priceYes * 100)}%</span>
                  <span className={`font-mono ${m.variation24h >= 0 ? "text-up" : "text-down"}`}>
                    {formatVariation(m.variation24h)}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-text-tertiary">{formatVolume(m.volume)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Live Feed */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-down mr-1.5 animate-pulse-live" />
          Feed ao vivo
        </h3>
        <div className="space-y-2.5">
          {recentActivity.map((a, i) => (
            <div key={i} className="text-xs text-text-secondary leading-relaxed">
              <span className="text-accent">{a.user}</span> {a.action} em &ldquo;{a.market}&rdquo; · {a.amount} · <span className="text-text-tertiary">{a.time}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Top Traders */}
      <section>
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">
          <Icon name="trophy" className="w-3.5 h-3.5 text-accent opacity-70" />
          Top traders semana
        </h3>
        <div className="space-y-2">
          {[
            { rank: 1, name: "@macro_king", pnl: "+R$ 12,4K" },
            { rank: 2, name: "@selic_bull", pnl: "+R$ 8,9K" },
            { rank: 3, name: "@crypto_ana", pnl: "+R$ 7,2K" },
            { rank: 4, name: "@bbb_expert", pnl: "+R$ 5,8K" },
            { rank: 5, name: "@fla_trader", pnl: "+R$ 4,1K" },
          ].map((t) => (
            <div key={t.rank} className="flex items-center gap-2 text-sm">
              <span className={`w-5 text-center text-xs font-mono ${rankBadge(t.rank)}`}>{t.rank}</span>
              <span className="flex-1 text-text-secondary">{t.name}</span>
              <span className="font-mono text-xs text-up">{t.pnl}</span>
            </div>
          ))}
        </div>
        <button type="button" className="mt-2 text-xs text-accent hover:underline">Ver ranking completo →</button>
      </section>
    </aside>
  );
}
