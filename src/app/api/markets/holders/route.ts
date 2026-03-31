import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/markets/holders?market_id=X
 *
 * Returns top holders for a market based on aggregated activity_log data.
 * Uses activity_log (public read) instead of positions (own-only RLS).
 */
export async function GET(req: NextRequest) {
  const marketId = req.nextUrl.searchParams.get("market_id");

  if (!marketId) {
    return NextResponse.json(
      { error: "market_id is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = await createClient();

    // activity_log is publicly readable — aggregate buys/sells per user per side
    const { data: activities, error } = await supabase
      .from("activity_log")
      .select("user_id, action, side, amount, price")
      .eq("market_id", marketId)
      .order("created_at", { ascending: true });

    if (error || !activities || activities.length === 0) {
      return NextResponse.json({ holders: [] });
    }

    // Aggregate net position per user per side
    const posMap = new Map<string, { yes: number; no: number; yesValue: number; noValue: number }>();

    for (const a of activities) {
      const entry = posMap.get(a.user_id) || { yes: 0, no: 0, yesValue: 0, noValue: 0 };
      const qty = Number(a.amount);
      const val = qty * Number(a.price);

      if (a.action === "buy") {
        if (a.side === "yes") { entry.yes += qty; entry.yesValue += val; }
        else { entry.no += qty; entry.noValue += val; }
      } else {
        if (a.side === "yes") { entry.yes -= qty; entry.yesValue -= val; }
        else { entry.no -= qty; entry.noValue -= val; }
      }

      posMap.set(a.user_id, entry);
    }

    // Build ranked list of holders with positive positions
    const holderList: Array<{ userId: string; side: string; quantity: number; value: number }> = [];

    for (const [userId, pos] of posMap) {
      if (pos.yes > 0.1) {
        holderList.push({ userId, side: "yes", quantity: pos.yes, value: pos.yesValue });
      }
      if (pos.no > 0.1) {
        holderList.push({ userId, side: "no", quantity: pos.no, value: pos.noValue });
      }
    }

    holderList.sort((a, b) => b.value - a.value);
    const top = holderList.slice(0, 5);

    if (top.length === 0) {
      return NextResponse.json({ holders: [] });
    }

    // Fetch handles
    const userIds = [...new Set(top.map((h) => h.userId))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("clerk_id, handle")
      .in("clerk_id", userIds);

    const handleMap = new Map(
      (profiles || []).map((p) => [p.clerk_id, p.handle]),
    );

    const holders = top.map((h) => ({
      handle: handleMap.get(h.userId) || "anon",
      side: h.side,
      total_quantity: Math.round(h.quantity * 10) / 10,
      total_value: Math.round(h.value * 100) / 100,
    }));

    return NextResponse.json({ holders });
  } catch (err) {
    console.error("[markets/holders] GET error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}
