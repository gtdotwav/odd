import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
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
    const { slug } = await params;
    const supabase = await createClient();

    // Look up market by slug to get the UUID
    const { data: market, error: marketError } = await supabase
      .from("markets")
      .select("id, status")
      .eq("slug", slug)
      .single();

    if (marketError || !market) {
      return NextResponse.json(
        { error: "not_found", message: "Market not found" },
        { status: 404 },
      );
    }

    // Verify market is resolved before attempting claim
    if (!["resolved_yes", "resolved_no", "cancelled"].includes(market.status)) {
      return NextResponse.json(
        { error: "not_resolved", message: "Market is not yet resolved" },
        { status: 400 },
      );
    }

    // Call the claim RPC
    const { data, error } = await supabase.rpc("claim_payout", {
      p_clerk_id: userId,
      p_market_id: market.id,
    });

    if (error) {
      return NextResponse.json(
        { error: "db_error", message: error.message },
        { status: 500 },
      );
    }

    const result = data as Record<string, unknown>;
    if (result.error) {
      const statusMap: Record<string, number> = {
        not_found: 404,
        not_resolved: 400,
        nothing_to_claim: 404,
      };
      const status = statusMap[result.error as string] ?? 400;
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status },
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[markets/[slug]/claim] POST error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}
