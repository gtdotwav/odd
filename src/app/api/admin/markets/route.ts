import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const createMarketSchema = z.object({
  title: z.string().min(1).max(500),
  category: z.string().min(1),
  type: z.enum(["binary", "multiple"]).optional(),
  resolution_date: z.string().optional(),
  subtitle: z.string().max(1000).optional(),
  context: z.string().optional(),
  rules: z.string().optional(),
  source: z.string().optional(),
  status: z.string().optional(),
  featured: z.boolean().optional(),
});

export async function GET(req: Request) {
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
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    const { data, error } = await supabase.rpc("admin_list_markets", {
      p_clerk_id: userId,
      p_status: status,
      p_category: category,
      p_search: search,
      p_limit: limit ? parseInt(limit, 10) : undefined,
      p_offset: offset ? parseInt(offset, 10) : undefined,
    });

    if (error) {
      return NextResponse.json(
        { error: "db_error", message: error.message },
        { status: 500 },
      );
    }

    const result = data as Record<string, unknown>;
    return NextResponse.json({
      markets: result.markets ?? [],
      total: result.total ?? 0,
    });
  } catch (err) {
    console.error("[admin/markets] GET error:", err);
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
    const parsed = createMarketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation_error", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const slug = slugify(parsed.data.title);

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("admin_create_market", {
      p_clerk_id: userId,
      p_title: parsed.data.title,
      p_slug: slug,
      p_category: parsed.data.category,
      p_type: parsed.data.type ?? undefined,
      p_resolution_date: parsed.data.resolution_date ?? undefined,
      p_subtitle: parsed.data.subtitle ?? undefined,
      p_context: parsed.data.context ?? undefined,
      p_rules: parsed.data.rules ?? undefined,
      p_source: parsed.data.source ?? undefined,
      p_status: parsed.data.status ?? undefined,
      p_featured: parsed.data.featured ?? undefined,
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
    console.error("[admin/markets] POST error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}
