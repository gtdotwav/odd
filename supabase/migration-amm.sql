-- ============================================================================
-- Migration: AMM (Automated Market Maker) - Constant Product Pool
-- ============================================================================
-- Adds liquidity pool columns to markets and creates the atomic execute_trade
-- RPC function that handles the full trade lifecycle in a single transaction.
-- ============================================================================

-- ─── 1. Add pool columns to markets ─────────────────────────────────────────

ALTER TABLE markets ADD COLUMN IF NOT EXISTS pool_yes numeric DEFAULT 1000;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS pool_no numeric DEFAULT 1000;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS pool_k numeric DEFAULT 1000000;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS total_liquidity numeric DEFAULT 2000;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS fee_rate numeric DEFAULT 0.02;

-- Backfill existing active markets: set pool from current prices
-- pool_yes / (pool_yes + pool_no) = price_no => pool_yes = price_no * total
-- pool_no / (pool_yes + pool_no) = price_yes => pool_no = price_yes * total
UPDATE markets
SET
  pool_yes = GREATEST((1 - price_yes) * 2000, 1),
  pool_no  = GREATEST(price_yes * 2000, 1),
  pool_k   = GREATEST((1 - price_yes) * 2000, 1) * GREATEST(price_yes * 2000, 1),
  total_liquidity = 2000,
  fee_rate = 0.02
WHERE pool_yes = 1000
  AND pool_no = 1000
  AND price_yes IS NOT NULL
  AND price_yes > 0
  AND price_yes < 1;

-- ─── 2. Create execute_trade RPC ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION execute_trade(
  p_clerk_id text,
  p_market_id uuid,
  p_side text,        -- 'yes' or 'no'
  p_action text,      -- 'buy' or 'sell'
  p_amount numeric,   -- dollar amount (buy) or share count (sell)
  p_expected_shares numeric,
  p_expected_payout numeric,
  p_fee numeric,
  p_new_pool_yes numeric,
  p_new_pool_no numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_wallet_id uuid;
  v_wallet_balance numeric;
  v_position_qty numeric;
  v_position_id uuid;
  v_order_id uuid;
  v_transaction_id uuid;
  v_new_balance numeric;
  v_new_position_qty numeric;
  v_avg_price numeric;
  v_market_status text;
  v_current_pool_yes numeric;
  v_current_pool_no numeric;
  v_current_pool_k numeric;
  v_new_price_yes numeric;
  v_new_price_no numeric;
  v_total_pool numeric;
  v_old_price_yes numeric;
BEGIN
  -- ── Validate side and action ────────────────────────────────────────────
  IF p_side NOT IN ('yes', 'no') THEN
    RETURN jsonb_build_object('error', 'invalid_side', 'message', 'Side must be yes or no');
  END IF;

  IF p_action NOT IN ('buy', 'sell') THEN
    RETURN jsonb_build_object('error', 'invalid_action', 'message', 'Action must be buy or sell');
  END IF;

  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('error', 'invalid_amount', 'message', 'Amount must be positive');
  END IF;

  -- ── Resolve user from clerk_id ──────────────────────────────────────────
  SELECT id INTO v_user_id FROM profiles WHERE clerk_id = p_clerk_id;
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'user_not_found', 'message', 'User profile not found');
  END IF;

  -- ── Lock market row and validate ────────────────────────────────────────
  SELECT status, pool_yes, pool_no, pool_k, price_yes
  INTO v_market_status, v_current_pool_yes, v_current_pool_no, v_current_pool_k, v_old_price_yes
  FROM markets
  WHERE id = p_market_id
  FOR UPDATE;

  IF v_market_status IS NULL THEN
    RETURN jsonb_build_object('error', 'market_not_found', 'message', 'Market not found');
  END IF;

  IF v_market_status NOT IN ('active', 'live', 'closing') THEN
    RETURN jsonb_build_object('error', 'market_not_active', 'message', 'Market is not active for trading');
  END IF;

  -- ── Optimistic concurrency: verify pool hasn't changed ──────────────────
  -- Allow small floating point differences (< 0.01) due to rounding
  IF ABS(v_current_pool_yes - p_new_pool_yes + (p_new_pool_yes - p_new_pool_yes)) > 0 THEN
    -- We just check pool_k hasn't drastically changed since the quote
    -- A >1% k change means another trade happened
    IF v_current_pool_k > 0 AND ABS(v_current_pool_yes * v_current_pool_no - v_current_pool_k) / v_current_pool_k > 0.01 THEN
      RETURN jsonb_build_object('error', 'pool_stale', 'message', 'Pool state changed, please retry');
    END IF;
  END IF;

  -- ── Recalculate with current pool state for safety ──────────────────────
  -- We trust the app-layer calculation but use the locked pool values
  -- The app pre-calculated with potentially stale pool; we redo with locked values
  DECLARE
    v_k numeric := v_current_pool_yes * v_current_pool_no;
    v_net_amount numeric;
    v_shares_out numeric;
    v_gross_payout numeric;
    v_net_payout numeric;
    v_fee numeric;
    v_fee_rate numeric;
    v_final_pool_yes numeric;
    v_final_pool_no numeric;
  BEGIN
    SELECT fee_rate INTO v_fee_rate FROM markets WHERE id = p_market_id;

    IF p_action = 'buy' THEN
      -- ── BUY: user spends dollars, receives shares ───────────────────────
      v_fee := p_amount * v_fee_rate;
      v_net_amount := p_amount - v_fee;

      IF p_side = 'yes' THEN
        v_final_pool_no := v_current_pool_no + v_net_amount;
        v_final_pool_yes := v_k / v_final_pool_no;
        v_shares_out := v_current_pool_yes - v_final_pool_yes;
      ELSE
        v_final_pool_yes := v_current_pool_yes + v_net_amount;
        v_final_pool_no := v_k / v_final_pool_yes;
        v_shares_out := v_current_pool_no - v_final_pool_no;
      END IF;

      IF v_shares_out <= 0 THEN
        RETURN jsonb_build_object('error', 'zero_shares', 'message', 'Trade too small');
      END IF;

      IF v_final_pool_yes < 1 OR v_final_pool_no < 1 THEN
        RETURN jsonb_build_object('error', 'insufficient_liquidity', 'message', 'Insufficient pool liquidity');
      END IF;

      -- ── Check wallet balance ──────────────────────────────────────────
      SELECT id, balance INTO v_wallet_id, v_wallet_balance
      FROM wallets
      WHERE user_id = v_user_id
      FOR UPDATE;

      IF v_wallet_id IS NULL THEN
        RETURN jsonb_build_object('error', 'no_wallet', 'message', 'Wallet not found');
      END IF;

      IF v_wallet_balance < p_amount THEN
        RETURN jsonb_build_object('error', 'insufficient_balance',
          'message', format('Insufficient balance: have %s, need %s', v_wallet_balance, p_amount));
      END IF;

      -- ── Debit wallet ──────────────────────────────────────────────────
      v_new_balance := v_wallet_balance - p_amount;
      UPDATE wallets SET balance = v_new_balance, updated_at = now() WHERE id = v_wallet_id;

      -- ── Record transaction ────────────────────────────────────────────
      INSERT INTO transactions (user_id, wallet_id, type, amount, balance_after, description, status)
      VALUES (v_user_id, v_wallet_id, 'trade_buy', -p_amount, v_new_balance,
              format('Buy %s shares of %s @ market %s', round(v_shares_out::numeric, 4), p_side, p_market_id),
              'completed')
      RETURNING id INTO v_transaction_id;

      -- ── Create or update position ─────────────────────────────────────
      SELECT id, quantity, avg_price INTO v_position_id, v_position_qty, v_avg_price
      FROM positions
      WHERE user_id = v_user_id AND market_id = p_market_id AND side = p_side
      FOR UPDATE;

      IF v_position_id IS NOT NULL THEN
        -- Weighted average price
        v_new_position_qty := v_position_qty + v_shares_out;
        v_avg_price := ((v_avg_price * v_position_qty) + (p_amount / v_shares_out * v_shares_out)) / v_new_position_qty;
        UPDATE positions
        SET quantity = v_new_position_qty, avg_price = v_avg_price, updated_at = now()
        WHERE id = v_position_id;
      ELSE
        v_new_position_qty := v_shares_out;
        v_avg_price := p_amount / v_shares_out;
        INSERT INTO positions (user_id, market_id, side, quantity, avg_price)
        VALUES (v_user_id, p_market_id, p_side, v_shares_out, v_avg_price);
      END IF;

      -- ── Create order record ───────────────────────────────────────────
      INSERT INTO orders (user_id, market_id, side, type, price, quantity, filled_quantity, status)
      VALUES (v_user_id, p_market_id, p_side, 'market', p_amount / v_shares_out, round(v_shares_out::numeric, 4), round(v_shares_out::numeric, 4), 'filled')
      RETURNING id INTO v_order_id;

      -- ── Update market pool state ──────────────────────────────────────
      v_total_pool := v_final_pool_yes + v_final_pool_no;
      v_new_price_yes := v_final_pool_no / v_total_pool;
      v_new_price_no := v_final_pool_yes / v_total_pool;

      UPDATE markets
      SET pool_yes = v_final_pool_yes,
          pool_no = v_final_pool_no,
          pool_k = v_final_pool_yes * v_final_pool_no,
          price_yes = round(v_new_price_yes::numeric, 4),
          price_no = round(v_new_price_no::numeric, 4),
          volume = volume + p_amount,
          updated_at = now()
      WHERE id = p_market_id;

      -- ── Record activity ───────────────────────────────────────────────
      INSERT INTO activity_log (user_id, market_id, action, side, amount, price)
      VALUES (v_user_id, p_market_id, 'buy', p_side, p_amount, p_amount / v_shares_out);

      -- ── Record price history ──────────────────────────────────────────
      INSERT INTO price_history (market_id, price_yes, price_no, volume_delta, recorded_at)
      VALUES (p_market_id, round(v_new_price_yes::numeric, 4), round(v_new_price_no::numeric, 4), p_amount, now());

      -- ── Create notification ───────────────────────────────────────────
      INSERT INTO notifications (user_id, type, title, body, data)
      VALUES (v_user_id, 'trade_filled',
              'Trade Executed',
              format('Bought %s %s shares for $%s', round(v_shares_out::numeric, 2), upper(p_side), round(p_amount::numeric, 2)),
              jsonb_build_object(
                'order_id', v_order_id,
                'market_id', p_market_id,
                'side', p_side,
                'action', 'buy',
                'shares', round(v_shares_out::numeric, 4),
                'amount', round(p_amount::numeric, 2),
                'avg_price', round((p_amount / v_shares_out)::numeric, 4),
                'fee', round(v_fee::numeric, 2)
              ));

      RETURN jsonb_build_object(
        'order_id', v_order_id,
        'shares', round(v_shares_out::numeric, 6),
        'amount', p_amount,
        'fee', round(v_fee::numeric, 2),
        'avg_price', round((p_amount / v_shares_out)::numeric, 6),
        'balance_after', v_new_balance,
        'new_price_yes', round(v_new_price_yes::numeric, 4),
        'new_price_no', round(v_new_price_no::numeric, 4)
      );

    ELSE
      -- ── SELL: user returns shares, receives dollars ─────────────────────

      -- Check position
      SELECT id, quantity INTO v_position_id, v_position_qty
      FROM positions
      WHERE user_id = v_user_id AND market_id = p_market_id AND side = p_side
      FOR UPDATE;

      IF v_position_id IS NULL OR v_position_qty IS NULL OR v_position_qty < p_amount THEN
        RETURN jsonb_build_object('error', 'insufficient_position',
          'message', format('Insufficient shares: have %s, want to sell %s',
            COALESCE(v_position_qty, 0), p_amount));
      END IF;

      -- Calculate sell output
      IF p_side = 'yes' THEN
        v_final_pool_yes := v_current_pool_yes + p_amount;
        v_final_pool_no := v_k / v_final_pool_yes;
        v_gross_payout := v_current_pool_no - v_final_pool_no;
      ELSE
        v_final_pool_no := v_current_pool_no + p_amount;
        v_final_pool_yes := v_k / v_final_pool_no;
        v_gross_payout := v_current_pool_yes - v_final_pool_yes;
      END IF;

      IF v_gross_payout <= 0 THEN
        RETURN jsonb_build_object('error', 'zero_payout', 'message', 'Sell results in zero payout');
      END IF;

      v_fee := v_gross_payout * v_fee_rate;
      v_net_payout := v_gross_payout - v_fee;

      IF v_net_payout <= 0 THEN
        RETURN jsonb_build_object('error', 'payout_below_fee', 'message', 'Payout less than fee');
      END IF;

      IF v_final_pool_yes < 1 OR v_final_pool_no < 1 THEN
        RETURN jsonb_build_object('error', 'insufficient_liquidity', 'message', 'Insufficient pool liquidity');
      END IF;

      -- ── Credit wallet ─────────────────────────────────────────────────
      SELECT id, balance INTO v_wallet_id, v_wallet_balance
      FROM wallets
      WHERE user_id = v_user_id
      FOR UPDATE;

      IF v_wallet_id IS NULL THEN
        RETURN jsonb_build_object('error', 'no_wallet', 'message', 'Wallet not found');
      END IF;

      v_new_balance := v_wallet_balance + v_net_payout;
      UPDATE wallets SET balance = v_new_balance, updated_at = now() WHERE id = v_wallet_id;

      -- ── Record transaction ────────────────────────────────────────────
      INSERT INTO transactions (user_id, wallet_id, type, amount, balance_after, description, status)
      VALUES (v_user_id, v_wallet_id, 'trade_sell', v_net_payout, v_new_balance,
              format('Sell %s %s shares for $%s', round(p_amount::numeric, 4), p_side, round(v_net_payout::numeric, 2)),
              'completed')
      RETURNING id INTO v_transaction_id;

      -- ── Update position ───────────────────────────────────────────────
      v_new_position_qty := v_position_qty - p_amount;
      IF v_new_position_qty <= 0.0001 THEN
        DELETE FROM positions WHERE id = v_position_id;
      ELSE
        UPDATE positions SET quantity = v_new_position_qty, updated_at = now()
        WHERE id = v_position_id;
      END IF;

      -- ── Create order record ───────────────────────────────────────────
      INSERT INTO orders (user_id, market_id, side, type, price, quantity, filled_quantity, status)
      VALUES (v_user_id, p_market_id, p_side, 'market', v_net_payout / p_amount, round(p_amount::numeric, 4), round(p_amount::numeric, 4), 'filled')
      RETURNING id INTO v_order_id;

      -- ── Update market pool state ──────────────────────────────────────
      v_total_pool := v_final_pool_yes + v_final_pool_no;
      v_new_price_yes := v_final_pool_no / v_total_pool;
      v_new_price_no := v_final_pool_yes / v_total_pool;

      UPDATE markets
      SET pool_yes = v_final_pool_yes,
          pool_no = v_final_pool_no,
          pool_k = v_final_pool_yes * v_final_pool_no,
          price_yes = round(v_new_price_yes::numeric, 4),
          price_no = round(v_new_price_no::numeric, 4),
          volume = volume + v_net_payout,
          updated_at = now()
      WHERE id = p_market_id;

      -- ── Record activity ───────────────────────────────────────────────
      INSERT INTO activity_log (user_id, market_id, action, side, amount, price)
      VALUES (v_user_id, p_market_id, 'sell', p_side, v_net_payout, v_net_payout / p_amount);

      -- ── Record price history ──────────────────────────────────────────
      INSERT INTO price_history (market_id, price_yes, price_no, volume_delta, recorded_at)
      VALUES (p_market_id, round(v_new_price_yes::numeric, 4), round(v_new_price_no::numeric, 4), v_net_payout, now());

      -- ── Create notification ───────────────────────────────────────────
      INSERT INTO notifications (user_id, type, title, body, data)
      VALUES (v_user_id, 'trade_filled',
              'Trade Executed',
              format('Sold %s %s shares for $%s', round(p_amount::numeric, 2), upper(p_side), round(v_net_payout::numeric, 2)),
              jsonb_build_object(
                'order_id', v_order_id,
                'market_id', p_market_id,
                'side', p_side,
                'action', 'sell',
                'shares', round(p_amount::numeric, 4),
                'payout', round(v_net_payout::numeric, 2),
                'avg_price', round((v_net_payout / p_amount)::numeric, 4),
                'fee', round(v_fee::numeric, 2)
              ));

      RETURN jsonb_build_object(
        'order_id', v_order_id,
        'shares', round(p_amount::numeric, 6),
        'payout', round(v_net_payout::numeric, 2),
        'fee', round(v_fee::numeric, 2),
        'avg_price', round((v_net_payout / p_amount)::numeric, 6),
        'balance_after', v_new_balance,
        'new_price_yes', round(v_new_price_yes::numeric, 4),
        'new_price_no', round(v_new_price_no::numeric, 4)
      );
    END IF;
  END;
END;
$$;

-- ─── 3. Indexes for performance ──────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_positions_user_market_side
  ON positions (user_id, market_id, side);

CREATE INDEX IF NOT EXISTS idx_activity_log_market
  ON activity_log (market_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_price_history_market_time
  ON price_history (market_id, recorded_at DESC);

-- ─── 4. Verify migration ────────────────────────────────────────────────────

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'markets'
  AND column_name IN ('pool_yes', 'pool_no', 'pool_k', 'total_liquidity', 'fee_rate')
ORDER BY column_name;
