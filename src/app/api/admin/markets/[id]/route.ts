import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateMarketSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  subtitle: z.string().max(1000).optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  resolution_date: z.string().optional(),
  context: z.string().optional(),
  rules: z.string().optional(),
  source: z.string().optional(),
  featured: z.boolean().optional(),
});

export async function PATCH(
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
    const parsed = updateMarketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation_error", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("admin_update_market", {
      p_clerk_id: userId,
      p_market_id: marketId,
      p_title: parsed.data.title ?? null,
      p_subtitle: parsed.data.subtitle ?? null,
      p_category: parsed.data.category ?? null,
      p_status: parsed.data.status ?? null,
      p_resolution_date: parsed.data.resolution_date ?? null,
      p_context: parsed.data.context ?? null,
      p_rules: parsed.data.rules ?? null,
      p_source: parsed.data.source ?? null,
      p_featured: parsed.data.featured ?? null,
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
    console.error("[admin/markets/[id]] PATCH error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}
