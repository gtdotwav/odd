import { NextResponse } from "next/server";
import { getAdminClerkId } from "@/lib/admin-auth";
import { syncPolymarketMarkets } from "@/lib/polymarket/sync";

// Manual sync trigger from admin dashboard
export async function POST() {
  const userId = await getAdminClerkId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncPolymarketMarkets();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[admin/sync] error:", err);
    return NextResponse.json(
      { error: "sync_failed", message: err instanceof Error ? err.message : "unknown" },
      { status: 500 }
    );
  }
}

export const maxDuration = 60;
