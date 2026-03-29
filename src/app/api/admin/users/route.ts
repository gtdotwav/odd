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
    const search = searchParams.get("search");
    const kyc_status = searchParams.get("kyc_status");
    const role = searchParams.get("role");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    const { data, error } = await supabase.rpc("admin_list_users", {
      p_clerk_id: userId,
      p_search: search,
      p_kyc_status: kyc_status,
      p_role: role,
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
      users: result.users ?? [],
      total: result.total ?? 0,
    });
  } catch (err) {
    console.error("[admin/users] GET error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}
