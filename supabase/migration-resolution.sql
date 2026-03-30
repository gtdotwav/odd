-- Migration: Market Resolution & Payout System
-- Run this in the Supabase SQL Editor
-- Creates the resolve_market_with_payout RPC function and claim_payout function

-- Add claimed_at to positions to track payout claims (fallback mechanism)
ALTER TABLE positions ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

-- Add resolved_value to positions to snapshot payout at resolution time
ALTER TABLE positions ADD COLUMN IF NOT EXISTS payout_amount NUMERIC(12,2) DEFAULT 0;

-- Index for finding unclaimed winning positions efficiently
CREATE INDEX IF NOT EXISTS idx_positions_market_unclaimed
  ON positions (market_id, side)
  WHERE claimed_at IS NULL;

-- Index for finding pending orders to cancel on resolution
CREATE INDEX IF NOT EXISTS idx_orders_market_pending
  ON orders (market_id, status)
  WHERE status IN ('pending', 'partial');

--------------------------------------------------------------------------------
-- resolve_market_with_payout
--
-- Atomically resolves a market and processes all payouts.
-- p_resolution: 'yes', 'no', or 'void' (cancel & refund everyone)
--
-- Returns JSON:
--   { market_id, resolution, total_paid_out, winners_count, losers_count,
--     orders_cancelled, orders_refunded_amount }
-- Or on error:
--   { error: "code", message: "..." }
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION resolve_market_with_payout(
  p_clerk_id TEXT,
  p_market_id UUID,
  p_resolution TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id UUID;
  v_market RECORD;
  v_winning_side TEXT;
  v_new_status TEXT;
  v_total_paid_out NUMERIC(12,2) := 0;
  v_winners_count INT := 0;
  v_losers_count INT := 0;
  v_orders_cancelled INT := 0;
  v_orders_refunded NUMERIC(12,2) := 0;
  v_pos RECORD;
  v_wallet RECORD;
  v_payout NUMERIC(12,2);
  v_new_balance NUMERIC(12,2);
  v_ord RECORD;
  v_refund_amount NUMERIC(12,2);
BEGIN
  -- 1. Verify admin
  SELECT id INTO v_admin_id
  FROM profiles
  WHERE clerk_id = p_clerk_id AND role = 'admin';

  IF v_admin_id IS NULL THEN
    RETURN jsonb_build_object('error', 'forbidden', 'message', 'Admin access required');
  END IF;

  -- 2. Validate resolution value
  IF p_resolution NOT IN ('yes', 'no', 'void') THEN
    RETURN jsonb_build_object('error', 'invalid_resolution', 'message', 'Resolution must be yes, no, or void');
  END IF;

  -- 3. Lock and fetch market
  SELECT * INTO v_market
  FROM markets
  WHERE id = p_market_id
  FOR UPDATE;

  IF v_market IS NULL THEN
    RETURN jsonb_build_object('error', 'not_found', 'message', 'Market not found');
  END IF;

  -- 4. Check market is resolvable
  IF v_market.status IN ('resolved_yes', 'resolved_no', 'cancelled') THEN
    RETURN jsonb_build_object('error', 'already_resolved', 'message', 'Market is already resolved or cancelled');
  END IF;

  IF v_market.status = 'draft' THEN
    RETURN jsonb_build_object('error', 'invalid_status', 'message', 'Cannot resolve a draft market');
  END IF;

  -- 5. Determine new status and winning side
  IF p_resolution = 'void' THEN
    v_new_status := 'cancelled';
    v_winning_side := NULL; -- everyone gets refunded
  ELSIF p_resolution = 'yes' THEN
    v_new_status := 'resolved_yes';
    v_winning_side := 'yes';
  ELSE
    v_new_status := 'resolved_no';
    v_winning_side := 'no';
  END IF;

  -- 6. Update market status
  UPDATE markets
  SET status = v_new_status,
      resolved_at = NOW(),
      resolved_by = v_admin_id::TEXT,
      price_yes = CASE WHEN p_resolution = 'yes' THEN 1.00
                       WHEN p_resolution = 'no' THEN 0.00
                       ELSE price_yes END,
      price_no  = CASE WHEN p_resolution = 'yes' THEN 0.00
                       WHEN p_resolution = 'no' THEN 1.00
                       ELSE price_no END,
      updated_at = NOW()
  WHERE id = p_market_id;

  -- 7. Process positions (payouts)
  FOR v_pos IN
    SELECT p.*, pr.clerk_id AS user_clerk_id
    FROM positions p
    JOIN profiles pr ON pr.id = p.user_id
    WHERE p.market_id = p_market_id
      AND p.quantity > 0
    FOR UPDATE OF p
  LOOP
    IF p_resolution = 'void' THEN
      -- Void: refund everyone their avg_price * quantity
      v_payout := ROUND(v_pos.avg_price * v_pos.quantity, 2);
    ELSIF v_pos.side = v_winning_side THEN
      -- Winner: R$1.00 per contract
      v_payout := ROUND(v_pos.quantity * 1.00, 2);
      v_winners_count := v_winners_count + 1;
    ELSE
      -- Loser: R$0.00
      v_payout := 0;
      v_losers_count := v_losers_count + 1;
    END IF;

    -- Update position with payout amount and mark as claimed (auto-credit)
    UPDATE positions
    SET payout_amount = v_payout,
        claimed_at = NOW(),
        updated_at = NOW()
    WHERE id = v_pos.id;

    -- Credit wallet if payout > 0
    IF v_payout > 0 THEN
      -- Get or create wallet (lock it)
      SELECT * INTO v_wallet
      FROM wallets
      WHERE user_id = v_pos.user_id
      FOR UPDATE;

      IF v_wallet IS NULL THEN
        INSERT INTO wallets (user_id, balance, currency)
        VALUES (v_pos.user_id, 0, 'BRL')
        RETURNING * INTO v_wallet;
      END IF;

      v_new_balance := v_wallet.balance + v_payout;

      UPDATE wallets
      SET balance = v_new_balance,
          updated_at = NOW()
      WHERE id = v_wallet.id;

      -- Record transaction
      INSERT INTO transactions (user_id, wallet_id, type, amount, balance_after, reference_id, description, status)
      VALUES (
        v_pos.user_id,
        v_wallet.id,
        CASE WHEN p_resolution = 'void' THEN 'refund' ELSE 'payout' END,
        v_payout,
        v_new_balance,
        p_market_id::TEXT,
        CASE WHEN p_resolution = 'void'
          THEN 'Market voided — refund for ' || v_pos.quantity || ' ' || v_pos.side || ' contracts'
          ELSE 'Payout for ' || v_pos.quantity || ' winning ' || v_pos.side || ' contracts'
        END,
        'completed'
      );

      v_total_paid_out := v_total_paid_out + v_payout;
    END IF;

    -- Create notification for position holder
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      v_pos.user_id,
      CASE WHEN p_resolution = 'void' THEN 'payout'
           WHEN v_pos.side = v_winning_side THEN 'payout'
           ELSE 'market_resolved'
      END,
      CASE
        WHEN p_resolution = 'void' THEN 'Market cancelled — refund processed'
        WHEN v_pos.side = v_winning_side THEN 'You won! Payout of R$' || v_payout::TEXT || ' credited'
        ELSE 'Market resolved — your ' || v_pos.side || ' position lost'
      END,
      CASE
        WHEN p_resolution = 'void' THEN 'The market "' || v_market.title || '" has been voided. R$' || v_payout::TEXT || ' has been refunded to your wallet.'
        WHEN v_pos.side = v_winning_side THEN 'The market "' || v_market.title || '" resolved ' || UPPER(p_resolution) || '. Your ' || v_pos.quantity || ' contracts earned R$' || v_payout::TEXT || '!'
        ELSE 'The market "' || v_market.title || '" resolved ' || UPPER(p_resolution) || '. Your ' || v_pos.quantity || ' ' || v_pos.side || ' contracts are now worth R$0.00.'
      END,
      jsonb_build_object(
        'market_id', p_market_id,
        'market_slug', v_market.slug,
        'resolution', p_resolution,
        'side', v_pos.side,
        'quantity', v_pos.quantity,
        'payout', v_payout
      )
    );
  END LOOP;

  -- 8. Cancel all pending/partial orders and refund reserved amounts
  FOR v_ord IN
    SELECT o.*, pr.clerk_id AS user_clerk_id
    FROM orders o
    JOIN profiles pr ON pr.id = o.user_id
    WHERE o.market_id = p_market_id
      AND o.status IN ('pending', 'partial')
    FOR UPDATE OF o
  LOOP
    -- Calculate unfilled portion to refund
    v_refund_amount := ROUND((v_ord.quantity - v_ord.filled_quantity) * v_ord.price, 2);

    -- Cancel the order
    UPDATE orders
    SET status = 'cancelled',
        updated_at = NOW()
    WHERE id = v_ord.id;

    v_orders_cancelled := v_orders_cancelled + 1;

    -- Refund reserved amount to wallet
    IF v_refund_amount > 0 THEN
      SELECT * INTO v_wallet
      FROM wallets
      WHERE user_id = v_ord.user_id
      FOR UPDATE;

      IF v_wallet IS NOT NULL THEN
        v_new_balance := v_wallet.balance + v_refund_amount;

        UPDATE wallets
        SET balance = v_new_balance,
            updated_at = NOW()
        WHERE id = v_wallet.id;

        INSERT INTO transactions (user_id, wallet_id, type, amount, balance_after, reference_id, description, status)
        VALUES (
          v_ord.user_id,
          v_wallet.id,
          'refund',
          v_refund_amount,
          v_new_balance,
          v_ord.id::TEXT,
          'Order cancelled — market resolved (' || p_resolution || ')',
          'completed'
        );

        v_orders_refunded := v_orders_refunded + v_refund_amount;
      END IF;
    END IF;
  END LOOP;

  -- 9. Return summary
  RETURN jsonb_build_object(
    'success', TRUE,
    'market_id', p_market_id,
    'resolution', p_resolution,
    'status', v_new_status,
    'total_paid_out', v_total_paid_out,
    'winners_count', v_winners_count,
    'losers_count', v_losers_count,
    'orders_cancelled', v_orders_cancelled,
    'orders_refunded_amount', v_orders_refunded
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'resolution_failed',
      'message', SQLERRM
    );
END;
$$;

--------------------------------------------------------------------------------
-- claim_payout
--
-- Fallback function: allows a user to claim payouts for a resolved market
-- if they weren't auto-credited (e.g., due to a partial failure).
--
-- Returns JSON:
--   { claimed: true, amount, market_id }
-- Or on error:
--   { error: "code", message: "..." }
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION claim_payout(
  p_clerk_id TEXT,
  p_market_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_market RECORD;
  v_winning_side TEXT;
  v_total_claim NUMERIC(12,2) := 0;
  v_pos RECORD;
  v_wallet RECORD;
  v_payout NUMERIC(12,2);
  v_new_balance NUMERIC(12,2);
  v_positions_claimed INT := 0;
BEGIN
  -- 1. Get user
  SELECT id INTO v_user_id
  FROM profiles
  WHERE clerk_id = p_clerk_id;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_found', 'message', 'User not found');
  END IF;

  -- 2. Get market
  SELECT * INTO v_market
  FROM markets
  WHERE id = p_market_id;

  IF v_market IS NULL THEN
    RETURN jsonb_build_object('error', 'not_found', 'message', 'Market not found');
  END IF;

  -- 3. Check market is resolved
  IF v_market.status NOT IN ('resolved_yes', 'resolved_no', 'cancelled') THEN
    RETURN jsonb_build_object('error', 'not_resolved', 'message', 'Market is not yet resolved');
  END IF;

  -- 4. Determine winning side
  IF v_market.status = 'resolved_yes' THEN
    v_winning_side := 'yes';
  ELSIF v_market.status = 'resolved_no' THEN
    v_winning_side := 'no';
  ELSE
    v_winning_side := NULL; -- cancelled = void, refund based on avg_price
  END IF;

  -- 5. Find unclaimed positions for this user in this market
  FOR v_pos IN
    SELECT *
    FROM positions
    WHERE market_id = p_market_id
      AND user_id = v_user_id
      AND claimed_at IS NULL
      AND quantity > 0
    FOR UPDATE
  LOOP
    IF v_market.status = 'cancelled' THEN
      -- Void: refund avg_price * quantity
      v_payout := ROUND(v_pos.avg_price * v_pos.quantity, 2);
    ELSIF v_pos.side = v_winning_side THEN
      -- Winner: R$1.00 per contract
      v_payout := ROUND(v_pos.quantity * 1.00, 2);
    ELSE
      -- Loser: mark as claimed but no payout
      v_payout := 0;
    END IF;

    -- Mark position as claimed
    UPDATE positions
    SET claimed_at = NOW(),
        payout_amount = v_payout,
        updated_at = NOW()
    WHERE id = v_pos.id;

    v_positions_claimed := v_positions_claimed + 1;

    -- Credit wallet if payout > 0
    IF v_payout > 0 THEN
      SELECT * INTO v_wallet
      FROM wallets
      WHERE user_id = v_user_id
      FOR UPDATE;

      IF v_wallet IS NULL THEN
        INSERT INTO wallets (user_id, balance, currency)
        VALUES (v_user_id, 0, 'BRL')
        RETURNING * INTO v_wallet;
      END IF;

      v_new_balance := v_wallet.balance + v_payout;

      UPDATE wallets
      SET balance = v_new_balance,
          updated_at = NOW()
      WHERE id = v_wallet.id;

      INSERT INTO transactions (user_id, wallet_id, type, amount, balance_after, reference_id, description, status)
      VALUES (
        v_user_id,
        v_wallet.id,
        CASE WHEN v_market.status = 'cancelled' THEN 'refund' ELSE 'payout' END,
        v_payout,
        v_new_balance,
        p_market_id::TEXT,
        'Claimed payout for ' || v_pos.quantity || ' ' || v_pos.side || ' contracts',
        'completed'
      );

      v_total_claim := v_total_claim + v_payout;
    END IF;
  END LOOP;

  IF v_positions_claimed = 0 THEN
    RETURN jsonb_build_object('error', 'nothing_to_claim', 'message', 'No unclaimed positions found for this market');
  END IF;

  RETURN jsonb_build_object(
    'claimed', TRUE,
    'amount', v_total_claim,
    'positions_claimed', v_positions_claimed,
    'market_id', p_market_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'claim_failed',
      'message', SQLERRM
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION resolve_market_with_payout(TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION resolve_market_with_payout(TEXT, UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION claim_payout(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION claim_payout(TEXT, UUID) TO anon;
