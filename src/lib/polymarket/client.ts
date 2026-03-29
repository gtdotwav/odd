const GAMMA_BASE = "https://gamma-api.polymarket.com";

export interface PolymarketEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  volume: number;
  volume24hr: number;
  liquidity: number;
  startDate: string;
  endDate: string;
  image: string;
  icon: string;
  active: boolean;
  closed: boolean;
  featured: boolean;
  competitive: number;
  commentCount: number;
  tags: { id: string; label: string; slug: string }[];
  markets: PolymarketMarket[];
}

export interface PolymarketMarket {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  description: string;
  outcomes: string; // JSON string: '["Yes","No"]'
  outcomePrices: string; // JSON string: '["0.52","0.48"]'
  volume: string;
  volumeNum: number;
  liquidity: string;
  liquidityNum: number;
  active: boolean;
  closed: boolean;
  category: string;
  endDate: string;
  image: string;
  icon: string;
  featured: boolean;
  oneDayPriceChange: number;
  oneWeekPriceChange: number;
  lastTradePrice: number;
  bestBid: number;
  bestAsk: number;
  clobTokenIds: string; // JSON string
  marketType: string;
}

export async function fetchTopEvents(limit = 30): Promise<PolymarketEvent[]> {
  const url = new URL(`${GAMMA_BASE}/events`);
  url.searchParams.set("active", "true");
  url.searchParams.set("closed", "false");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("order", "volume24hr");
  url.searchParams.set("ascending", "false");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Polymarket API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function fetchEventBySlug(slug: string): Promise<PolymarketEvent | null> {
  const url = new URL(`${GAMMA_BASE}/events/slug/${slug}`);
  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });

  if (!res.ok) return null;
  return res.json();
}

export async function fetchTags(): Promise<{ id: string; label: string; slug: string }[]> {
  const res = await fetch(`${GAMMA_BASE}/tags`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });

  if (!res.ok) return [];
  return res.json();
}
