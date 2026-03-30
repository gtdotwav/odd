/**
 * Oracle functions for auto-resolving prediction markets.
 *
 * Each oracle checks an external data source and returns a resolution
 * if the data is conclusive, or null if inconclusive / unavailable.
 */

interface MarketForOracle {
  id: string;
  slug: string;
  title: string;
  category: string;
  type: string;
  resolution_date: string;
  rules: string | null;
  source: string | null;
  crypto_data?: {
    asset: string;
    current_price: number;
    target_price: number;
  } | null;
}

interface OracleResult {
  resolution: "yes" | "no";
  source: string;
  confidence: number; // 0-1, only auto-resolve if >= threshold
}

// ---------------------------------------------------------------------------
// BCB (Banco Central do Brasil) Oracle — Selic rate decisions
// Uses the public SGS (Sistema Gerenciador de Séries Temporais) API
// ---------------------------------------------------------------------------

interface BCBSeriesPoint {
  data: string; // dd/MM/yyyy
  valor: string;
}

async function fetchBCBSelic(): Promise<{ rate: number; date: string } | null> {
  try {
    // Series 432 = Selic target rate
    const url =
      "https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/2?formato=json";
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;

    const data = (await res.json()) as BCBSeriesPoint[];
    if (!data || data.length === 0) return null;

    const latest = data[data.length - 1];
    return {
      rate: parseFloat(latest.valor),
      date: latest.data,
    };
  } catch (err) {
    console.error("[oracle/bcb] Failed to fetch Selic data:", err);
    return null;
  }
}

/**
 * Check BCB data for Selic rate decisions.
 *
 * Market rules should contain a pattern like:
 *   "Resolves YES if Selic >= 14.25" or "Resolves YES if Selic is cut"
 *
 * We parse the threshold from the rules field.
 */
export async function checkBCBOracle(
  market: MarketForOracle,
): Promise<OracleResult | null> {
  // Only apply to economy/selic markets
  const titleLower = market.title.toLowerCase();
  const rulesLower = (market.rules || "").toLowerCase();
  const isSelicMarket =
    titleLower.includes("selic") || rulesLower.includes("selic");
  if (!isSelicMarket) return null;

  const selic = await fetchBCBSelic();
  if (!selic) return null;

  // Try to extract threshold: "selic >= X", "selic > X", "selic = X"
  const thresholdMatch = rulesLower.match(
    /selic\s*(?:>=|>|=|acima de|igual a)\s*([\d]+(?:[.,]\d+)?)/,
  );
  if (!thresholdMatch) return null;

  const threshold = parseFloat(thresholdMatch[1].replace(",", "."));
  const operator = rulesLower.includes(">=") || rulesLower.includes("acima de")
    ? ">="
    : rulesLower.includes(">")
      ? ">"
      : "=";

  let resolved: boolean;
  switch (operator) {
    case ">=":
      resolved = selic.rate >= threshold;
      break;
    case ">":
      resolved = selic.rate > threshold;
      break;
    case "=":
      resolved = Math.abs(selic.rate - threshold) < 0.01;
      break;
    default:
      return null;
  }

  // Only resolve if the market's resolution date has passed (data is final)
  const now = new Date();
  const resDate = new Date(market.resolution_date);
  if (now < resDate) return null;

  return {
    resolution: resolved ? "yes" : "no",
    source: `BCB SGS API — Selic: ${selic.rate}% (${selic.date})`,
    confidence: 0.95,
  };
}

// ---------------------------------------------------------------------------
// Crypto Oracle — price target markets
// Uses CoinGecko public API (no key required for simple/price)
// ---------------------------------------------------------------------------

const COINGECKO_IDS: Record<string, string> = {
  btc: "bitcoin",
  bitcoin: "bitcoin",
  eth: "ethereum",
  ethereum: "ethereum",
  sol: "solana",
  solana: "solana",
  bnb: "binancecoin",
  ada: "cardano",
  xrp: "ripple",
  doge: "dogecoin",
  dot: "polkadot",
  avax: "avalanche-2",
  matic: "matic-network",
  link: "chainlink",
};

interface CoinGeckoPrice {
  [id: string]: { usd: number };
}

async function fetchCryptoPrice(asset: string): Promise<number | null> {
  const geckoId = COINGECKO_IDS[asset.toLowerCase()];
  if (!geckoId) return null;

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${geckoId}&vs_currencies=usd`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;

    const data = (await res.json()) as CoinGeckoPrice;
    return data[geckoId]?.usd ?? null;
  } catch (err) {
    console.error("[oracle/crypto] Failed to fetch price for", asset, err);
    return null;
  }
}

/**
 * Check crypto prices for price-target markets.
 *
 * Uses the crypto_data attached to the market (asset + target_price)
 * or parses rules like "Resolves YES if BTC >= $100,000 by resolution date"
 */
export async function checkCryptoOracle(
  market: MarketForOracle,
): Promise<OracleResult | null> {
  if (market.type !== "crypto" && market.category.toLowerCase() !== "crypto") {
    // Also check title for crypto keywords
    const titleLower = market.title.toLowerCase();
    const hasCryptoKeyword = Object.keys(COINGECKO_IDS).some((k) =>
      titleLower.includes(k),
    );
    if (!hasCryptoKeyword) return null;
  }

  // Resolution date must have passed
  const now = new Date();
  const resDate = new Date(market.resolution_date);
  if (now < resDate) return null;

  let asset: string | null = null;
  let targetPrice: number | null = null;
  let operator = ">=" as string;

  // Try crypto_data first
  if (market.crypto_data) {
    asset = market.crypto_data.asset;
    targetPrice = market.crypto_data.target_price;
  }

  // Fallback: parse from rules
  if (!asset || !targetPrice) {
    const rulesLower = (market.rules || "").toLowerCase();
    // Match patterns like "btc >= $100,000" or "ethereum > 5000"
    const priceMatch = rulesLower.match(
      /(\w+)\s*(>=|>|<=|<)\s*\$?([\d,]+(?:\.\d+)?)/,
    );
    if (priceMatch) {
      asset = priceMatch[1];
      operator = priceMatch[2];
      targetPrice = parseFloat(priceMatch[3].replace(/,/g, ""));
    }
  }

  if (!asset || !targetPrice) return null;

  const currentPrice = await fetchCryptoPrice(asset);
  if (currentPrice === null) return null;

  let resolved: boolean;
  if (operator === ">=") {
    resolved = currentPrice >= targetPrice;
  } else if (operator === ">") {
    resolved = currentPrice > targetPrice;
  } else if (operator === "<=") {
    resolved = currentPrice <= targetPrice;
  } else if (operator === "<") {
    resolved = currentPrice < targetPrice;
  } else {
    resolved = currentPrice >= targetPrice;
  }

  return {
    resolution: resolved ? "yes" : "no",
    source: `CoinGecko — ${asset.toUpperCase()}: $${currentPrice.toLocaleString("en-US")} vs target $${targetPrice.toLocaleString("en-US")}`,
    confidence: 0.90,
  };
}

// ---------------------------------------------------------------------------
// Generic resolution checker — runs all oracles
// ---------------------------------------------------------------------------

const CONFIDENCE_THRESHOLD = 0.85;

export async function checkAutoResolution(
  market: MarketForOracle,
): Promise<OracleResult | null> {
  // Run all oracles in parallel
  const results = await Promise.allSettled([
    checkBCBOracle(market),
    checkCryptoOracle(market),
  ]);

  for (const result of results) {
    if (result.status === "fulfilled" && result.value !== null) {
      if (result.value.confidence >= CONFIDENCE_THRESHOLD) {
        return result.value;
      }
    }
  }

  return null;
}
