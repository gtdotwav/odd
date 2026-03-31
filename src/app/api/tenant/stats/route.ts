import { NextResponse } from "next/server";
import { getTenantId } from "@/lib/tenant-auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const tenantId = await getTenantId();
  if (!tenantId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // Total users
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Users last 24h
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: users24h } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", yesterday);

    // Users last 7d
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: users7d } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo);

    // Users last 30d
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: users30d } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthAgo);

    // KYC stats
    const { count: kycVerified } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("kyc_status", "verified");

    const { count: kycPending } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("kyc_status", "pending");

    // Active markets
    const { count: activeMarkets } = await supabase
      .from("markets")
      .select("*", { count: "exact", head: true })
      .in("status", ["active", "live"]);

    // Total volume
    const { data: volumeData } = await supabase
      .from("markets")
      .select("volume")
      .in("status", ["active", "live", "resolved_yes", "resolved_no", "closing"] as const);

    const totalVolume = (volumeData ?? []).reduce((sum, m) => sum + (m.volume ?? 0), 0);

    // Total deposits
    const { data: depositsData } = await supabase
      .from("transactions")
      .select("amount")
      .eq("type", "deposit")
      .eq("status", "completed");

    const totalDeposits = (depositsData ?? []).reduce((sum, t) => sum + (t.amount ?? 0), 0);

    // Total withdrawals
    const { data: withdrawData } = await supabase
      .from("transactions")
      .select("amount")
      .eq("type", "withdrawal")
      .eq("status", "completed");

    const totalWithdrawals = (withdrawData ?? []).reduce((sum, t) => sum + Math.abs(t.amount ?? 0), 0);

    // Total fees
    const { data: feesData } = await supabase
      .from("transactions")
      .select("amount")
      .eq("type", "fee")
      .eq("status", "completed");

    const totalFees = (feesData ?? []).reduce((sum, t) => sum + Math.abs(t.amount ?? 0), 0);

    // Recent signups (last 20)
    const { data: recentUsers } = await supabase
      .from("profiles")
      .select("id, handle, display_name, avatar_url, kyc_status, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    // Daily signups (last 30 days)
    const { data: allUsersMonth } = await supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", monthAgo)
      .order("created_at", { ascending: true });

    const dailySignups: Record<string, number> = {};
    for (const u of allUsersMonth ?? []) {
      const day = new Date(u.created_at).toISOString().split("T")[0];
      dailySignups[day] = (dailySignups[day] || 0) + 1;
    }

    // Conversion funnel
    const { count: totalWithWallet } = await supabase
      .from("wallets")
      .select("*", { count: "exact", head: true })
      .gt("balance", 0);

    const { count: totalWithOrders } = await supabase
      .from("orders")
      .select("user_id", { count: "exact", head: true })
      .eq("status", "filled");

    return NextResponse.json({
      stats: {
        total_users: totalUsers ?? 0,
        users_24h: users24h ?? 0,
        users_7d: users7d ?? 0,
        users_30d: users30d ?? 0,
        kyc_verified: kycVerified ?? 0,
        kyc_pending: kycPending ?? 0,
        active_markets: activeMarkets ?? 0,
        total_volume: totalVolume,
        total_deposits: totalDeposits,
        total_withdrawals: totalWithdrawals,
        total_fees: totalFees,
        users_with_balance: totalWithWallet ?? 0,
        users_with_trades: totalWithOrders ?? 0,
      },
      daily_signups: dailySignups,
      recent_users: recentUsers ?? [],
    });
  } catch (err) {
    console.error("[tenant/stats] error:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
