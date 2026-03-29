import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.type !== "user.created" && body.type !== "user.updated") {
      return NextResponse.json({ received: true });
    }

    const user = body.data;
    const supabase = await createClient();

    const handle =
      user.username || `user_${(user.id as string).slice(-8)}`;
    const displayName =
      [user.first_name, user.last_name].filter(Boolean).join(" ") || handle;
    const avatarUrl: string | null = user.image_url || null;

    const { error } = await supabase.rpc("create_profile", {
      p_clerk_id: user.id,
      p_handle: handle,
      p_display_name: displayName,
      p_avatar_url: avatarUrl,
    });

    if (error) {
      console.error("[webhook] create_profile error:", error.message);
      return NextResponse.json(
        { error: "profile_sync_failed", message: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook] unexpected error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}
