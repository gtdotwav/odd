import MarketCard from "@/components/MarketCard";
import Sidebar from "@/components/Sidebar";
import RightRail from "@/components/RightRail";
import { getMarkets, getFeaturedMarket, getStats } from "@/lib/queries/markets";
import { formatVolume } from "@/lib/utils";
import Link from "next/link";

const tabs = [
  { label: "Em alta", tab: "trending" },
  { label: "Novos", tab: "new" },
  { label: "Popular", tab: "popular" },
  { label: "Líquido", tab: "liquid" },
  { label: "Fechando", tab: "closing" },
  { label: "Disputado", tab: "disputed" },
  { label: "Brasil", tab: "brazil" },
];

function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-accent/5 via-surface to-surface mb-6">
      <div className="p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-text mb-2">
          Quanto você aposta<br />no que acredita?
        </h1>
        <p className="text-text-secondary text-sm md:text-base max-w-lg mb-5">
          A Odd é o mercado onde você negocia probabilidades sobre o que vai acontecer no Brasil e no mundo. Sua opinião vale. Literalmente.
        </p>
        <div className="flex gap-3">
          <Link href="/auth/cadastro" className="px-5 py-2.5 rounded-lg bg-highlight hover:bg-highlight-hover text-white text-sm font-semibold transition-colors inline-block">
            Começar agora →
          </Link>
          <Link href="/explorar" className="px-5 py-2.5 rounded-lg border border-border text-text-secondary hover:text-text hover:border-border-strong text-sm font-medium transition-colors">
            Explorar mercados
          </Link>
        </div>
      </div>
      <div className="absolute -right-20 -top-20 w-60 h-60 rounded-full bg-accent/10 blur-3xl" />
    </section>
  );
}

async function StatsBar() {
  const { totalVolume, activeCount } = await getStats();
  return (
    <div className="flex items-center gap-6 mb-6 py-3 px-4 rounded-lg bg-surface border border-border">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-text-tertiary">Volume total</p>
        <p className="font-mono font-semibold text-text">{formatVolume(totalVolume)}</p>
      </div>
      <div className="w-px h-8 bg-border" />
      <div>
        <p className="text-[10px] uppercase tracking-wider text-text-tertiary">Mercados ativos</p>
        <p className="font-mono font-semibold text-text">{activeCount}</p>
      </div>
      <div className="w-px h-8 bg-border" />
      <div>
        <p className="text-[10px] uppercase tracking-wider text-text-tertiary">Traders</p>
        <p className="font-mono font-semibold text-text">—</p>
      </div>
    </div>
  );
}

async function FeaturedCard() {
  const featured = await getFeaturedMarket();
  if (!featured) return null;
  return <MarketCard market={featured} featured />;
}

export default async function Home() {
  const { markets: activeMarkets } = await getMarkets({ limit: 9, sort: "relevance" });
  const featured = await getFeaturedMarket();
  const gridMarkets = activeMarkets.filter((m) => m.slug !== featured?.slug).slice(0, 6);

  const { markets: brasilMarkets } = await getMarkets({ tab: "brazil", limit: 3 });

  return (
    <div className="flex max-w-[1440px] mx-auto">
      <Sidebar />

      <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
        <HeroSection />
        <StatsBar />

        {/* Featured */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-3">Destaque do dia</h2>
          <FeaturedCard />
        </section>

        {/* Discovery Tabs */}
        <section className="mb-6">
          <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
            {tabs.map((tab, i) => (
              <Link
                key={tab.tab}
                href={`/explorar?tab=${tab.tab}`}
                className={`shrink-0 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  i === 0
                    ? "bg-accent/10 text-accent"
                    : "text-text-secondary hover:text-text hover:bg-surface-raised"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {gridMarkets.map((m) => (
              <MarketCard key={m.id} market={m} />
            ))}
          </div>

          <div className="text-center mt-4">
            <Link href="/explorar" className="text-sm text-accent hover:underline">
              Ver todos os mercados →
            </Link>
          </div>
        </section>

        {/* Brasil Agora */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-3">
            Brasil agora
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {brasilMarkets.map((m) => (
              <MarketCard key={m.id} market={m} />
            ))}
          </div>
        </section>
      </main>

      <RightRail />
    </div>
  );
}
