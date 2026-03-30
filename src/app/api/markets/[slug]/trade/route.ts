import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { tradeSchema } from "@/lib/validators";
import { executeTrade, getTradeQuote } from "@/lib/trading/execute";
import { checkRateLimit, rateLimits } from "@/lib/rate-limit";

/**
 * POST /api/markets/[slug]/trade
 *
 * Execute a trade on a market via the AMM engine.
 *
 * Body: { side: "yes"|"no", action: "buy"|"sell", amount: number }
 *   - For buys: amount is the dollar amount to spend
 *   - For sells: amount is the number of shares to sell
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit(ip, rateLimits.trade);
  if (!rl.success) {
    return NextResponse.json(
      { error: "rate_limited", message: "Muitas requisições. Tente novamente em breve." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfter / 1000)) } },
    );
  }

  const { slug } = await params;

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
    const parsed = tradeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation_error", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Resolve market ID from slug
    const { data: market, error: marketError } = await supabase
      .from("markets")
      .select("id")
      .eq("slug", slug)
      .single();

    if (marketError || !market) {
      return NextResponse.json(
        { error: "market_not_found", message: "Market not found" },
        { status: 404 },
      );
    }

    const result = await executeTrade(supabase, {
      clerkId: userId,
      marketId: market.id,
      side: parsed.data.side,
      action: parsed.data.action,
      amount: parsed.data.amount,
    });

    if (!result.success) {
      const statusCode =
        result.error === "insufficient_balance" || result.error === "insufficient_position"
          ? 422
          : result.error === "market_not_active" || result.error === "pool_not_initialized"
            ? 409
            : 400;

      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: statusCode },
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("[trade] POST error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/markets/[slug]/trade?side=yes&action=buy&amount=100
 *
 * Get a price quote without executing the trade.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const searchParams = req.nextUrl.searchParams;

  const side = searchParams.get("side") as "yes" | "no" | null;
  const action = searchParams.get("action") as "buy" | "sell" | null;
  const amountStr = searchParams.get("amount");

  if (!side || !["yes", "no"].includes(side)) {
    return NextResponse.json(
      { error: "validation_error", message: "side must be 'yes' or 'no'" },
      { status: 400 },
    );
  }
  if (!action || !["buy", "sell"].includes(action)) {
    return NextResponse.json(
      { error: "validation_error", message: "action must be 'buy' or 'sell'" },
      { status: 400 },
    );
  }
  if (!amountStr || isNaN(Number(amountStr)) || Number(amountStr) <= 0) {
    return NextResponse.json(
      { error: "validation_error", message: "amount must be a positive number" },
      { status: 400 },
    );
  }

  const amount = Number(amountStr);

  try {
    const supabase = await createClient();

    // Resolve market ID from slug
    const { data: market, error: marketError } = await supabase
      .from("markets")
      .select("id")
      .eq("slug", slug)
      .single();

    if (marketError || !market) {
      return NextResponse.json(
        { error: "market_not_found", message: "Market not found" },
        { status: 404 },
      );
    }

    const quote = await getTradeQuote(supabase, market.id, side, action, amount);

    if ("error" in quote) {
      return NextResponse.json(
        { error: quote.error, message: quote.message },
        { status: 400 },
      );
    }

    return NextResponse.json(quote);
  } catch (err) {
    console.error("[trade] GET quote error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}
