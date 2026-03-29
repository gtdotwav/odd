import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "20", 10) || 20, 1),
      100,
    );

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_leaderboard", {
      p_limit: limit,
    });

    if (error) {
      return NextResponse.json(
        { error: "db_error", message: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ leaderboard: data || [] });
  } catch (err) {
    console.error("[leaderboard] GET error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}
