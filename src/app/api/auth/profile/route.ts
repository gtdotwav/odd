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
    const supabase = await createClient();

    // First, find the user's profile by clerk_id
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (fetchError || !profile) {
      return NextResponse.json(
        { error: "profile_not_found" },
        { status: 404 },
      );
    }

    // Build the update payload — only include provided fields
    const update: Record<string, unknown> = {};

    if (typeof body.display_name === "string" && body.display_name.trim()) {
      update.display_name = body.display_name.trim();
    }

    if (typeof body.handle === "string" && body.handle.trim()) {
      const newHandle = body.handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
      if (newHandle.length < 3) {
        return NextResponse.json(
          { error: "invalid_handle", message: "Handle deve ter no mínimo 3 caracteres" },
          { status: 400 },
        );
      }
      if (newHandle.length > 30) {
        return NextResponse.json(
          { error: "invalid_handle", message: "Handle deve ter no máximo 30 caracteres" },
          { status: 400 },
        );
      }
      update.handle = newHandle;
    }

    if (typeof body.bio === "string") {
      update.bio = body.bio.trim().slice(0, 200) || null;
    }

    if (body.notification_prefs && typeof body.notification_prefs === "object") {
      // Store notification prefs in the bio metadata or a separate field
      // For now, we acknowledge this but the profiles table may not have a notification_prefs column
      // This is a no-op until the column is added
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "no_changes", message: "Nenhuma alteração fornecida" },
        { status: 400 },
      );
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", profile.id);

    if (updateError) {
      // Handle unique constraint violation on handle
      if (updateError.code === "23505" && updateError.message?.includes("handle")) {
        return NextResponse.json(
          { error: "handle_taken", message: "Este handle já está em uso" },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: "db_error", message: updateError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth/profile] PATCH error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}
