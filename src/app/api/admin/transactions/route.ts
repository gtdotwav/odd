import { NextResponse } from "next/server";
import { getAdminClerkId } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const userId = await getAdminClerkId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    const { data, error } = await supabase.rpc("admin_list_transactions", {
      p_clerk_id: userId,
      p_type: type,
      p_status: status,
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
      transactions: result.transactions ?? [],
      total: result.total ?? 0,
    });
  } catch (err) {
    console.error("[admin/transactions] GET error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}
