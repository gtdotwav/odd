import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { createCommentSchema } from "@/lib/validators";

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
    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation_error", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("post_comment", {
      p_clerk_id: userId,
      p_market_id: parsed.data.market_id,
      p_text: parsed.data.text,
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

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("[comments] POST error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const marketId = searchParams.get("market_id");

    if (!marketId) {
      return NextResponse.json(
        { error: "market_id is required" },
        { status: 400 },
      );
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(marketId)) {
      return NextResponse.json(
        { error: "invalid_market_id" },
        { status: 400 },
      );
    }

    // Optionally pass clerk_id for liked_by_me
    let clerkId: string | null = null;
    try {
      const session = await auth();
      clerkId = session.userId;
    } catch {
      // Clerk not configured or user not authenticated
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_market_comments", {
      p_market_id: marketId,
      p_clerk_id: clerkId,
    });

    if (error) {
      return NextResponse.json(
        { error: "db_error", message: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ comments: data || [] });
  } catch (err) {
    console.error("[comments] GET error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}
