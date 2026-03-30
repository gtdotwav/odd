import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { savePixSchema } from "@/lib/validators";

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

    if (error || !data) {
      return NextResponse.json({ pix_key: null, pix_key_type: null });
    }

    const profile = data as { pix_key: string | null; pix_key_type: string | null };
    return NextResponse.json({
      pix_key: profile.pix_key,
      pix_key_type: profile.pix_key_type,
    });
  } catch (err) {
    console.error("[auth/pix] GET error:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
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
    const parsed = savePixSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation_error", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("save_pix_key", {
      p_clerk_id: userId,
      p_pix_key: parsed.data.pix_key,
      p_pix_key_type: parsed.data.pix_key_type,
    });

    if (error) {
      return NextResponse.json(
        { error: "db_error", message: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[auth/pix] POST error:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
