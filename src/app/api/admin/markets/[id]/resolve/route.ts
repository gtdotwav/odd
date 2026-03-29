import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const resolveMarketSchema = z.object({
  resolution: z.enum(["yes", "no"]),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
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
    const { id: marketId } = await params;
    const body = await req.json();
    const parsed = resolveMarketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation_error", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("admin_resolve_market", {
      p_clerk_id: userId,
      p_market_id: marketId,
      p_resolution: parsed.data.resolution,
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
    console.error("[admin/markets/[id]/resolve] POST error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}
