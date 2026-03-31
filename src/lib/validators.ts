import { z } from "zod";

// ── CPF validation ──────────────────────────────────────────────
function isValidCpf(cpf: string): boolean {
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // all same digit

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
  let check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  if (parseInt(cpf[9]) !== check) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
  check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  if (parseInt(cpf[10]) !== check) return false;

  return true;
}

// ── Schemas ─────────────────────────────────────────────────────

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
  amount: z.number().min(5).max(50000).transform(v => Math.round(v * 100) / 100),
});

export const withdrawSchema = z.object({
  amount: z.number().min(10).max(50000).transform(v => Math.round(v * 100) / 100),
  pix_key: z.string().min(1),
});

export const tradeSchema = z.object({
  side: z.enum(["yes", "no"]),
  action: z.enum(["buy", "sell"]),
  amount: z.number().positive().max(1_000_000).transform(v => Math.round(v * 100) / 100),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type MarketQueryInput = z.infer<typeof marketQuerySchema>;

export const updateProfileSchema = z.object({
  display_name: z.string().min(2).max(50).optional(),
  handle: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/, "Apenas letras minúsculas, números e _").optional(),
  bio: z.string().max(200).optional(),
  full_name: z.string().min(3).max(100).optional(),
  cpf: z.string().regex(/^\d{11}$/, "CPF deve ter 11 dígitos").refine(isValidCpf, "CPF inválido").optional(),
  date_of_birth: z.string().refine((val) => {
    const d = new Date(val);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    const age = (now.getTime() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    return age >= 18 && age <= 120;
  }, "Idade deve ser entre 18 e 120 anos").optional(),
  phone: z.string().regex(/^\d{10,11}$/, "Telefone deve ter 10 ou 11 dígitos").optional(),
});

export const savePixSchema = z.object({
  pix_key: z.string().min(1).max(100),
  pix_key_type: z.enum(["cpf", "email", "phone", "random"]),
}).refine((data) => {
  switch (data.pix_key_type) {
    case "cpf": return /^\d{11}$/.test(data.pix_key);
    case "email": return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.pix_key);
    case "phone": return /^\d{10,11}$/.test(data.pix_key);
    case "random": return data.pix_key.length >= 10;
    default: return true;
  }
}, { message: "Chave PIX inválida para o tipo selecionado" });

export type DepositInput = z.infer<typeof depositSchema>;
export type WithdrawInput = z.infer<typeof withdrawSchema>;
export type TradeInput = z.infer<typeof tradeSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type SavePixInput = z.infer<typeof savePixSchema>;
