import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { depositSchema } from "@/lib/validators";

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
    const parsed = depositSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation_error", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const reference = `dep_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("add_balance", {
      p_clerk_id: userId,
      p_amount: parsed.data.amount,
      p_reference: reference,
      p_description: `Deposit of R$${parsed.data.amount.toFixed(2)}`,
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
    console.error("[wallet/deposit] POST error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}
