/**
 * Crypto Price Fetcher
 *
 * Fetches cryptocurrency prices from the CoinGecko free API.
 * Free tier: ~10-30 req/min, no API key needed.
 * API docs: https://docs.coingecko.com/reference/introduction
 */

const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";
const FETCH_TIMEOUT_MS = 15_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CryptoPrice {
  asset: string; // CoinGecko ID (e.g. "bitcoin")
  symbol: string; // Ticker symbol (e.g. "btc")
  price_usd: number;
  price_brl: number;
  change_24h: number; // Percentage
}

interface CoinGeckoPriceResponse {
  [id: string]: {
    usd?: number;
    brl?: number;
    usd_24h_change?: number;
  };
}

// ---------------------------------------------------------------------------
// Tracked assets
// ---------------------------------------------------------------------------

export const TRACKED_ASSETS: { id: string; symbol: string }[] = [
  { id: "bitcoin", symbol: "btc" },
  { id: "ethereum", symbol: "eth" },
  { id: "solana", symbol: "sol" },
  { id: "dogecoin", symbol: "doge" },
  { id: "cardano", symbol: "ada" },
];

/**
 * Map of common names/symbols to CoinGecko IDs.
 * Used for resolving asset identifiers from market data.
 */
export const ASSET_ID_MAP: Record<string, string> = {
  btc: "bitcoin",
  bitcoin: "bitcoin",
  eth: "ethereum",
  ethereum: "ethereum",
  sol: "solana",
  solana: "solana",
  doge: "dogecoin",
  dogecoin: "dogecoin",
  ada: "cardano",
  cardano: "cardano",
  bnb: "binancecoin",
  binancecoin: "binancecoin",
  xrp: "ripple",
  ripple: "ripple",
  dot: "polkadot",
  polkadot: "polkadot",
  avax: "avalanche-2",
  matic: "matic-network",
  link: "chainlink",
  chainlink: "chainlink",
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches prices for all tracked assets in USD and BRL.
 * Makes a single batched API call for efficiency.
 */
export async function fetchCryptoPrices(): Promise<CryptoPrice[]> {
  const ids = TRACKED_ASSETS.map((a) => a.id).join(",");

  try {
    const url = `${COINGECKO_BASE_URL}/simple/price?ids=${ids}&vs_currencies=usd,brl&include_24hr_change=true`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      console.error(`[crypto] CoinGecko returned ${res.status}: ${res.statusText}`);
      return [];
    }

    const data = (await res.json()) as CoinGeckoPriceResponse;
    const prices: CryptoPrice[] = [];

    for (const asset of TRACKED_ASSETS) {
      const entry = data[asset.id];
      if (!entry || entry.usd === undefined) {
        console.warn(`[crypto] No price data for ${asset.id}`);
        continue;
      }

      prices.push({
        asset: asset.id,
        symbol: asset.symbol,
        price_usd: entry.usd,
        price_brl: entry.brl ?? 0,
        change_24h: entry.usd_24h_change ?? 0,
      });
    }

    return prices;
  } catch (err) {
    console.error("[crypto] Failed to fetch prices:", err);
    return [];
  }
}

/**
 * Fetches the price for a single asset by its CoinGecko ID or common symbol.
 * Returns null on failure.
 */
export async function fetchAssetPrice(
  assetIdOrSymbol: string,
): Promise<{ usd: number; brl: number; change_24h: number } | null> {
  const geckoId =
    ASSET_ID_MAP[assetIdOrSymbol.toLowerCase()] || assetIdOrSymbol.toLowerCase();

  try {
    const url = `${COINGECKO_BASE_URL}/simple/price?ids=${geckoId}&vs_currencies=usd,brl&include_24hr_change=true`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });

    if (!res.ok) return null;

    const data = (await res.json()) as CoinGeckoPriceResponse;
    const entry = data[geckoId];
    if (!entry || entry.usd === undefined) return null;

    return {
      usd: entry.usd,
      brl: entry.brl ?? 0,
      change_24h: entry.usd_24h_change ?? 0,
    };
  } catch (err) {
    console.error(`[crypto] Failed to fetch price for ${assetIdOrSymbol}:`, err);
    return null;
  }
}
