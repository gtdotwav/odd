import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  let userId: string | null = null;
  try {
    const session = await auth();
    userId = session.userId;
  } catch {
    // Clerk not configured
  }
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const market_id = searchParams.get("market_id");
    const side = searchParams.get("side");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    const { data, error } = await supabase.rpc("admin_list_orders", {
      p_clerk_id: userId,
      p_status: status,
      p_market_id: market_id,
      p_side: side,
      p_limit: limit ? parseInt(limit, 10) : undefined,
      p_offset: offset ? parseInt(offset, 10) : undefined,
    });

    if (error) {
      return NextResponse.json(
        { error: "db_error", message: error.message },
        { status: 500 },
      );
    }

    const result = data as Record<string, unknown>;
    return NextResponse.json({
      orders: result.orders ?? [],
      total: result.total ?? 0,
    });
  } catch (err) {
    console.error("[admin/orders] GET error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}
