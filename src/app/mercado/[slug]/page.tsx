import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Icon from "@/components/Icon";
import { getMarketBySlug } from "@/lib/queries/markets";
import MarketView from "./MarketView";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const market = await getMarketBySlug(slug);
  if (!market) return { title: "Mercado não encontrado" };
  const yesPercent = Math.round(market.priceYes * 100);
  return {
    title: market.title,
    description: `${market.subtitle || market.title} — ${yesPercent}% Sim. Negocie na Odd.`,
    openGraph: {
      title: `${market.title} — ${yesPercent}% Sim`,
      description: market.subtitle || market.title,
    },
  };
}

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
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-text-tertiary mb-4">
          <Link href="/" className="hover:text-text-secondary transition-colors">Início</Link>
          <Icon name="chevron-right" className="w-3 h-3 opacity-50" />
          <Link href="/explorar" className="hover:text-text-secondary transition-colors">Explorar</Link>
          <Icon name="chevron-right" className="w-3 h-3 opacity-50" />
          <span className="text-text-secondary truncate max-w-[200px]">{market.title}</span>
        </nav>
        <MarketView market={market} />
      </main>
    </div>
  );
}
