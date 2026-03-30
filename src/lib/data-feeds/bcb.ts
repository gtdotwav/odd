/**
 * BCB (Banco Central do Brasil) Data Fetcher
 *
 * Fetches key economic indicators from the BCB Open Data API (SGS).
 * API docs: https://dadosabertos.bcb.gov.br/
 *
 * Series codes:
 *   432   - Taxa Selic Meta (% a.a.)
 *   433   - Taxa Selic Over (% a.a.)
 *   13522 - IPCA (variação mensal %)
 *   1     - USD/BRL (PTAX venda)
 */

const BCB_BASE_URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs";
const FETCH_TIMEOUT_MS = 15_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BCBIndicator {
  code: number;
  name: string;
  value: number;
  date: string;
}

interface BCBSeriesPoint {
  data: string; // dd/MM/yyyy
  valor: string;
}

// ---------------------------------------------------------------------------
// Tracked series
// ---------------------------------------------------------------------------

const SERIES = [
  { code: 432, name: "Selic Meta" },
  { code: 433, name: "Selic Over" },
  { code: 13522, name: "IPCA" },
  { code: 1, name: "USD/BRL" },
] as const;

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

async function fetchSeries(
  code: number,
  count: number = 1,
): Promise<BCBSeriesPoint[] | null> {
  try {
    const url = `${BCB_BASE_URL}.${code}/dados/ultimos/${count}?formato=json`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      console.warn(`[bcb] Series ${code} returned ${res.status}`);
      return null;
    }

    const data = (await res.json()) as BCBSeriesPoint[];
    if (!Array.isArray(data) || data.length === 0) return null;

    return data;
  } catch (err) {
    console.error(`[bcb] Failed to fetch series ${code}:`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches all tracked BCB indicators (Selic, IPCA, USD/BRL).
 * Each fetch is independent — a single failure won't break the others.
 */
export async function fetchBCBIndicators(): Promise<BCBIndicator[]> {
  const indicators: BCBIndicator[] = [];

  const results = await Promise.allSettled(
    SERIES.map(async (s) => {
      const points = await fetchSeries(s.code, 1);
      if (!points || points.length === 0) return null;

      const latest = points[points.length - 1];
      return {
        code: s.code,
        name: s.name,
        value: parseFloat(latest.valor),
        date: latest.data,
      } satisfies BCBIndicator;
    }),
  );

  for (const r of results) {
    if (r.status === "fulfilled" && r.value) {
      indicators.push(r.value);
    }
  }

  return indicators;
}

/**
 * Specifically fetches the Selic target rate.
 * Returns the latest value and its reference date, or null on failure.
 */
export async function fetchSelicRate(): Promise<{
  rate: number;
  date: string;
} | null> {
  const points = await fetchSeries(432, 2);
  if (!points || points.length === 0) return null;

  const latest = points[points.length - 1];
  return {
    rate: parseFloat(latest.valor),
    date: latest.data,
  };
}

/**
 * Returns the current USD/BRL exchange rate (PTAX venda).
 * Throws on failure so the caller can handle it.
 */
export async function fetchUSDtoBRL(): Promise<number> {
  const points = await fetchSeries(1, 1);
  if (!points || points.length === 0) {
    throw new Error("Failed to fetch USD/BRL from BCB");
  }

  return parseFloat(points[points.length - 1].valor);
}
