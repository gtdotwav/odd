import { NextResponse } from "next/server";
import { fetchBCBIndicators } from "@/lib/data-feeds/bcb";
import { fetchCryptoPrices, ASSET_ID_MAP } from "@/lib/data-feeds/crypto";
import { createServiceClient } from "@/lib/polymarket/service-client";

// Allow longer execution — this cron does multiple data syncs
export const maxDuration = 120;

/**
 * Combined Data Sync Cron
 *
 * Single endpoint that runs all external data syncs to stay within
 * Vercel Hobby plan's 2-cron limit. Performs:
 *
 *   1. BCB indicators (Selic, IPCA, USD/BRL)
 *   2. Crypto prices (BTC, ETH, SOL, DOGE, ADA)
 *   3. crypto_data table updates
 *   4. price_history recording
 *   5. 24h variation calculation for all active markets
 *
 * Schedule: daily at 12:00 UTC (09:00 BRT)
 * On Vercel Pro, the individual crons (sync-bcb, sync-crypto,
 * update-variation) can run on their own schedules instead.
 *
 * Can also be triggered manually via:
 *   GET /api/cron/sync-data?Authorization=Bearer <CRON_SECRET>
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const summary = {
    bcb: { indicators: 0, markets_updated: 0, errors: [] as string[] },
    crypto: {
      prices_fetched: 0,
      crypto_data_updated: 0,
      history_recorded: 0,
      errors: [] as string[],
    },
    variation: {
      markets_checked: 0,
      markets_updated: 0,
      errors: [] as string[],
    },
    timestamp: new Date().toISOString(),
    duration_ms: 0,
  };

  const startTime = Date.now();

  // ---------------------------------------------------------------------------
  // Step 1: Fetch external data in parallel (BCB + Crypto)
  // ---------------------------------------------------------------------------
  const [bcbResult, cryptoResult] = await Promise.allSettled([
    fetchBCBIndicators(),
    fetchCryptoPrices(),
  ]);

  const indicators =
    bcbResult.status === "fulfilled" ? bcbResult.value : [];
  const cryptoPrices =
    cryptoResult.status === "fulfilled" ? cryptoResult.value : [];

  if (bcbResult.status === "rejected") {
    summary.bcb.errors.push(`BCB fetch failed: ${bcbResult.reason}`);
    console.error("[cron/sync-data] BCB fetch failed:", bcbResult.reason);
  }
  if (cryptoResult.status === "rejected") {
    summary.crypto.errors.push(`Crypto fetch failed: ${cryptoResult.reason}`);
    console.error("[cron/sync-data] Crypto fetch failed:", cryptoResult.reason);
  }

  summary.bcb.indicators = indicators.length;
  summary.crypto.prices_fetched = cryptoPrices.length;

  console.log(
    `[cron/sync-data] Fetched ${indicators.length} BCB indicators, ${cryptoPrices.length} crypto prices`,
  );

  // ---------------------------------------------------------------------------
  // Step 2: Database updates
  // ---------------------------------------------------------------------------
  const supabase = createServiceClient();

  // Build price lookup map
  const priceMap = new Map(cryptoPrices.map((p) => [p.asset, p]));

  // --- 2a: Update economy markets with BCB context ---
  if (indicators.length > 0) {
    try {
      const contextParts = indicators.map(
        (i) => `${i.name}: ${i.value} (${i.date})`,
      );
      const contextSuffix = `\n\n[BCB ${new Date().toLocaleDateString("pt-BR")}] ${contextParts.join(" | ")}`;

      const { data: econMarkets } = await supabase
        .from("markets")
        .select("id, slug, context")
        .in("status", ["active", "live", "closing"])
        .or(
          "category.ilike.%econom%,category.ilike.%econ%,title.ilike.%selic%,title.ilike.%ipca%,title.ilike.%dolar%,title.ilike.%cambio%,title.ilike.%inflacao%",
        );

      for (const market of econMarkets || []) {
        try {
          const raw = market.context || "";
          const bcbIdx = raw.indexOf("\n\n[BCB ");
          const cleanContext = bcbIdx >= 0 ? raw.slice(0, bcbIdx) : raw;
          const { error } = await supabase
            .from("markets")
            .update({ context: cleanContext + contextSuffix })
            .eq("id", market.id);

          if (error) {
            summary.bcb.errors.push(`${market.slug}: ${error.message}`);
          } else {
            summary.bcb.markets_updated++;
          }
        } catch (err) {
          summary.bcb.errors.push(
            `${market.slug}: ${err instanceof Error ? err.message : "unknown"}`,
          );
        }
      }
    } catch (err) {
      summary.bcb.errors.push(
        `Economy markets update: ${err instanceof Error ? err.message : "unknown"}`,
      );
    }
  }

  // --- 2b: Update crypto_data table ---
  if (cryptoPrices.length > 0) {
    try {
      const { data: cryptoRows } = await supabase
        .from("crypto_data")
        .select("id, market_id, asset, current_price, target_price");

      for (const row of cryptoRows || []) {
        try {
          const geckoId =
            ASSET_ID_MAP[row.asset.toLowerCase()] || row.asset.toLowerCase();
          const priceData = priceMap.get(geckoId);
          if (!priceData) continue;

          const { error } = await supabase
            .from("crypto_data")
            .update({ current_price: priceData.price_usd })
            .eq("id", row.id);

          if (error) {
            summary.crypto.errors.push(
              `crypto_data ${row.asset}: ${error.message}`,
            );
          } else {
            summary.crypto.crypto_data_updated++;
          }
        } catch (err) {
          summary.crypto.errors.push(
            `crypto_data ${row.asset}: ${err instanceof Error ? err.message : "unknown"}`,
          );
        }
      }

      // --- 2c: Record price_history for crypto markets ---
      const { data: cryptoMarkets } = await supabase
        .from("markets")
        .select("id, slug, price_yes, price_no")
        .in("status", ["active", "live", "closing"])
        .or("type.eq.crypto,category.ilike.%crypto%");

      const cryptoDataByMarket = new Map(
        (cryptoRows || []).map((cd) => [cd.market_id, cd]),
      );

      for (const market of cryptoMarkets || []) {
        try {
          const cd = cryptoDataByMarket.get(market.id);
          if (!cd) continue;

          const geckoId =
            ASSET_ID_MAP[cd.asset.toLowerCase()] || cd.asset.toLowerCase();
          const priceData = priceMap.get(geckoId);
          if (!priceData || cd.target_price <= 0) continue;

          // Calculate implied probability
          const ratio = priceData.price_usd / cd.target_price;
          let impliedYes: number;
          if (ratio >= 1.0) {
            impliedYes = 0.85 + Math.min(0.12, (ratio - 1.0) * 0.5);
          } else if (ratio >= 0.95) {
            impliedYes = 0.65 + (ratio - 0.95) * 4.0;
          } else if (ratio >= 0.80) {
            impliedYes = 0.35 + (ratio - 0.80) * 2.0;
          } else if (ratio >= 0.50) {
            impliedYes = 0.10 + (ratio - 0.50) * 0.833;
          } else {
            impliedYes = Math.max(0.03, ratio * 0.20);
          }

          impliedYes = Math.round(impliedYes * 100) / 100;
          const impliedNo = Math.round((1 - impliedYes) * 100) / 100;

          const { error } = await supabase.from("price_history").insert({
            market_id: market.id,
            price_yes: impliedYes,
            price_no: impliedNo,
            volume_delta: 0,
            recorded_at: new Date().toISOString(),
          });

          if (error) {
            summary.crypto.errors.push(
              `history ${market.slug}: ${error.message}`,
            );
          } else {
            summary.crypto.history_recorded++;
          }
        } catch (err) {
          summary.crypto.errors.push(
            `history ${market.slug}: ${err instanceof Error ? err.message : "unknown"}`,
          );
        }
      }
    } catch (err) {
      summary.crypto.errors.push(
        `Crypto update: ${err instanceof Error ? err.message : "unknown"}`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Step 3: Calculate 24h variation for ALL active markets
  // ---------------------------------------------------------------------------
  try {
    const { data: allMarkets } = await supabase
      .from("markets")
      .select("id, slug, price_yes, variation_24h")
      .in("status", ["active", "live", "closing"]);

    if (allMarkets && allMarkets.length > 0) {
      summary.variation.markets_checked = allMarkets.length;

      const now = new Date();
      const twentyFourHoursAgo = new Date(
        now.getTime() - 24 * 60 * 60 * 1000,
      );
      const cutoffISO = twentyFourHoursAgo.toISOString();

      for (const market of allMarkets) {
        try {
          // Get closest price_history entry to 24h ago
          const { data: hist } = await supabase
            .from("price_history")
            .select("price_yes")
            .eq("market_id", market.id)
            .lte("recorded_at", cutoffISO)
            .order("recorded_at", { ascending: false })
            .limit(1);

          let oldPrice: number | null = null;

          if (hist && hist.length > 0) {
            oldPrice = hist[0].price_yes;
          } else {
            // Fallback: oldest entry if at least 1h old
            const { data: oldest } = await supabase
              .from("price_history")
              .select("price_yes, recorded_at")
              .eq("market_id", market.id)
              .order("recorded_at", { ascending: true })
              .limit(1);

            if (oldest && oldest.length > 0) {
              const entryAge =
                now.getTime() - new Date(oldest[0].recorded_at).getTime();
              if (entryAge >= 60 * 60 * 1000) {
                oldPrice = oldest[0].price_yes;
              }
            }
          }

          if (oldPrice === null || oldPrice === 0) continue;

          const variation =
            Math.round(
              ((market.price_yes - oldPrice) / oldPrice) * 100 * 100,
            ) / 100;

          // Skip if unchanged
          if (Math.abs(variation - (market.variation_24h || 0)) < 0.01) {
            continue;
          }

          const { error } = await supabase
            .from("markets")
            .update({ variation_24h: variation })
            .eq("id", market.id);

          if (error) {
            summary.variation.errors.push(
              `${market.slug}: ${error.message}`,
            );
          } else {
            summary.variation.markets_updated++;
          }
        } catch (err) {
          summary.variation.errors.push(
            `${market.slug}: ${err instanceof Error ? err.message : "unknown"}`,
          );
        }
      }
    }
  } catch (err) {
    summary.variation.errors.push(
      `Variation calc: ${err instanceof Error ? err.message : "unknown"}`,
    );
  }

  // ---------------------------------------------------------------------------
  // Done
  // ---------------------------------------------------------------------------
  summary.duration_ms = Date.now() - startTime;

  const totalErrors =
    summary.bcb.errors.length +
    summary.crypto.errors.length +
    summary.variation.errors.length;

  console.log(
    `[cron/sync-data] Complete in ${summary.duration_ms}ms — ` +
      `BCB: ${summary.bcb.indicators} indicators/${summary.bcb.markets_updated} markets | ` +
      `Crypto: ${summary.crypto.prices_fetched} prices/${summary.crypto.crypto_data_updated} updated/${summary.crypto.history_recorded} history | ` +
      `Variation: ${summary.variation.markets_updated}/${summary.variation.markets_checked} updated | ` +
      `Errors: ${totalErrors}`,
  );

  if (totalErrors > 0) {
    console.warn("[cron/sync-data] Errors:", {
      bcb: summary.bcb.errors,
      crypto: summary.crypto.errors,
      variation: summary.variation.errors,
    });
  }

  return NextResponse.json(summary);
}
