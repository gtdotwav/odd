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
    const { data, error } = await supabase.rpc("get_user_profile", {
      p_clerk_id: userId,
    });

    if (error) {
      return NextResponse.json(
        { error: "db_error", message: error.message },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "profile_not_found" },
        { status: 404 },
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[auth/profile] GET error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
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
    const supabase = await createClient();

    const handle: string =
      body.handle || `user_${userId.slice(-8)}`;
    const displayName: string = body.display_name || handle;
    const avatarUrl: string | null = body.avatar_url || null;

    const { data, error } = await supabase.rpc("create_profile", {
      p_clerk_id: userId,
      p_handle: handle,
      p_display_name: displayName,
      p_avatar_url: avatarUrl,
    });

    if (error) {
      return NextResponse.json(
        { error: "db_error", message: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ id: data }, { status: 201 });
  } catch (err) {
    console.error("[auth/profile] POST error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}
