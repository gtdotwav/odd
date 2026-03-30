import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/polymarket/service-client";

// Allow longer execution for batch DB operations
export const maxDuration = 60;

/**
 * Variation Tracker Cron
 *
 * Calculates 24-hour price variation for all active markets by comparing
 * current price_yes against the price_history entry from ~24h ago.
 * Updates the `variation_24h` column on the markets table.
 *
 * This powers the trending/movers sections on the frontend.
 *
 * Schedule: every 30 minutes (on Pro plan) or daily (on Hobby plan)
 * Can also be triggered manually from the admin panel.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const stats = {
    markets_checked: 0,
    markets_updated: 0,
    markets_no_history: 0,
    errors: [] as string[],
    timestamp: new Date().toISOString(),
  };

  try {
    const supabase = createServiceClient();

    // 1. Get all active markets
    const { data: markets, error: marketError } = await supabase
      .from("markets")
      .select("id, slug, price_yes, variation_24h")
      .in("status", ["active", "live", "closing"]);

    if (marketError) {
      console.error("[cron/update-variation] Failed to fetch markets:", marketError);
      return NextResponse.json(
        { error: "db_error", message: marketError.message },
        { status: 500 },
      );
    }

    if (!markets || markets.length === 0) {
      return NextResponse.json({
        ...stats,
        message: "No active markets found",
      });
    }

    stats.markets_checked = markets.length;

    // 2. Calculate the 24h-ago timestamp
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const cutoffISO = twentyFourHoursAgo.toISOString();

    // 3. For each market, find the closest price_history entry to 24h ago
    for (const market of markets) {
      try {
        // Get the oldest price_history entry that is >= 24h ago
        // This gives us the closest point to "24 hours ago"
        const { data: historyEntries, error: histError } = await supabase
          .from("price_history")
          .select("price_yes, recorded_at")
          .eq("market_id", market.id)
          .lte("recorded_at", cutoffISO)
          .order("recorded_at", { ascending: false })
          .limit(1);

        if (histError) {
          stats.errors.push(`history ${market.slug}: ${histError.message}`);
          continue;
        }

        if (!historyEntries || historyEntries.length === 0) {
          // No history from 24h ago — try the oldest entry available
          const { data: oldestEntry } = await supabase
            .from("price_history")
            .select("price_yes, recorded_at")
            .eq("market_id", market.id)
            .order("recorded_at", { ascending: true })
            .limit(1);

          if (!oldestEntry || oldestEntry.length === 0) {
            stats.markets_no_history++;
            continue;
          }

          // Use oldest entry if it's at least 1 hour old
          const entryAge =
            now.getTime() - new Date(oldestEntry[0].recorded_at).getTime();
          if (entryAge < 60 * 60 * 1000) {
            stats.markets_no_history++;
            continue;
          }

          // Calculate variation using the oldest available entry
          const oldPrice = oldestEntry[0].price_yes;
          const variation = calculateVariation(market.price_yes, oldPrice);

          const { error: updateErr } = await supabase
            .from("markets")
            .update({ variation_24h: variation })
            .eq("id", market.id);

          if (updateErr) {
            stats.errors.push(`update ${market.slug}: ${updateErr.message}`);
          } else {
            stats.markets_updated++;
          }
          continue;
        }

        // Calculate variation: ((current - old) / old) * 100
        const oldPrice = historyEntries[0].price_yes;
        const variation = calculateVariation(market.price_yes, oldPrice);

        // Only update if variation actually changed (avoid unnecessary writes)
        if (Math.abs(variation - (market.variation_24h || 0)) < 0.01) {
          continue;
        }

        const { error: updateErr } = await supabase
          .from("markets")
          .update({ variation_24h: variation })
          .eq("id", market.id);

        if (updateErr) {
          stats.errors.push(`update ${market.slug}: ${updateErr.message}`);
        } else {
          stats.markets_updated++;
        }
      } catch (err) {
        stats.errors.push(
          `${market.slug}: ${err instanceof Error ? err.message : "unknown"}`,
        );
      }
    }

    console.log(
      `[cron/update-variation] Complete: ${stats.markets_updated}/${stats.markets_checked} updated, ` +
        `${stats.markets_no_history} without history`,
    );

    return NextResponse.json(stats);
  } catch (err) {
    console.error("[cron/update-variation] Fatal error:", err);
    return NextResponse.json(
      {
        error: "cron_failed",
        message: err instanceof Error ? err.message : "unknown",
        stats,
      },
      { status: 500 },
    );
  }
}

/**
 * Calculates price variation as a percentage.
 * Returns a value like 5.25 (meaning +5.25%) or -3.10 (meaning -3.10%).
 */
function calculateVariation(currentPrice: number, oldPrice: number): number {
  if (oldPrice === 0) return 0;
  const variation = ((currentPrice - oldPrice) / oldPrice) * 100;
  // Round to 2 decimal places
  return Math.round(variation * 100) / 100;
}
