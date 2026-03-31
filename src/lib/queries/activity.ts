import { createClient } from "@/lib/supabase/server";

interface ActivityItem {
  id: string;
  handle: string;
  action: "buy" | "sell";
  side: "yes" | "no";
  amount: number;
  marketTitle: string;
  marketSlug: string;
  createdAt: string;
}

interface TopTrader {
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  totalVolume: number;
  totalTrades: number;
  totalPnl: number;
}

export async function getRecentActivity(limit = 5): Promise<ActivityItem[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("activity_log")
      .select("id, action, side, amount, created_at, user_id, market_id")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) return [];

    // Fetch related profiles and markets
    const userIds = [...new Set(data.map((d) => d.user_id))];
    const marketIds = [...new Set(data.map((d) => d.market_id))];

    const [profilesRes, marketsRes] = await Promise.all([
      supabase.from("profiles").select("clerk_id, handle").in("clerk_id", userIds),
      supabase.from("markets").select("id, title, slug").in("id", marketIds),
    ]);

    const profileMap = new Map(
      (profilesRes.data || []).map((p) => [p.clerk_id, p]),
    );
    const marketMap = new Map(
      (marketsRes.data || []).map((m) => [m.id, m]),
    );

    return data
      .map((row) => {
        const profile = profileMap.get(row.user_id);
        const market = marketMap.get(row.market_id);
        if (!profile || !market) return null;
        return {
          id: row.id,
          handle: profile.handle,
          action: row.action as "buy" | "sell",
          side: row.side as "yes" | "no",
          amount: Number(row.amount),
          marketTitle: market.title,
          marketSlug: market.slug,
          createdAt: row.created_at,
        };
      })
      .filter((item): item is ActivityItem => item !== null);
  } catch {
    return [];
  }
}

export async function getTopTraders(limit = 5): Promise<TopTrader[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_leaderboard", {
      p_limit: limit,
    });

    if (error || !data) return [];

    return (data as Array<{
      handle: string;
      display_name: string;
      avatar_url: string | null;
      total_volume: number;
      total_trades: number;
      total_pnl: number;
    }>).map((row) => ({
      handle: row.handle,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      totalVolume: Number(row.total_volume),
      totalTrades: Number(row.total_trades),
      totalPnl: Number(row.total_pnl),
    }));
  } catch {
    return [];
  }
}
