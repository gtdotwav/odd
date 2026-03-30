/**
 * Trade Execution Engine
 *
 * Orchestrates the full trade lifecycle:
 *   1. Validate user balance / position
 *   2. Calculate AMM trade
 *   3. Execute atomically via Supabase RPC (execute_trade)
 *   4. Return trade result
 *
 * All monetary operations happen inside the DB transaction (the RPC function)
 * to guarantee atomicity. This module prepares and validates the trade before
 * calling the RPC, then processes the result.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { calculateBuy, calculateSell, getPrice, AmmError } from "./amm";
import type { BuyResult, SellResult } from "./amm";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TradeInput {
  clerkId: string;
  marketId: string;
  side: "yes" | "no";
  action: "buy" | "sell";
  amount: number; // dollar amount for buy, number of shares for sell
}

export interface TradeResult {
  success: true;
  orderId: string;
  action: "buy" | "sell";
  side: "yes" | "no";
  amount: number;
  shares: number;
  avgPrice: number;
  fee: number;
  priceImpact: number;
  newPriceYes: number;
  newPriceNo: number;
  balanceAfter: number;
}

export interface TradeError {
  success: false;
  error: string;
  message: string;
}

type TradeOutcome = TradeResult | TradeError;

// Active market statuses that allow trading
const TRADABLE_STATUSES = ["active", "live", "closing"];

// ─── Main Execution ──────────────────────────────────────────────────────────

/**
 * Execute a trade end-to-end.
 *
 * For buys: `amount` is dollars to spend.
 * For sells: `amount` is number of shares to sell.
 */
export async function executeTrade(
  supabase: SupabaseClient<Database>,
  input: TradeInput,
): Promise<TradeOutcome> {
  const { clerkId, marketId, side, action, amount } = input;

  // ── Step 1: Fetch market and validate ──────────────────────────────────
  const { data: market, error: marketError } = await supabase
    .from("markets")
    .select("id, slug, status, pool_yes, pool_no, pool_k, fee_rate")
    .eq("id", marketId)
    .single();

  if (marketError || !market) {
    return {
      success: false,
      error: "market_not_found",
      message: "Market does not exist",
    };
  }

  if (!TRADABLE_STATUSES.includes(market.status)) {
    return {
      success: false,
      error: "market_not_active",
      message: `Market is ${market.status} and cannot be traded`,
    };
  }

  const poolYes = Number(market.pool_yes);
  const poolNo = Number(market.pool_no);
  const feeRate = Number(market.fee_rate);

  if (poolYes <= 0 || poolNo <= 0) {
    return {
      success: false,
      error: "pool_not_initialized",
      message: "Market liquidity pool is not initialized",
    };
  }

  // ── Step 2: Pre-calculate AMM result ───────────────────────────────────
  let ammResult: BuyResult | SellResult;
  try {
    if (action === "buy") {
      ammResult = calculateBuy(poolYes, poolNo, side, amount, feeRate);
    } else {
      ammResult = calculateSell(poolYes, poolNo, side, amount, feeRate);
    }
  } catch (err) {
    if (err instanceof AmmError) {
      return { success: false, error: err.code, message: err.message };
    }
    throw err;
  }

  // ── Step 3: Execute via atomic RPC ─────────────────────────────────────
  const { data, error: rpcError } = await supabase.rpc("execute_trade", {
    p_clerk_id: clerkId,
    p_market_id: marketId,
    p_side: side,
    p_action: action,
    p_amount: amount,
    p_expected_shares: action === "buy" ? (ammResult as BuyResult).shares : amount,
    p_expected_payout: action === "sell" ? (ammResult as SellResult).payout : 0,
    p_fee: ammResult.fee,
    p_new_pool_yes: ammResult.newPoolYes,
    p_new_pool_no: ammResult.newPoolNo,
  });

  if (rpcError) {
    console.error("[executeTrade] RPC error:", rpcError);
    return {
      success: false,
      error: "execution_error",
      message: rpcError.message,
    };
  }

  const result = data as Record<string, unknown>;

  if (result.error) {
    return {
      success: false,
      error: String(result.error),
      message: String(result.message || "Trade execution failed"),
    };
  }

  // ── Step 4: Build response ─────────────────────────────────────────────
  const newPrice = getPrice(ammResult.newPoolYes, ammResult.newPoolNo);

  return {
    success: true,
    orderId: String(result.order_id),
    action,
    side,
    amount,
    shares: action === "buy" ? (ammResult as BuyResult).shares : amount,
    avgPrice: ammResult.avgPrice,
    fee: ammResult.fee,
    priceImpact: ammResult.priceImpact,
    newPriceYes: newPrice.yes,
    newPriceNo: newPrice.no,
    balanceAfter: Number(result.balance_after ?? 0),
  };
}

/**
 * Get a price quote for a potential trade (no execution).
 */
export async function getTradeQuote(
  supabase: SupabaseClient<Database>,
  marketId: string,
  side: "yes" | "no",
  action: "buy" | "sell",
  amount: number,
) {
  const { data: market, error } = await supabase
    .from("markets")
    .select("id, pool_yes, pool_no, fee_rate, status")
    .eq("id", marketId)
    .single();

  if (error || !market) {
    return { error: "market_not_found", message: "Market does not exist" };
  }

  const poolYes = Number(market.pool_yes);
  const poolNo = Number(market.pool_no);
  const feeRate = Number(market.fee_rate);

  try {
    if (action === "buy") {
      const result = calculateBuy(poolYes, poolNo, side, amount, feeRate);
      const newPrice = getPrice(result.newPoolYes, result.newPoolNo);
      return {
        ...result,
        currentPriceYes: getPrice(poolYes, poolNo).yes,
        currentPriceNo: getPrice(poolYes, poolNo).no,
        newPriceYes: newPrice.yes,
        newPriceNo: newPrice.no,
      };
    } else {
      const result = calculateSell(poolYes, poolNo, side, amount, feeRate);
      const newPrice = getPrice(result.newPoolYes, result.newPoolNo);
      return {
        ...result,
        currentPriceYes: getPrice(poolYes, poolNo).yes,
        currentPriceNo: getPrice(poolYes, poolNo).no,
        newPriceYes: newPrice.yes,
        newPriceNo: newPrice.no,
      };
    }
  } catch (err) {
    if (err instanceof AmmError) {
      return { error: err.code, message: err.message };
    }
    throw err;
  }
}
