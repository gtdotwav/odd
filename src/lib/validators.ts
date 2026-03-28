import { z } from "zod";

export const createOrderSchema = z.object({
  market_id: z.string().uuid(),
  outcome_id: z.string().uuid().nullable().optional(),
  side: z.enum(["yes", "no"]),
  type: z.enum(["market", "limit"]),
  price: z.number().min(0.01).max(0.99),
  quantity: z.number().int().min(1),
});

export const createCommentSchema = z.object({
  market_id: z.string().uuid(),
  text: z.string().min(1).max(2000).trim(),
});

export const marketQuerySchema = z.object({
  category: z.string().optional(),
  status: z.string().optional(),
  sort: z.enum(["relevance", "volume", "variation", "resolution", "newest"]).optional().default("relevance"),
  search: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  tab: z.string().optional(),
});

export const depositSchema = z.object({
  amount: z.number().min(5).max(50000),
});

export const withdrawSchema = z.object({
  amount: z.number().min(10).max(50000),
  pix_key: z.string().min(1),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type MarketQueryInput = z.infer<typeof marketQuerySchema>;
export type DepositInput = z.infer<typeof depositSchema>;
export type WithdrawInput = z.infer<typeof withdrawSchema>;
