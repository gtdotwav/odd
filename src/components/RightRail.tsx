import Link from "next/link";
import { getTopMovers } from "@/lib/queries/markets";
import { getRecentActivity, getTopTraders } from "@/lib/queries/activity";
import { formatVolume, formatVariation, formatCurrency, formatRelativeTime } from "@/lib/utils";
import Icon from "./Icon";

export default async function RightRail() {
  const [movers, activity, topTraders] = await Promise.all([
    getTopMovers(5),
    getRecentActivity(5),
    getTopTraders(5),
  ]);

  const trending = [...movers].sort((a, b) => Math.abs(b.variation24h) - Math.abs(a.variation24h));

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
            <Link key={m.id} href={`/mercado/${m.slug}`} className="flex items-start gap-2 py-1.5 hover:bg-surface-raised rounded px-1 -mx-1 transition-colors">
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
            </Link>
          ))}
        </div>
      </section>

      {/* Live Feed */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-down mr-1.5 animate-pulse-live" />
          Feed ao vivo
        </h3>
        {activity.length === 0 ? (
          <p className="text-xs text-text-tertiary py-2">Nenhuma atividade recente.</p>
        ) : (
          <div className="space-y-2.5">
            {activity.map((a) => (
              <div key={a.id} className="text-xs text-text-secondary leading-relaxed">
                <Link href={`/u/${a.handle}`} className="text-accent hover:underline">@{a.handle}</Link>
                {" "}{a.action === "buy" ? "comprou" : "vendeu"} {a.side === "yes" ? "Sim" : "Não"} em
                {" "}&ldquo;<Link href={`/mercado/${a.marketSlug}`} className="hover:underline">{a.marketTitle}</Link>&rdquo;
                {" "}· {formatCurrency(a.amount)}
                {" "}· <span className="text-text-tertiary">{formatRelativeTime(a.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Top Traders */}
      <section>
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">
          <Icon name="trophy" className="w-3.5 h-3.5 text-accent opacity-70" />
          Top traders
        </h3>
        {topTraders.length === 0 ? (
          <p className="text-xs text-text-tertiary py-2">Ainda sem dados de ranking.</p>
        ) : (
          <div className="space-y-2">
            {topTraders.map((t, i) => (
              <Link key={t.handle} href={`/u/${t.handle}`} className="flex items-center gap-2 text-sm hover:bg-surface-raised rounded px-1 -mx-1 py-0.5 transition-colors">
                <span className={`w-5 text-center text-xs font-mono ${rankBadge(i + 1)}`}>{i + 1}</span>
                <span className="flex-1 text-text-secondary truncate">@{t.handle}</span>
                <span className={`font-mono text-xs ${t.totalPnl >= 0 ? "text-up" : "text-down"}`}>
                  {t.totalPnl >= 0 ? "+" : ""}{formatCurrency(t.totalPnl)}
                </span>
              </Link>
            ))}
          </div>
        )}
        <Link href="/rankings" className="mt-2 text-xs text-accent hover:underline inline-block">Ver ranking completo →</Link>
      </section>
    </aside>
  );
}
