import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAutoResolution } from "@/lib/resolution/oracles";

// Admin clerk ID used for auto-resolution (system actor)
const SYSTEM_ADMIN_CLERK_ID = process.env.SYSTEM_ADMIN_CLERK_ID || "admin_local";

interface MarketRow {
  id: string;
  slug: string;
  title: string;
  category: string;
  type: string;
  status: string;
  resolution_date: string;
  rules: string | null;
  source: string | null;
}

interface CryptoDataRow {
  asset: string;
  current_price: number;
  target_price: number;
}

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const now = new Date().toISOString();

    // Find markets past their resolution date that are still active
    const { data: markets, error: fetchError } = await supabase
      .from("markets")
      .select("id, slug, title, category, type, status, resolution_date, rules, source")
      .in("status", ["active", "live", "closing"])
      .lte("resolution_date", now)
      .order("resolution_date", { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error("[cron/resolve-markets] Failed to fetch markets:", fetchError);
      return NextResponse.json(
        { error: "db_error", message: fetchError.message },
        { status: 500 },
      );
    }

    const rows = (markets || []) as MarketRow[];
    if (rows.length === 0) {
      return NextResponse.json({
        processed: 0,
        auto_resolved: 0,
        needs_manual: 0,
        message: "No markets due for resolution",
      });
    }

    let autoResolved = 0;
    let needsManual = 0;
    const results: Array<{
      market_id: string;
      slug: string;
      action: string;
      details?: string;
    }> = [];

    for (const market of rows) {
      // Fetch crypto_data if it's a crypto market
      let cryptoData: CryptoDataRow | null = null;
      if (market.type === "crypto" || market.category.toLowerCase() === "crypto") {
        const { data: cd } = await supabase
          .from("crypto_data")
          .select("asset, current_price, target_price")
          .eq("market_id", market.id)
          .single();
        cryptoData = cd as CryptoDataRow | null;
      }

      const oracleMarket = {
        ...market,
        crypto_data: cryptoData,
      };

      const oracleResult = await checkAutoResolution(oracleMarket);

      if (oracleResult) {
        // Auto-resolve with high confidence
        const { data: resolveData, error: resolveError } = await supabase.rpc(
          "resolve_market_with_payout",
          {
            p_clerk_id: SYSTEM_ADMIN_CLERK_ID,
            p_market_id: market.id,
            p_resolution: oracleResult.resolution,
          },
        );

        if (resolveError) {
          console.error(
            `[cron/resolve-markets] Failed to auto-resolve ${market.slug}:`,
            resolveError,
          );
          results.push({
            market_id: market.id,
            slug: market.slug,
            action: "error",
            details: resolveError.message,
          });
          continue;
        }

        const resolveResult = resolveData as Record<string, unknown>;
        if (resolveResult.error) {
          console.error(
            `[cron/resolve-markets] RPC error for ${market.slug}:`,
            resolveResult,
          );
          results.push({
            market_id: market.id,
            slug: market.slug,
            action: "error",
            details: resolveResult.message as string,
          });
          continue;
        }

        autoResolved++;
        results.push({
          market_id: market.id,
          slug: market.slug,
          action: `auto_resolved_${oracleResult.resolution}`,
          details: `${oracleResult.source} (confidence: ${oracleResult.confidence})`,
        });

        console.log(
          `[cron/resolve-markets] Auto-resolved ${market.slug} → ${oracleResult.resolution} via ${oracleResult.source}`,
        );
      } else {
        // No oracle result — notify admin for manual resolution
        needsManual++;

        // Find admin users to notify
        const { data: admins } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", "admin");

        if (admins && admins.length > 0) {
          const notificationRows = admins.map((admin) => ({
            user_id: admin.id,
            type: "market_resolved" as const,
            title: "Market needs manual resolution",
            body: `The market "${market.title}" (${market.slug}) passed its resolution date and could not be auto-resolved. Please review and resolve manually.`,
            data: {
              market_id: market.id,
              market_slug: market.slug,
              resolution_date: market.resolution_date,
              action: "manual_resolution_needed",
            },
          }));

          await supabase.from("notifications").insert(notificationRows);
        }

        results.push({
          market_id: market.id,
          slug: market.slug,
          action: "needs_manual_resolution",
        });

        console.log(
          `[cron/resolve-markets] ${market.slug} needs manual resolution — admin notified`,
        );
      }
    }

    const summary = {
      processed: rows.length,
      auto_resolved: autoResolved,
      needs_manual: needsManual,
      results,
    };

    console.log(
      `[cron/resolve-markets] Complete: ${autoResolved} auto-resolved, ${needsManual} need manual`,
    );

    return NextResponse.json(summary);
  } catch (err) {
    console.error("[cron/resolve-markets] Fatal error:", err);
    return NextResponse.json(
      { error: "cron_failed", message: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}

// Allow longer execution for processing multiple markets
export const maxDuration = 120; // 120 seconds
