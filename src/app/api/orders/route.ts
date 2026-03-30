import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { createOrderSchema } from "@/lib/validators";
import { executeTrade } from "@/lib/trading/execute";
import { checkRateLimit, rateLimits } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit(ip, rateLimits.trade);
  if (!rl.success) {
    return NextResponse.json(
      { error: "rate_limited", message: "Muitas requisições. Tente novamente em breve." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfter / 1000)) } },
    );
  }

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
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation_error", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Execute via AMM engine
    // For backward compatibility: quantity * price = dollar amount to spend
    const dollarAmount = parsed.data.quantity * parsed.data.price;

    const result = await executeTrade(supabase, {
      clerkId: userId,
      marketId: parsed.data.market_id,
      side: parsed.data.side,
      action: "buy",
      amount: dollarAmount,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: 400 },
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("[orders] POST error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}

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

    const { data, error } = await supabase.rpc("get_user_orders", {
      p_clerk_id: userId,
      p_status: status,
    });

    if (error) {
      return NextResponse.json(
        { error: "db_error", message: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ orders: data || [] });
  } catch (err) {
    console.error("[orders] GET error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}
