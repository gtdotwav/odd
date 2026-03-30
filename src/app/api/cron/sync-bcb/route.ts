import { NextResponse } from "next/server";
import { fetchBCBIndicators } from "@/lib/data-feeds/bcb";
import { createServiceClient } from "@/lib/polymarket/service-client";

// Allow longer execution for external API calls
export const maxDuration = 60;

/**
 * BCB Data Sync Cron
 *
 * Fetches Selic, IPCA, and USD/BRL from the Brazilian Central Bank
 * and updates economy-category markets with fresh context data.
 *
 * Schedule: daily at 09:00 UTC (06:00 BRT)
 * Can also be triggered manually from the admin panel.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const stats = {
    indicators_fetched: 0,
    markets_updated: 0,
    errors: [] as string[],
    timestamp: new Date().toISOString(),
  };

  try {
    // 1. Fetch all BCB indicators
    const indicators = await fetchBCBIndicators();
    stats.indicators_fetched = indicators.length;

    if (indicators.length === 0) {
      console.warn("[cron/sync-bcb] No indicators fetched from BCB");
      return NextResponse.json({
        ...stats,
        message: "No BCB data available — API may be down or outside business hours",
      });
    }

    console.log(
      `[cron/sync-bcb] Fetched ${indicators.length} indicators:`,
      indicators.map((i) => `${i.name}=${i.value}`).join(", "),
    );

    // 2. Build context string for market updates
    const contextParts = indicators.map(
      (i) => `${i.name}: ${i.value} (${i.date})`,
    );
    const contextSuffix = `\n\n📊 Dados BCB atualizados em ${new Date().toLocaleDateString("pt-BR")}: ${contextParts.join(" | ")}`;

    // 3. Find economy-category markets that could benefit from BCB data
    const supabase = createServiceClient();

    const { data: econMarkets, error: fetchError } = await supabase
      .from("markets")
      .select("id, slug, title, context, category")
      .in("status", ["active", "live", "closing"])
      .or("category.ilike.%econom%,category.ilike.%econ%,title.ilike.%selic%,title.ilike.%ipca%,title.ilike.%dolar%,title.ilike.%cambio%,title.ilike.%inflacao%");

    if (fetchError) {
      stats.errors.push(`DB fetch error: ${fetchError.message}`);
      console.error("[cron/sync-bcb] Failed to fetch markets:", fetchError);
    }

    const markets = econMarkets || [];

    // 4. Update each economy market's context with fresh BCB data
    for (const market of markets) {
      try {
        // Append BCB data to existing context (or create new context)
        const existingContext = market.context || "";
        // Remove any previous BCB data suffix to avoid duplication
        const bcbIdx = existingContext.indexOf("\n\n📊 Dados BCB atualizados em ");
        const cleanContext = bcbIdx >= 0 ? existingContext.slice(0, bcbIdx) : existingContext;
        const updatedContext = cleanContext + contextSuffix;

        const { error: updateError } = await supabase
          .from("markets")
          .update({ context: updatedContext })
          .eq("id", market.id);

        if (updateError) {
          stats.errors.push(`Update ${market.slug}: ${updateError.message}`);
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
      `[cron/sync-bcb] Complete: ${stats.indicators_fetched} indicators, ${stats.markets_updated} markets updated`,
    );

    return NextResponse.json(stats);
  } catch (err) {
    console.error("[cron/sync-bcb] Fatal error:", err);
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
