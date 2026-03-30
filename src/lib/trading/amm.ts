/**
 * Constant Product Market Maker (CPMM) Engine
 *
 * Implements the x * y = k invariant used by Polymarket-style prediction markets.
 *
 * Pool state: { yes_shares, no_shares }
 * Invariant: yes_shares * no_shares = k (constant)
 *
 * Price of Yes = no_shares / (yes_shares + no_shares)
 * Price of No  = yes_shares / (yes_shares + no_shares)
 *
 * When a user buys Yes shares:
 *   1. User deposits `amount` (after fee) into the pool
 *   2. Pool mints `amount` of BOTH yes and no shares (keeping k balanced)
 *   3. User receives the yes shares; the no shares stay in the pool
 *   4. Net effect: pool_no increases, pool_yes stays same => yes price goes up
 *
 * Actual CPMM math (simplified):
 *   - User pays `amount`, fee is deducted => `netAmount`
 *   - Shares received = pool_side - (k / (pool_other + netAmount))
 *     where pool_side is the side the user is buying
 */

import { TRADE_FEE_RATE } from "@/lib/constants";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PoolState {
  yesShares: number;
  noShares: number;
}

export interface PriceQuote {
  yes: number;
  no: number;
}

export interface BuyResult {
  shares: number;
  avgPrice: number;
  priceImpact: number;
  fee: number;
  newPoolYes: number;
  newPoolNo: number;
}

export interface SellResult {
  payout: number;
  avgPrice: number;
  priceImpact: number;
  fee: number;
  newPoolYes: number;
  newPoolNo: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const DEFAULT_FEE_RATE = TRADE_FEE_RATE;
export const MIN_TRADE_AMOUNT = 1;
export const MIN_POOL_SHARES = 1; // prevent pool from going to zero

// ─── Core Functions ──────────────────────────────────────────────────────────

/**
 * Calculate the current price from pool state.
 *
 * Price of Yes = noShares / (yesShares + noShares)
 * Price of No  = yesShares / (yesShares + noShares)
 */
export function getPrice(yesShares: number, noShares: number): PriceQuote {
  if (yesShares <= 0 || noShares <= 0) {
    throw new AmmError("invalid_pool", "Pool shares must be positive");
  }

  const total = yesShares + noShares;
  return {
    yes: noShares / total,
    no: yesShares / total,
  };
}

/**
 * Calculate how many shares a user receives for a given dollar amount.
 *
 * CPMM buy formula:
 *   k = poolYes * poolNo
 *   fee = amount * feeRate
 *   netAmount = amount - fee
 *
 *   If buying YES:
 *     New poolNo = poolNo + netAmount  (user's money adds no-side liquidity)
 *     New poolYes = k / newPoolNo      (invariant maintained)
 *     sharesOut = poolYes - newPoolYes  (user gets the difference)
 *
 *   If buying NO: mirror logic with yes/no swapped
 */
export function calculateBuy(
  poolYes: number,
  poolNo: number,
  side: "yes" | "no",
  amount: number,
  feeRate: number = DEFAULT_FEE_RATE,
): BuyResult {
  if (poolYes <= 0 || poolNo <= 0) {
    throw new AmmError("invalid_pool", "Pool shares must be positive");
  }
  if (amount < MIN_TRADE_AMOUNT) {
    throw new AmmError("amount_too_small", `Minimum trade amount is ${MIN_TRADE_AMOUNT}`);
  }
  if (feeRate < 0 || feeRate >= 1) {
    throw new AmmError("invalid_fee", "Fee rate must be between 0 and 1");
  }

  const fee = amount * feeRate;
  const netAmount = amount - fee;
  const k = poolYes * poolNo;

  const priceBefore = getPrice(poolYes, poolNo);

  let newPoolYes: number;
  let newPoolNo: number;
  let sharesOut: number;

  if (side === "yes") {
    // User's money increases the no-side of the pool
    newPoolNo = poolNo + netAmount;
    newPoolYes = k / newPoolNo;
    sharesOut = poolYes - newPoolYes;
  } else {
    // User's money increases the yes-side of the pool
    newPoolYes = poolYes + netAmount;
    newPoolNo = k / newPoolYes;
    sharesOut = poolNo - newPoolNo;
  }

  // Safety: ensure pool doesn't go below minimum
  if (newPoolYes < MIN_POOL_SHARES || newPoolNo < MIN_POOL_SHARES) {
    throw new AmmError("insufficient_liquidity", "Trade would drain the pool beyond safe limits");
  }

  if (sharesOut <= 0) {
    throw new AmmError("zero_shares", "Trade amount too small to receive any shares");
  }

  const avgPrice = amount / sharesOut;
  const priceAfter = getPrice(newPoolYes, newPoolNo);
  const spotBefore = side === "yes" ? priceBefore.yes : priceBefore.no;
  const spotAfter = side === "yes" ? priceAfter.yes : priceAfter.no;
  const priceImpact = (spotAfter - spotBefore) / spotBefore;

  return {
    shares: roundDown(sharesOut, 6),
    avgPrice: round(avgPrice, 6),
    priceImpact: round(priceImpact, 6),
    fee: round(fee, 2),
    newPoolYes: round(newPoolYes, 6),
    newPoolNo: round(newPoolNo, 6),
  };
}

/**
 * Calculate how much money a user receives for selling shares back to the pool.
 *
 * CPMM sell formula (reverse of buy):
 *   k = poolYes * poolNo
 *
 *   If selling YES:
 *     New poolYes = poolYes + shares    (shares go back to pool)
 *     New poolNo = k / newPoolYes       (invariant maintained)
 *     grossPayout = poolNo - newPoolNo  (user gets the liquidity freed)
 *     fee = grossPayout * feeRate
 *     netPayout = grossPayout - fee
 *
 *   If selling NO: mirror logic
 */
export function calculateSell(
  poolYes: number,
  poolNo: number,
  side: "yes" | "no",
  shares: number,
  feeRate: number = DEFAULT_FEE_RATE,
): SellResult {
  if (poolYes <= 0 || poolNo <= 0) {
    throw new AmmError("invalid_pool", "Pool shares must be positive");
  }
  if (shares <= 0) {
    throw new AmmError("invalid_shares", "Shares must be positive");
  }
  if (feeRate < 0 || feeRate >= 1) {
    throw new AmmError("invalid_fee", "Fee rate must be between 0 and 1");
  }

  const k = poolYes * poolNo;
  const priceBefore = getPrice(poolYes, poolNo);

  let newPoolYes: number;
  let newPoolNo: number;
  let grossPayout: number;

  if (side === "yes") {
    // Yes shares go back into the pool
    newPoolYes = poolYes + shares;
    newPoolNo = k / newPoolYes;
    grossPayout = poolNo - newPoolNo;
  } else {
    // No shares go back into the pool
    newPoolNo = poolNo + shares;
    newPoolYes = k / newPoolNo;
    grossPayout = poolYes - newPoolYes;
  }

  if (grossPayout <= 0) {
    throw new AmmError("zero_payout", "Sell amount results in zero or negative payout");
  }

  // Safety: ensure pool doesn't go below minimum
  if (newPoolYes < MIN_POOL_SHARES || newPoolNo < MIN_POOL_SHARES) {
    throw new AmmError("insufficient_liquidity", "Trade would drain the pool beyond safe limits");
  }

  const fee = grossPayout * feeRate;
  const netPayout = grossPayout - fee;

  if (netPayout <= 0) {
    throw new AmmError("payout_below_fee", "Payout is less than the fee amount");
  }

  const avgPrice = netPayout / shares;
  const priceAfter = getPrice(newPoolYes, newPoolNo);
  const spotBefore = side === "yes" ? priceBefore.yes : priceBefore.no;
  const spotAfter = side === "yes" ? priceAfter.yes : priceAfter.no;
  const priceImpact = (spotAfter - spotBefore) / spotBefore;

  return {
    payout: round(netPayout, 2),
    avgPrice: round(avgPrice, 6),
    priceImpact: round(priceImpact, 6),
    fee: round(fee, 2),
    newPoolYes: round(newPoolYes, 6),
    newPoolNo: round(newPoolNo, 6),
  };
}

/**
 * Initialize a new liquidity pool for a market.
 *
 * Given an initial price for "yes" and total liquidity, computes
 * the yes_shares and no_shares that produce:
 *   - The desired initial price
 *   - The desired total liquidity (yesShares + noShares)
 *
 * Price of Yes = noShares / (yesShares + noShares)
 * => noShares = initialPrice * totalShares
 * => yesShares = totalShares - noShares
 */
export function initializePool(
  initialPrice: number,
  liquidity: number,
): PoolState {
  if (initialPrice <= 0 || initialPrice >= 1) {
    throw new AmmError("invalid_price", "Initial price must be between 0 and 1 (exclusive)");
  }
  if (liquidity < 2) {
    throw new AmmError("invalid_liquidity", "Liquidity must be at least 2");
  }

  // noShares / (yesShares + noShares) = initialPrice
  // So noShares = initialPrice * liquidity, yesShares = (1 - initialPrice) * liquidity
  const noShares = round(initialPrice * liquidity, 6);
  const yesShares = round((1 - initialPrice) * liquidity, 6);

  return { yesShares, noShares };
}

/**
 * Get a price quote for a potential buy without executing.
 */
export function quoteBuy(
  poolYes: number,
  poolNo: number,
  side: "yes" | "no",
  amount: number,
  feeRate: number = DEFAULT_FEE_RATE,
): BuyResult {
  return calculateBuy(poolYes, poolNo, side, amount, feeRate);
}

/**
 * Get a price quote for a potential sell without executing.
 */
export function quoteSell(
  poolYes: number,
  poolNo: number,
  side: "yes" | "no",
  shares: number,
  feeRate: number = DEFAULT_FEE_RATE,
): SellResult {
  return calculateSell(poolYes, poolNo, side, shares, feeRate);
}

// ─── Error Handling ──────────────────────────────────────────────────────────

export class AmmError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AmmError";
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function roundDown(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.floor(value * factor) / factor;
}
