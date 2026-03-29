export const CATEGORIES = [
  "Economia",
  "Futebol",
  "Política",
  "Cultura Pop",
  "Cripto",
  "Esportes",
  "Mundo",
  "Tech / IA",
  "Clima",
  "Ciência",
  "Saúde",
  "Entretenimento",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const MARKET_STATUSES = [
  "draft",
  "active",
  "live",
  "closing",
  "resolved_yes",
  "resolved_no",
  "disputed",
  "cancelled",
] as const;

export type MarketStatus = (typeof MARKET_STATUSES)[number];

export const SORT_OPTIONS = [
  { value: "relevance", label: "Relevância" },
  { value: "volume", label: "Volume" },
  { value: "variation", label: "Variação" },
  { value: "resolution", label: "Resolução" },
  { value: "newest", label: "Mais recentes" },
] as const;

export const TAB_FILTERS = [
  { value: "all", label: "Todos" },
  { value: "trending", label: "Em alta" },
  { value: "new", label: "Novos" },
  { value: "popular", label: "Popular" },
  { value: "liquid", label: "Líquido" },
  { value: "closing", label: "Fechando" },
  { value: "disputed", label: "Disputado" },
  { value: "brazil", label: "Brasil" },
] as const;

export const TRADE_FEE_RATE = 0.02; // 2%

export const QUICK_AMOUNTS = [20, 50, 100, 200, 500] as const;

export const CHART_PERIODS = ["1h", "6h", "24h", "7d", "30d", "all"] as const;
