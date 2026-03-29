import { createClient } from "@/lib/supabase/server";
import type { Market, MarketDetail, PricePoint, MarketsResponse } from "@/types/market";
import type { Database } from "@/lib/supabase/types";

type MarketRow = Database["public"]["Tables"]["markets"]["Row"];
type OutcomeRow = Database["public"]["Tables"]["outcomes"]["Row"];
type SportRow = Database["public"]["Tables"]["sport_data"]["Row"];
type CryptoRow = Database["public"]["Tables"]["crypto_data"]["Row"];

interface MarketWithJoins extends MarketRow {
  outcomes: OutcomeRow[];
  sport_data: SportRow[];
  crypto_data: CryptoRow[];
}

interface ListOptions {
  category?: string;
  status?: string;
  tab?: string;
  sort?: string;
  search?: string;
  limit?: number;
  cursor?: string;
  featured?: boolean;
}

function mapRow(row: MarketWithJoins): Market {
  const m: Market = {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle || undefined,
    category: row.category,
    type: row.type as Market["type"],
    status: row.status as Market["status"],
    priceYes: Number(row.price_yes),
    priceNo: Number(row.price_no),
    variation24h: Number(row.variation_24h),
    volume: Number(row.volume),
    commentCount: Number(row.comment_count),
    resolutionDate: row.resolution_date,
    context: row.context || undefined,
    rules: row.rules || undefined,
    source: row.source || undefined,
    featured: row.featured || undefined,
    createdAt: row.created_at,
  };

  if (row.outcomes && row.outcomes.length > 0) {
    m.outcomes = row.outcomes.map((o) => ({
      id: o.id,
      label: o.label,
      probability: Number(o.probability),
    }));
  }

  const sport = row.sport_data?.[0];
  if (sport) {
    m.sport = {
      home: sport.home_team,
      away: sport.away_team,
      homeScore: sport.home_score != null ? Number(sport.home_score) : undefined,
      awayScore: sport.away_score != null ? Number(sport.away_score) : undefined,
      clock: sport.clock || undefined,
    };
  }

  const crypto = row.crypto_data?.[0];
  if (crypto) {
    m.crypto = {
      asset: crypto.asset,
      currentPrice: Number(crypto.current_price),
      targetPrice: Number(crypto.target_price),
    };
  }

  return m;
}

const JOINED_SELECT = "*, outcomes(*), sport_data(*), crypto_data(*)";

export async function getMarkets(options: ListOptions = {}): Promise<MarketsResponse> {
  const supabase = await createClient();
  const {
    category,
    status,
    tab,
    sort = "relevance",
    search,
    limit = 20,
    cursor,
    featured,
  } = options;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = supabase.from("markets").select(JOINED_SELECT, { count: "exact" }) as any;

  if (status) {
    query = query.eq("status", status);
  } else {
    query = query.not("status", "in", '("draft","cancelled")');
  }

  if (category && category !== "Todas") {
    query = query.eq("category", category);
  }

  if (featured !== undefined) {
    query = query.eq("featured", featured);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,subtitle.ilike.%${search}%`);
  }

  if (tab) {
    switch (tab) {
      case "trending":
        query = query.not("status", "like", "resolved%").order("variation_24h", { ascending: false });
        break;
      case "new":
        query = query.not("status", "like", "resolved%").order("created_at", { ascending: false });
        break;
      case "popular":
        query = query.not("status", "like", "resolved%").order("comment_count", { ascending: false });
        break;
      case "liquid":
        query = query.not("status", "like", "resolved%").order("volume", { ascending: false });
        break;
      case "closing":
        query = query.eq("status", "closing");
        break;
      case "disputed":
        query = query.eq("status", "disputed");
        break;
      case "brazil":
        query = query.in("category", ["Economia", "Política", "Futebol"]);
        break;
    }
  }

  if (!tab || tab === "all") {
    switch (sort) {
      case "volume":
        query = query.order("volume", { ascending: false });
        break;
      case "variation":
        query = query.order("variation_24h", { ascending: false });
        break;
      case "resolution":
        query = query.order("resolution_date", { ascending: true });
        break;
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
      default:
        query = query.order("featured", { ascending: false }).order("volume", { ascending: false });
        break;
    }
  }

  if (cursor) {
    query = query.gt("id", cursor);
  }

  query = query.limit(limit);

  const { data, error, count } = await query;

  if (error) {
    console.error("getMarkets error:", error);
    return { markets: [], total: 0, hasMore: false };
  }

  const rows = (data || []) as MarketWithJoins[];
  const markets = rows.map(mapRow);

  return {
    markets,
    total: (count as number) || 0,
    hasMore: markets.length === limit,
  };
}

export async function getMarketBySlug(slug: string): Promise<MarketDetail | null> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row, error } = await (supabase.from("markets").select(JOINED_SELECT).eq("slug", slug).single() as any);

  if (error || !row) return null;

  const market = mapRow(row as MarketWithJoins);

  type PriceHistoryRow = Database["public"]["Tables"]["price_history"]["Row"];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: historyRows } = await (supabase
    .from("price_history")
    .select("*")
    .eq("market_id", row.id)
    .order("recorded_at", { ascending: true })
    .limit(500) as any);

  const priceHistory: PricePoint[] = ((historyRows || []) as PriceHistoryRow[]).map((h) => ({
    priceYes: Number(h.price_yes),
    priceNo: Number(h.price_no),
    volumeDelta: Number(h.volume_delta),
    recordedAt: h.recorded_at,
  }));

  return { ...market, priceHistory };
}

export async function getTopMovers(limit = 10): Promise<Market[]> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("markets")
    .select(JOINED_SELECT)
    .not("status", "like", "resolved%")
    .not("status", "in", '("draft","cancelled")')
    .order("variation_24h", { ascending: false })
    .limit(limit) as any);

  if (error || !data) return [];
  return (data as MarketWithJoins[]).map(mapRow);
}

export async function getFeaturedMarket(): Promise<Market | null> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("markets")
    .select(JOINED_SELECT)
    .eq("featured", true)
    .not("status", "like", "resolved%")
    .order("volume", { ascending: false })
    .limit(1)
    .single() as any);

  if (error || !data) return null;
  return mapRow(data as MarketWithJoins);
}

export async function getDailyMarkets(): Promise<Market[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const limit48h = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("markets")
    .select(JOINED_SELECT)
    .gte("resolution_date", now)
    .lte("resolution_date", limit48h)
    .in("status", ["active", "live", "closing"])
    .order("resolution_date", { ascending: true })
    .limit(50) as any);

  if (error || !data) return [];
  return (data as MarketWithJoins[]).map(mapRow);
}

export async function getStats(): Promise<{ totalVolume: number; activeCount: number }> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase
    .from("markets")
    .select("volume, status")
    .not("status", "in", '("draft","cancelled")') as any);

  const rows = (data || []) as { volume: number; status: string }[];

  const totalVolume = rows.reduce((sum, m) => sum + Number(m.volume), 0);
  const activeCount = rows.filter((m) => !m.status.startsWith("resolved")).length;

  return { totalVolume, activeCount };
}
