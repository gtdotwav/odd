import { NextResponse } from "next/server";
import { syncPolymarketMarkets } from "@/lib/polymarket/sync";

// Vercel Cron calls this endpoint
// Protected by CRON_SECRET to prevent unauthorized access
export async function GET(req: Request) {
  // Verify cron secret (Vercel sets this automatically for cron jobs)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncPolymarketMarkets();

    console.log(
      `[sync] Polymarket sync complete: ${result.created} created, ${result.updated} updated, ${result.errors.length} errors`
    );

    if (result.errors.length > 0) {
      console.error("[sync] Errors:", result.errors);
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[sync] Fatal error:", err);
    return NextResponse.json(
      { error: "sync_failed", message: err instanceof Error ? err.message : "unknown" },
      { status: 500 }
    );
  }
}

// Allow longer execution for sync
export const maxDuration = 60; // 60 seconds
