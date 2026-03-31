import { NextResponse } from "next/server";
import { getTenantId } from "@/lib/tenant-auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const tenantId = await getTenantId();
  if (!tenantId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const kyc = searchParams.get("kyc_status") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const supabase = await createClient();

    let query = supabase
      .from("profiles")
      .select("id, clerk_id, handle, display_name, avatar_url, kyc_status, role, created_at", { count: "exact" });

    if (search) {
      query = query.or(`handle.ilike.%${search}%,display_name.ilike.%${search}%`);
    }
    if (kyc) query = query.eq("kyc_status", kyc as "none");

    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    // Get wallet balances for these users
    const userIds = (data ?? []).map((u) => u.id);
    const { data: wallets } = await supabase
      .from("wallets")
      .select("user_id, balance")
      .in("user_id", userIds);

    const walletMap = new Map((wallets ?? []).map((w) => [w.user_id, w.balance]));

    const users = (data ?? []).map((u) => ({
      ...u,
      balance: walletMap.get(u.id) ?? 0,
    }));

    return NextResponse.json({
      users,
      total: count ?? 0,
      limit,
      offset,
    });
  } catch (err) {
    console.error("[tenant/users] error:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
