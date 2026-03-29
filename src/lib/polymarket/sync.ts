import { fetchTopEvents } from "./client";
import { mapEventToMarket, type MappedMarket } from "./mapper";
import { createServiceClient } from "./service-client";

const MIN_VOLUME_24H_USD = 50_000; // Only sync markets with > $50K volume in 24h
const MAX_MARKETS_TO_SYNC = 30;

export interface SyncResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  timestamp: string;
}

export async function syncPolymarketMarkets(): Promise<SyncResult> {
  const result: SyncResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  try {
    // 1. Fetch top events from Polymarket
    const events = await fetchTopEvents(50);

    // 2. Filter by minimum volume
    const qualified = events.filter((e) => (e.volume24hr || 0) >= MIN_VOLUME_24H_USD);

    // 3. Map to our schema
    const mapped: MappedMarket[] = [];
    for (const event of qualified) {
      const market = mapEventToMarket(event);
      if (market) {
        mapped.push(market);
      }
      if (mapped.length >= MAX_MARKETS_TO_SYNC) break;
    }

    // 4. Get Supabase client
    const supabase = createServiceClient();

    // 5. Get existing polymarket markets
    // Try polymarket_id column first, fallback to source field
    let existingByPolyId = new Map<string, { id: string }>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingPoly, error: polyErr } = await (supabase
      .from("markets")
      .select("id, polymarket_id")
      .not("polymarket_id", "is", null) as any);

    if (!polyErr && existingPoly) {
      existingByPolyId = new Map(
        existingPoly
          .filter((m: { polymarket_id: string | null }) => m.polymarket_id != null)
          .map((m: { id: string; polymarket_id: string }) => [m.polymarket_id, { id: m.id }])
      );
    } else {
      // Fallback: use source field to find polymarket markets
      const { data: existingSrc } = await supabase
        .from("markets")
        .select("id, source")
        .like("source", "%polymarket.com%");

      existingByPolyId = new Map(
        (existingSrc || [])
          .filter((m: { source: string | null }) => m.source != null)
          .map((m: { id: string; source: string | null }) => {
            const slug = m.source?.match(/event\/([^/]+)/)?.[1] || m.id;
            return [slug, { id: m.id }];
          })
      );
    }

    // 6. Upsert each market
    for (const market of mapped) {
      try {
        const existingMarket = existingByPolyId.get(market.polymarket_id) || existingByPolyId.get(market.polymarket_slug);

        if (existingMarket) {
          // UPDATE: only update prices, volume, variation
          const { error } = await supabase
            .from("markets")
            .update({
              price_yes: market.price_yes,
              price_no: market.price_no,
              variation_24h: market.variation_24h,
              volume: market.volume,
              featured: market.featured,
            })
            .eq("id", (existingMarket as { id: string }).id);

          if (error) {
            result.errors.push(`Update ${market.slug}: ${error.message}`);
          } else {
            // Also record price history
            await supabase.from("price_history").insert({
              market_id: (existingMarket as { id: string }).id,
              price_yes: market.price_yes,
              price_no: market.price_no,
              volume_delta: 0,
              recorded_at: new Date().toISOString(),
            });
            result.updated++;
          }

          // Update outcomes for multi markets
          if (market.type === "multi" && market.outcomes) {
            await updateOutcomes(supabase, (existingMarket as { id: string }).id, market.outcomes);
          }
        } else {
          // CREATE: insert new market
          // Check slug uniqueness
          let slug = market.slug;
          const { data: slugCheck } = await supabase
            .from("markets")
            .select("id")
            .eq("slug", slug)
            .limit(1);

          if (slugCheck && slugCheck.length > 0) {
            slug = `${slug}-${Date.now().toString(36)}`;
          }

          const basePayload = {
            slug,
            title: market.title,
            subtitle: market.subtitle,
            category: market.category,
            type: market.type,
            status: market.status,
            price_yes: market.price_yes,
            price_no: market.price_no,
            resolution_date: market.resolution_date,
            context: market.context,
            rules: market.rules,
            source: market.source,
            featured: market.featured,
          };

          // Try with polymarket columns first, fallback without
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let insertResult = await (supabase
            .from("markets")
            .insert({ ...basePayload, polymarket_id: market.polymarket_id, polymarket_slug: market.polymarket_slug, image_url: market.image_url }) as any)
            .select("id")
            .single();

          if (insertResult.error?.message?.includes("column")) {
            // Polymarket columns don't exist yet — insert without them
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            insertResult = await (supabase
              .from("markets")
              .insert(basePayload) as any)
              .select("id")
              .single();
          }

          const { data: inserted, error } = insertResult;

          if (error) {
            result.errors.push(`Create ${market.slug}: ${error.message}`);
          } else if (inserted) {
            // Insert outcomes for multi markets
            if (market.type === "multi" && market.outcomes) {
              const outcomeRows = market.outcomes.map((o, idx) => ({
                market_id: inserted.id,
                label: o.label,
                probability: o.probability,
                sort_order: idx,
              }));

              await supabase.from("outcomes").insert(outcomeRows);
            }

            // Record initial price history
            await supabase.from("price_history").insert({
              market_id: inserted.id,
              price_yes: market.price_yes,
              price_no: market.price_no,
              volume_delta: 0,
              recorded_at: new Date().toISOString(),
            });

            result.created++;
          }
        }
      } catch (err) {
        result.errors.push(`${market.slug}: ${err instanceof Error ? err.message : "unknown"}`);
      }
    }

    // 7. Deactivate markets no longer in top Polymarket
    const activePolyIds = new Set(mapped.map((m) => m.polymarket_id));
    for (const [polyId, existing_market] of existingByPolyId) {
      if (!activePolyIds.has(polyId)) {
        // Don't delete — just remove featured status
        await supabase
          .from("markets")
          .update({ featured: false })
          .eq("id", (existing_market as { id: string }).id);
      }
    }
  } catch (err) {
    result.errors.push(`Sync failed: ${err instanceof Error ? err.message : "unknown"}`);
  }

  return result;
}

async function updateOutcomes(
  supabase: ReturnType<typeof createServiceClient>,
  marketId: string,
  outcomes: { label: string; probability: number }[]
) {
  // Delete existing outcomes and re-insert with updated probabilities
  await supabase.from("outcomes").delete().eq("market_id", marketId);

  const outcomeRows = outcomes.map((o, idx) => ({
    market_id: marketId,
    label: o.label,
    probability: o.probability,
    sort_order: idx,
  }));

  await supabase.from("outcomes").insert(outcomeRows);
}
