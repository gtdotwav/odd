import type { PolymarketEvent, PolymarketMarket } from "./client";
import { slugify } from "@/lib/utils";

// Polymarket tag → Odd category mapping
const TAG_TO_CATEGORY: Record<string, string> = {
  // Politics
  "politics": "Política",
  "us-politics": "Política",
  "elections": "Política",
  "world-politics": "Política",
  "us-elections": "Política",
  "global-elections": "Política",
  // Economy
  "economics": "Economia",
  "finance": "Economia",
  "business": "Economia",
  "fed": "Economia",
  "interest-rates": "Economia",
  "inflation": "Economia",
  "markets": "Economia",
  // Sports
  "sports": "Esportes",
  "nba": "Esportes",
  "nfl": "Esportes",
  "mlb": "Esportes",
  "nhl": "Esportes",
  "mma": "Esportes",
  "tennis": "Esportes",
  "f1": "Esportes",
  "soccer": "Futebol",
  "football": "Futebol",
  "fifa": "Futebol",
  "world-cup": "Futebol",
  "premier-league": "Futebol",
  "champions-league": "Futebol",
  // Crypto
  "crypto": "Cripto",
  "bitcoin": "Cripto",
  "ethereum": "Cripto",
  "defi": "Cripto",
  // Tech
  "tech": "Tech / IA",
  "ai": "Tech / IA",
  "science": "Ciência",
  // Entertainment
  "entertainment": "Entretenimento",
  "pop-culture": "Cultura Pop",
  "movies": "Entretenimento",
  "music": "Entretenimento",
  "tv": "Entretenimento",
  "awards": "Entretenimento",
  // Climate
  "climate": "Clima",
  "weather": "Clima",
  // Health
  "health": "Saúde",
  "covid": "Saúde",
  // World
  "world": "Mundo",
  "geopolitics": "Mundo",
  "conflict": "Mundo",
};

// Simple keyword-based category detection as fallback
const KEYWORD_CATEGORIES: [RegExp, string][] = [
  [/\b(trump|biden|election|president|congress|senate|governor|vote|democrat|republican|bolsonaro|lula)\b/i, "Política"],
  [/\b(bitcoin|btc|ethereum|eth|crypto|token|defi|solana|sol)\b/i, "Cripto"],
  [/\b(nba|nfl|mlb|nhl|ufc|mma|tennis|f1|formula|olympics|super bowl)\b/i, "Esportes"],
  [/\b(soccer|football|fifa|world cup|premier league|champions league|copa|futebol)\b/i, "Futebol"],
  [/\b(fed|interest rate|inflation|gdp|unemployment|recession|stock|nasdaq|s&p|dow)\b/i, "Economia"],
  [/\b(ai|artificial intelligence|openai|google|apple|microsoft|spacex|tesla|tech)\b/i, "Tech / IA"],
  [/\b(oscar|grammy|emmy|movie|film|album|music|netflix|disney|tv show)\b/i, "Entretenimento"],
  [/\b(climate|temperature|hurricane|tornado|earthquake|weather)\b/i, "Clima"],
  [/\b(covid|vaccine|fda|who|health|disease|virus)\b/i, "Saúde"],
  [/\b(war|conflict|nato|un|china|russia|ukraine|israel|iran)\b/i, "Mundo"],
  [/\b(science|nasa|space|mars|moon|discovery)\b/i, "Ciência"],
];

export function detectCategory(event: PolymarketEvent): string {
  // Try tag-based mapping first
  for (const tag of event.tags || []) {
    const slug = tag.slug?.toLowerCase();
    if (slug && TAG_TO_CATEGORY[slug]) {
      return TAG_TO_CATEGORY[slug];
    }
  }

  // Try Polymarket category field
  const catLower = (event.category || "").toLowerCase();
  if (TAG_TO_CATEGORY[catLower]) {
    return TAG_TO_CATEGORY[catLower];
  }

  // Try keyword detection on title
  const text = `${event.title} ${event.description || ""}`;
  for (const [regex, category] of KEYWORD_CATEGORIES) {
    if (regex.test(text)) {
      return category;
    }
  }

  return "Mundo"; // Default fallback
}

// USD to BRL conversion rate (approximate)
const USD_TO_BRL = 5.8;

export function convertVolume(usdVolume: number): number {
  return Math.round(usdVolume * USD_TO_BRL);
}

export interface MappedMarket {
  title: string;
  slug: string;
  subtitle: string | null;
  category: string;
  type: "binary" | "multi";
  status: "active";
  price_yes: number;
  price_no: number;
  variation_24h: number;
  volume: number;
  resolution_date: string;
  context: string | null;
  rules: string | null;
  source: string;
  featured: boolean;
  polymarket_id: string;
  polymarket_slug: string;
  image_url: string | null;
  outcomes: { label: string; probability: number }[] | null;
}

export function mapEventToMarket(event: PolymarketEvent): MappedMarket | null {
  if (!event.markets || event.markets.length === 0) return null;

  const isMulti = event.markets.length > 1;
  const category = detectCategory(event);

  if (isMulti) {
    return mapMultiOutcomeEvent(event, category);
  } else {
    return mapBinaryEvent(event, event.markets[0], category);
  }
}

function mapBinaryEvent(
  event: PolymarketEvent,
  market: PolymarketMarket,
  category: string
): MappedMarket | null {
  let prices: number[];
  try {
    prices = JSON.parse(market.outcomePrices).map(Number);
  } catch {
    return null;
  }

  const priceYes = Math.max(0.01, Math.min(0.99, prices[0] || 0.5));
  const priceNo = Math.max(0.01, Math.min(0.99, 1 - priceYes));

  return {
    title: event.title,
    slug: slugify(event.title),
    subtitle: event.description?.slice(0, 200) || null,
    category,
    type: "binary",
    status: "active",
    price_yes: Math.round(priceYes * 100) / 100,
    price_no: Math.round(priceNo * 100) / 100,
    variation_24h: market.oneDayPriceChange || 0,
    volume: convertVolume(event.volume || 0),
    resolution_date: event.endDate || new Date(Date.now() + 30 * 86400000).toISOString(),
    context: event.description?.slice(0, 1000) || null,
    rules: 'Resolvido com base no resultado real do evento. Fonte: Polymarket.',
    source: `https://polymarket.com/event/${event.slug}`,
    featured: (event.volume24hr || 0) > 1_000_000,
    polymarket_id: event.id,
    polymarket_slug: event.slug,
    image_url: event.image || null,
    outcomes: null,
  };
}

function mapMultiOutcomeEvent(
  event: PolymarketEvent,
  category: string
): MappedMarket | null {
  // Each market in the event is an outcome (e.g. "Will Spain win?" is one outcome)
  const outcomes: { label: string; probability: number }[] = [];
  let topPrice = 0;
  let topVariation = 0;

  for (const market of event.markets) {
    let prices: number[];
    try {
      prices = JSON.parse(market.outcomePrices).map(Number);
    } catch {
      continue;
    }

    const prob = prices[0] || 0;
    // Extract the outcome label from the question
    // e.g., "Will Spain win the 2026 FIFA World Cup?" → "Spain"
    const label = extractOutcomeLabel(market.question, event.title);
    outcomes.push({ label, probability: Math.round(prob * 100) / 100 });

    if (prob > topPrice) {
      topPrice = prob;
      topVariation = market.oneDayPriceChange || 0;
    }
  }

  if (outcomes.length === 0) return null;

  // Sort by probability descending
  outcomes.sort((a, b) => b.probability - a.probability);

  const priceYes = Math.max(0.01, Math.min(0.99, topPrice));

  return {
    title: event.title,
    slug: slugify(event.title),
    subtitle: event.description?.slice(0, 200) || null,
    category,
    type: "multi",
    status: "active",
    price_yes: Math.round(priceYes * 100) / 100,
    price_no: Math.round((1 - priceYes) * 100) / 100,
    variation_24h: topVariation,
    volume: convertVolume(event.volume || 0),
    resolution_date: event.endDate || new Date(Date.now() + 30 * 86400000).toISOString(),
    context: event.description?.slice(0, 1000) || null,
    rules: 'Resolvido com base no resultado real do evento. Fonte: Polymarket.',
    source: `https://polymarket.com/event/${event.slug}`,
    featured: (event.volume24hr || 0) > 1_000_000,
    polymarket_id: event.id,
    polymarket_slug: event.slug,
    image_url: event.image || null,
    outcomes,
  };
}

function extractOutcomeLabel(question: string, eventTitle: string): string {
  // Try to extract the specific outcome from the question
  // Pattern: "Will X win/happen/..." → extract X
  const willMatch = question.match(/^Will\s+(.+?)\s+(win|be|become|reach|pass|hit|get|have|make|go|stay|sign|leave|drop|rise|fall|finish|qualify|advance)/i);
  if (willMatch) {
    return willMatch[1].replace(/^(the|a|an)\s+/i, "").trim();
  }

  // Pattern: "X to win/happen..." → extract X
  const toMatch = question.match(/^(.+?)\s+to\s+(win|be|become|reach|pass)/i);
  if (toMatch) {
    return toMatch[1].trim();
  }

  // If question is very different from event title, use full question as label
  // but truncate to keep it manageable
  const cleaned = question
    .replace(eventTitle, "")
    .replace(/\?$/, "")
    .trim();

  if (cleaned.length > 0 && cleaned.length < 60) {
    return cleaned;
  }

  // Last resort: use first meaningful part of the question
  return question.replace(/\?$/, "").slice(0, 50).trim();
}
