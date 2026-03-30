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
  outcomes?: Outcome[];
  sport?: SportData;
  crypto?: CryptoData;
  context?: string;
  rules?: string;
  source?: string;
  featured?: boolean;
  feeRate?: number;
  createdAt?: string;
}

export interface Outcome {
  id: string;
  label: string;
  probability: number;
}

export interface SportData {
  home: string;
  away: string;
  homeScore?: number;
  awayScore?: number;
  clock?: string;
}

export interface CryptoData {
  asset: string;
  currentPrice: number;
  targetPrice: number;
}

export interface PricePoint {
  priceYes: number;
  priceNo: number;
  volumeDelta: number;
  recordedAt: string;
}

export interface MarketDetail extends Market {
  priceHistory: PricePoint[];
}

export interface MarketsResponse {
  markets: Market[];
  total: number;
  hasMore: boolean;
}
