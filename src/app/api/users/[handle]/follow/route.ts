import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ handle: string }> },
) {
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
    const { handle } = await params;

    if (!handle || handle.length > 50) {
      return NextResponse.json(
        { error: "invalid_handle" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Get the current user's profile id
    const { data: myProfile, error: myError } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (myError || !myProfile) {
      return NextResponse.json(
        { error: "profile_not_found", message: "Seu perfil não foi encontrado" },
        { status: 404 },
      );
    }

    // Get the target user's profile id
    const { data: targetProfile, error: targetError } = await supabase
      .from("profiles")
      .select("id")
      .eq("handle", handle)
      .single();

    if (targetError || !targetProfile) {
      return NextResponse.json(
        { error: "user_not_found" },
        { status: 404 },
      );
    }

    if (myProfile.id === targetProfile.id) {
      return NextResponse.json(
        { error: "cannot_follow_self", message: "Você não pode seguir a si mesmo" },
        { status: 400 },
      );
    }

    // Check if already following
    const { data: existing } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", myProfile.id)
      .eq("following_id", targetProfile.id)
      .maybeSingle();

    if (existing) {
      // Unfollow
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", myProfile.id)
        .eq("following_id", targetProfile.id);

      return NextResponse.json({ following: false });
    } else {
      // Follow
      const { error: insertError } = await supabase
        .from("follows")
        .insert({
          follower_id: myProfile.id,
          following_id: targetProfile.id,
        });

      if (insertError) {
        return NextResponse.json(
          { error: "db_error", message: insertError.message },
          { status: 500 },
        );
      }

      return NextResponse.json({ following: true });
    }
  } catch (err) {
    console.error("[users/handle/follow] POST error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}
