import { NextResponse } from "next/server";
import { getAdminClerkId } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const userId = await getAdminClerkId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    const [statsResult, activityResult] = await Promise.all([
      supabase.rpc("admin_get_stats", { p_clerk_id: userId }),
      supabase.rpc("admin_recent_activity", { p_clerk_id: userId, p_limit: 20 }),
    ]);

    if (statsResult.error) {
      return NextResponse.json(
        { error: "db_error", message: statsResult.error.message },
        { status: 500 },
      );
    }

    if (activityResult.error) {
      return NextResponse.json(
        { error: "db_error", message: activityResult.error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      stats: statsResult.data,
      recent_activity: activityResult.data || [],
    });
  } catch (err) {
    console.error("[admin/stats] GET error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}
