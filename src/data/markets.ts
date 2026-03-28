export interface Market {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  category: string;
  type: "binary" | "multi" | "sport" | "crypto";
  status: "active" | "live" | "closing" | "resolved_yes" | "resolved_no";
  priceYes: number;
  priceNo: number;
  variation24h: number;
  volume: number;
  commentCount: number;
  resolutionDate: string;
  outcomes?: { label: string; probability: number }[];
  sport?: { home: string; away: string; homeScore?: number; awayScore?: number; clock?: string };
  crypto?: { asset: string; currentPrice: number; targetPrice: number };
  context?: string;
  rules?: string;
  source?: string;
  featured?: boolean;
}

export const markets: Market[] = [
  {
    id: "1",
    slug: "selic-sobe-maio-2026",
    title: "Selic sobe na reunião do Copom de maio 2026?",
    subtitle: "Próxima reunião: 6-7 de maio de 2026",
    category: "Economia",
    type: "binary",
    status: "active",
    priceYes: 0.78,
    priceNo: 0.22,
    variation24h: 0.032,
    volume: 2100000,
    commentCount: 84,
    resolutionDate: "2026-05-07",
    context: "A última ata do Copom sinalizou preocupação com a trajetória fiscal e a desancoragem de expectativas de inflação. O IPCA-15 de abril veio acima do esperado (0,58% vs 0,42% consenso), reforçando a tese de mais um ajuste.",
    rules: "SIM se o BCB anunciar aumento da taxa Selic (qualquer magnitude). NÃO se mantida ou reduzida.",
    source: "Banco Central do Brasil (bcb.gov.br)",
    featured: true,
  },
  {
    id: "2",
    slug: "flamengo-campeao-2026",
    title: "Flamengo é campeão brasileiro 2026?",
    category: "Futebol",
    type: "multi",
    status: "active",
    priceYes: 0.34,
    priceNo: 0.66,
    variation24h: 0.012,
    volume: 890000,
    commentCount: 312,
    resolutionDate: "2026-12-08",
    outcomes: [
      { label: "Palmeiras", probability: 0.28 },
      { label: "Flamengo", probability: 0.22 },
      { label: "Botafogo", probability: 0.15 },
      { label: "Atlético-MG", probability: 0.12 },
      { label: "São Paulo", probability: 0.08 },
    ],
  },
  {
    id: "3",
    slug: "bbb-26-vencedor",
    title: "Quem vence o BBB 26?",
    category: "Cultura Pop",
    type: "multi",
    status: "live",
    priceYes: 0.42,
    priceNo: 0.58,
    variation24h: -0.051,
    volume: 5800000,
    commentCount: 8400,
    resolutionDate: "2026-04-22",
    outcomes: [
      { label: "Ana", probability: 0.42 },
      { label: "Bruno", probability: 0.22 },
      { label: "Carla", probability: 0.18 },
      { label: "Diego", probability: 0.10 },
      { label: "Elisa", probability: 0.08 },
    ],
    featured: true,
  },
  {
    id: "4",
    slug: "lula-reeleito-2026",
    title: "Lula é reeleito em 2026?",
    category: "Política",
    type: "binary",
    status: "active",
    priceYes: 0.44,
    priceNo: 0.56,
    variation24h: -0.021,
    volume: 4200000,
    commentCount: 1240,
    resolutionDate: "2026-10-25",
    featured: true,
  },
  {
    id: "5",
    slug: "btc-100k-abril-2026",
    title: "Bitcoin acima de US$ 100K em 30 de abril?",
    category: "Cripto",
    type: "crypto",
    status: "active",
    priceYes: 0.61,
    priceNo: 0.39,
    variation24h: -0.053,
    volume: 3400000,
    commentCount: 201,
    resolutionDate: "2026-04-30",
    crypto: { asset: "BTC", currentPrice: 97432, targetPrice: 100000 },
  },
  {
    id: "6",
    slug: "dolar-6-reais-junho",
    title: "Dólar acima de R$ 6,00 em 30 de junho?",
    category: "Economia",
    type: "binary",
    status: "active",
    priceYes: 0.55,
    priceNo: 0.45,
    variation24h: 0.018,
    volume: 1800000,
    commentCount: 156,
    resolutionDate: "2026-06-30",
  },
  {
    id: "7",
    slug: "neymar-santos-2026",
    title: "Neymar volta ao Santos em 2026?",
    category: "Futebol",
    type: "binary",
    status: "active",
    priceYes: 0.28,
    priceNo: 0.72,
    variation24h: 0.045,
    volume: 620000,
    commentCount: 892,
    resolutionDate: "2026-12-31",
  },
  {
    id: "8",
    slug: "ipca-2026-acima-5",
    title: "IPCA acumulado 2026 fica acima de 5%?",
    category: "Economia",
    type: "binary",
    status: "active",
    priceYes: 0.67,
    priceNo: 0.33,
    variation24h: 0.008,
    volume: 980000,
    commentCount: 64,
    resolutionDate: "2027-01-10",
  },
  {
    id: "9",
    slug: "fla-pal-rodada-12",
    title: "Flamengo × Palmeiras: quem vence?",
    subtitle: "Brasileirão · Rodada 12 · 30 mar 2026",
    category: "Futebol",
    type: "sport",
    status: "live",
    priceYes: 0.58,
    priceNo: 0.18,
    variation24h: 0.12,
    volume: 2100000,
    commentCount: 1200,
    resolutionDate: "2026-03-30",
    sport: { home: "Flamengo", away: "Palmeiras", homeScore: 2, awayScore: 1, clock: "67'" },
    outcomes: [
      { label: "Flamengo", probability: 0.58 },
      { label: "Empate", probability: 0.24 },
      { label: "Palmeiras", probability: 0.18 },
    ],
  },
  {
    id: "10",
    slug: "reforma-tributaria-2026",
    title: "Reforma tributária é implementada até dezembro 2026?",
    category: "Política",
    type: "binary",
    status: "active",
    priceYes: 0.35,
    priceNo: 0.65,
    variation24h: -0.015,
    volume: 750000,
    commentCount: 98,
    resolutionDate: "2026-12-31",
  },
  {
    id: "11",
    slug: "eth-5k-2026",
    title: "ETH ultrapassa $5.000 em 2026?",
    category: "Cripto",
    type: "binary",
    status: "active",
    priceYes: 0.31,
    priceNo: 0.69,
    variation24h: -0.028,
    volume: 520000,
    commentCount: 45,
    resolutionDate: "2026-12-31",
  },
  {
    id: "12",
    slug: "selic-marco-resolvido",
    title: "Selic subiu na reunião do Copom de março 2026?",
    category: "Economia",
    type: "binary",
    status: "resolved_yes",
    priceYes: 1.0,
    priceNo: 0.0,
    variation24h: 0,
    volume: 1900000,
    commentCount: 142,
    resolutionDate: "2026-03-19",
    source: "Banco Central do Brasil — Comunicado Copom nº 45.123",
  },
];

export function formatVolume(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}K`;
  return `R$ ${v}`;
}

export function formatVariation(v: number): string {
  const sign = v >= 0 ? "+" : "-";
  return `${sign}${Math.abs(v * 100).toFixed(1)}%`;
}
