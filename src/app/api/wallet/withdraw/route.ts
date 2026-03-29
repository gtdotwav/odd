import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { withdrawSchema } from "@/lib/validators";

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
    const parsed = withdrawSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation_error", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Check current balance
    const { data: walletData, error: walletError } = await supabase.rpc("get_user_wallet", {
      p_clerk_id: userId,
    });

    if (walletError) {
      return NextResponse.json(
        { error: "db_error", message: walletError.message },
        { status: 500 },
      );
    }

    const wallet = walletData as Record<string, unknown> | null;
    if (!wallet || wallet.error) {
      return NextResponse.json(
        { error: "wallet_not_found", message: "Carteira não encontrada" },
        { status: 404 },
      );
    }

    const currentBalance = Number(wallet.balance ?? 0);
    if (currentBalance < parsed.data.amount) {
      return NextResponse.json(
        { error: "insufficient_balance", message: "Saldo insuficiente" },
        { status: 400 },
      );
    }

    const reference = `wd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Use add_balance with negative amount for withdrawal
    const { data, error } = await supabase.rpc("add_balance", {
      p_clerk_id: userId,
      p_amount: -parsed.data.amount,
      p_reference: reference,
      p_description: `Saque via Pix — ${parsed.data.pix_key}`,
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

    return NextResponse.json(
      { ...result, reference },
      { status: 201 },
    );
  } catch (err) {
    console.error("[wallet/withdraw] POST error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}
