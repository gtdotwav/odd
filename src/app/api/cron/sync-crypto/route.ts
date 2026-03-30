import { NextResponse } from "next/server";
import { fetchCryptoPrices, ASSET_ID_MAP } from "@/lib/data-feeds/crypto";
import { createServiceClient } from "@/lib/polymarket/service-client";

// Allow longer execution for external API calls + DB updates
export const maxDuration = 60;

/**
 * Crypto Data Sync Cron
 *
 * Fetches crypto prices from CoinGecko, updates the crypto_data table,
 * records price_history entries, and recalculates market pricing signals.
 *
 * Schedule: every 4 hours (on Pro plan) or daily (on Hobby plan)
 * Can also be triggered manually from the admin panel.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const stats = {
    prices_fetched: 0,
    crypto_data_updated: 0,
    price_history_recorded: 0,
    markets_updated: 0,
    errors: [] as string[],
    timestamp: new Date().toISOString(),
  };

  try {
    // 1. Fetch all tracked crypto prices
    const prices = await fetchCryptoPrices();
    stats.prices_fetched = prices.length;

    if (prices.length === 0) {
      console.warn("[cron/sync-crypto] No crypto prices fetched");
      return NextResponse.json({
        ...stats,
        message: "No crypto prices available — CoinGecko API may be rate-limited",
      });
    }

    console.log(
      `[cron/sync-crypto] Fetched ${prices.length} prices:`,
      prices.map((p) => `${p.symbol}=$${p.price_usd.toLocaleString("en-US")}`).join(", "),
    );

    // Build a lookup map: coingecko_id -> price data
    const priceMap = new Map(prices.map((p) => [p.asset, p]));

    const supabase = createServiceClient();

    // 2. Get all crypto_data rows to update
    const { data: cryptoRows, error: cryptoFetchError } = await supabase
      .from("crypto_data")
      .select("id, market_id, asset, current_price, target_price");

    if (cryptoFetchError) {
      stats.errors.push(`crypto_data fetch: ${cryptoFetchError.message}`);
      console.error("[cron/sync-crypto] Failed to fetch crypto_data:", cryptoFetchError);
    }

    // 3. Update each crypto_data row with the latest price
    for (const row of cryptoRows || []) {
      try {
        // Resolve asset name to CoinGecko ID
        const geckoId = ASSET_ID_MAP[row.asset.toLowerCase()] || row.asset.toLowerCase();
        const priceData = priceMap.get(geckoId);

        if (!priceData) {
          // Asset not in our tracked list — skip
          continue;
        }

        const { error: updateError } = await supabase
          .from("crypto_data")
          .update({ current_price: priceData.price_usd })
          .eq("id", row.id);

        if (updateError) {
          stats.errors.push(`crypto_data update ${row.asset}: ${updateError.message}`);
        } else {
          stats.crypto_data_updated++;
        }
      } catch (err) {
        stats.errors.push(
          `crypto_data ${row.asset}: ${err instanceof Error ? err.message : "unknown"}`,
        );
      }
    }

    // 4. Get active crypto markets and update prices + record history
    const { data: cryptoMarkets, error: marketFetchError } = await supabase
      .from("markets")
      .select("id, slug, title, price_yes, price_no, type, category")
      .in("status", ["active", "live", "closing"])
      .or("type.eq.crypto,category.ilike.%crypto%");

    if (marketFetchError) {
      stats.errors.push(`markets fetch: ${marketFetchError.message}`);
      console.error("[cron/sync-crypto] Failed to fetch crypto markets:", marketFetchError);
    }

    for (const market of cryptoMarkets || []) {
      try {
        // Find the crypto_data for this market
        const marketCryptoData = (cryptoRows || []).find(
          (cd) => cd.market_id === market.id,
        );

        if (!marketCryptoData) continue;

        const geckoId =
          ASSET_ID_MAP[marketCryptoData.asset.toLowerCase()] ||
          marketCryptoData.asset.toLowerCase();
        const priceData = priceMap.get(geckoId);

        if (!priceData) continue;

        // Calculate implied probability based on distance to target
        // If current price is at or above target → high probability (yes ~85-95%)
        // If current price is far below target → low probability (yes ~5-20%)
        // Linear interpolation between 5% and 95% based on progress toward target
        const currentPrice = priceData.price_usd;
        const targetPrice = marketCryptoData.target_price;

        if (targetPrice > 0) {
          const ratio = currentPrice / targetPrice;

          // Clamp the implied price_yes between 0.03 and 0.97
          // Use a sigmoid-like mapping for more realistic probabilities
          let impliedYes: number;
          if (ratio >= 1.0) {
            // Already at or above target
            impliedYes = 0.85 + Math.min(0.12, (ratio - 1.0) * 0.5);
          } else if (ratio >= 0.95) {
            // Very close to target (95-100% of the way)
            impliedYes = 0.65 + (ratio - 0.95) * 4.0; // 0.65 → 0.85
          } else if (ratio >= 0.80) {
            // Moderately close (80-95%)
            impliedYes = 0.35 + (ratio - 0.80) * 2.0; // 0.35 → 0.65
          } else if (ratio >= 0.50) {
            // Far from target (50-80%)
            impliedYes = 0.10 + (ratio - 0.50) * 0.833; // 0.10 → 0.35
          } else {
            // Very far from target (<50%)
            impliedYes = Math.max(0.03, ratio * 0.20);
          }

          impliedYes = Math.round(impliedYes * 100) / 100;
          const impliedNo = Math.round((1 - impliedYes) * 100) / 100;

          // Record price history (always, even if market price doesn't change)
          const { error: historyError } = await supabase
            .from("price_history")
            .insert({
              market_id: market.id,
              price_yes: impliedYes,
              price_no: impliedNo,
              volume_delta: 0,
              recorded_at: new Date().toISOString(),
            });

          if (historyError) {
            stats.errors.push(`price_history ${market.slug}: ${historyError.message}`);
          } else {
            stats.price_history_recorded++;
          }

          // Note: We don't directly overwrite market price_yes/price_no
          // because the AMM handles real trading prices. Instead we store
          // the current_price in crypto_data for display purposes.
          // The market prices are only updated through actual trades.
          stats.markets_updated++;
        }
      } catch (err) {
        stats.errors.push(
          `market ${market.slug}: ${err instanceof Error ? err.message : "unknown"}`,
        );
      }
    }

    console.log(
      `[cron/sync-crypto] Complete: ${stats.crypto_data_updated} crypto_data updated, ` +
        `${stats.price_history_recorded} history entries, ${stats.markets_updated} markets processed`,
    );

    return NextResponse.json(stats);
  } catch (err) {
    console.error("[cron/sync-crypto] Fatal error:", err);
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
