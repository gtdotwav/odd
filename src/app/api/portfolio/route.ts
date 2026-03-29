import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
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
    const { data, error } = await supabase.rpc("get_user_positions", {
      p_clerk_id: userId,
    });

    if (error) {
      return NextResponse.json(
        { error: "db_error", message: error.message },
        { status: 500 },
      );
    }

    const positions = (data || []) as Record<string, unknown>[];

    // Compute portfolio summary
    let totalInvested = 0;
    let totalCurrentValue = 0;

    for (const pos of positions) {
      const qty = Number(pos.quantity) || 0;
      const avgPrice = Number(pos.avg_price) || 0;
      const side = pos.side as string;
      const currentPrice =
        side === "yes"
          ? Number(pos.price_yes) || 0
          : Number(pos.price_no) || 0;

      totalInvested += qty * avgPrice;
      totalCurrentValue += qty * currentPrice;
    }

    const totalPnl = totalCurrentValue - totalInvested;

    return NextResponse.json({
      positions,
      summary: {
        total_positions: positions.length,
        total_invested: Math.round(totalInvested * 100) / 100,
        total_current_value: Math.round(totalCurrentValue * 100) / 100,
        total_pnl: Math.round(totalPnl * 100) / 100,
      },
    });
  } catch (err) {
    console.error("[portfolio] GET error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}
