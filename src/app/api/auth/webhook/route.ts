import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { createClient } from "@/lib/supabase/server";

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    let payload: Record<string, unknown>;

    // Validate webhook signature if secret is configured
    if (WEBHOOK_SECRET && WEBHOOK_SECRET !== "placeholder") {
      const svixId = req.headers.get("svix-id");
      const svixTimestamp = req.headers.get("svix-timestamp");
      const svixSignature = req.headers.get("svix-signature");

      if (!svixId || !svixTimestamp || !svixSignature) {
        console.error("[webhook] Missing svix headers");
        return NextResponse.json({ error: "missing_headers" }, { status: 400 });
      }

      const wh = new Webhook(WEBHOOK_SECRET);
      try {
        payload = wh.verify(body, {
          "svix-id": svixId,
          "svix-timestamp": svixTimestamp,
          "svix-signature": svixSignature,
        }) as Record<string, unknown>;
      } catch (err) {
        console.error("[webhook] Signature verification failed:", err);
        return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
      }
    } else {
      // No secret configured — accept but log warning
      console.warn("[webhook] CLERK_WEBHOOK_SECRET not configured — skipping verification");
      payload = JSON.parse(body);
    }

    if (payload.type !== "user.created" && payload.type !== "user.updated") {
      return NextResponse.json({ received: true });
    }

    const user = payload.data as Record<string, unknown>;
    const supabase = await createClient();

    const handle =
      (user.username as string) || `user_${(user.id as string).slice(-8)}`;
    const displayName =
      [user.first_name, user.last_name].filter(Boolean).join(" ") || handle;
    const avatarUrl: string | null = (user.image_url as string) || null;

    const { error } = await supabase.rpc("create_profile", {
      p_clerk_id: user.id as string,
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
