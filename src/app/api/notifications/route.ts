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
    const { data, error } = await supabase.rpc("get_user_notifications", {
      p_clerk_id: userId,
    });

    if (error) {
      return NextResponse.json(
        { error: "db_error", message: error.message },
        { status: 500 },
      );
    }

    const notifications = (data || []) as Record<string, unknown>[];
    const unreadCount = notifications.filter((n) => !n.read).length;

    return NextResponse.json({ notifications, unread_count: unreadCount });
  } catch (err) {
    console.error("[notifications] GET error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
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
    const body = await req.json();

    // Optional: pass specific notification ids to mark as read
    // If no ids provided, marks all as read
    const ids: string[] | null = Array.isArray(body.ids) ? body.ids : null;

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("mark_notifications_read", {
      p_clerk_id: userId,
      p_ids: ids,
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
        { error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[notifications] PATCH error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}
