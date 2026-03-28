"use client";

import { useQuery } from "@tanstack/react-query";
import type { Market, MarketDetail, MarketsResponse } from "@/types/market";

interface UseMarketsOptions {
  category?: string;
  status?: string;
  tab?: string;
  sort?: string;
  search?: string;
  limit?: number;
}

async function fetchMarkets(options: UseMarketsOptions = {}): Promise<MarketsResponse> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }
  const res = await fetch(`/api/markets?${params}`);
  if (!res.ok) throw new Error("Failed to fetch markets");
  return res.json();
}

async function fetchMarketBySlug(slug: string): Promise<MarketDetail> {
  const res = await fetch(`/api/markets/${slug}`);
  if (!res.ok) throw new Error("Failed to fetch market");
  return res.json();
}

export function useMarkets(options: UseMarketsOptions = {}) {
  return useQuery<MarketsResponse>({
    queryKey: ["markets", options],
    queryFn: () => fetchMarkets(options),
  });
}

export function useMarket(slug: string) {
  return useQuery<MarketDetail>({
    queryKey: ["market", slug],
    queryFn: () => fetchMarketBySlug(slug),
    enabled: !!slug,
  });
}

export function useTopMovers() {
  return useQuery<MarketsResponse>({
    queryKey: ["markets", { sort: "variation", limit: 10 }],
    queryFn: () => fetchMarkets({ sort: "variation", limit: 10 }),
  });
}

export function useFeaturedMarket() {
  return useQuery<Market | null>({
    queryKey: ["market", "featured"],
    queryFn: async () => {
      const res = await fetchMarkets({ sort: "relevance", limit: 1 });
      return res.markets.find((m) => m.featured) || res.markets[0] || null;
    },
  });
}
