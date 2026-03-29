import { NextResponse } from "next/server";
import { getAdminClerkId } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAdminClerkId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { id: commentId } = await params;

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("admin_delete_comment", {
      p_clerk_id: userId,
      p_comment_id: commentId,
    });

    if (error) {
      return NextResponse.json(
        { error: "db_error", message: error.message },
        { status: 500 },
      );
    }

    const result = data as Record<string, unknown>;
    if (result.error) {
      return NextResponse.json(
        { error: result.error, ...result },
        { status: 400 },
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[admin/comments/[id]] DELETE error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}
