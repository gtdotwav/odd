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
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";
    const sort = searchParams.get("sort") || "volume";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const supabase = await createClient();

    let query = supabase
      .from("markets")
      .select("id, slug, title, category, status, price_yes, price_no, volume, variation_24h, comment_count, pool_yes, pool_no, fee_rate, resolution_date, created_at, updated_at", { count: "exact" });

    if (status) query = query.eq("status", status as "active");
    if (category) query = query.eq("category", category as string);

    if (sort === "volume") query = query.order("volume", { ascending: false });
    else if (sort === "newest") query = query.order("created_at", { ascending: false });
    else if (sort === "variation") query = query.order("variation_24h", { ascending: false });
    else query = query.order("volume", { ascending: false });

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      markets: data ?? [],
      total: count ?? 0,
      limit,
      offset,
    });
  } catch (err) {
    console.error("[tenant/markets] error:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
