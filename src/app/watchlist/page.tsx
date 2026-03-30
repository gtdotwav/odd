"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import MarketCard from "@/components/MarketCard";
import EmptyState from "@/components/EmptyState";
import { MarketGridSkeleton } from "@/components/Skeleton";
import Link from "next/link";

export default function WatchlistPage() {
  const { isSignedIn: clerkSignedIn } = useAuth();
  const isSignedIn = !!clerkSignedIn;

  const { data, isLoading } = useQuery({
    queryKey: ["watchlist"],
    queryFn: () => fetch("/api/watchlist").then((r) => r.json()),
    enabled: isSignedIn,
  });

  const markets = data?.markets ?? [];

  return (
    <div className="flex max-w-[1440px] mx-auto">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-text">Watchlist</h1>
          {markets.length > 0 && (
            <span className="text-xs text-text-tertiary">
              {markets.length} {markets.length === 1 ? "mercado" : "mercados"}
            </span>
          )}
        </div>

        {!isSignedIn ? (
          <EmptyState
            icon="star"
            title="Faça login para usar a watchlist"
            description="Entre na sua conta para acompanhar mercados e receber alertas."
          />
        ) : isLoading ? (
          <MarketGridSkeleton count={6} />
        ) : markets.length === 0 ? (
          <EmptyState
            icon="star"
            title="Sua watchlist está vazia"
            description="Adicione mercados à sua watchlist clicando no ícone de estrela em qualquer mercado."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {markets.map((m: { id: string; slug: string; title: string; [key: string]: unknown }) => (
              <MarketCard key={m.id} market={m as never} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
