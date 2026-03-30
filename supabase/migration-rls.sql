-- ============================================================================
-- Migration: Row Level Security (RLS) Policies
-- ============================================================================
-- Enables RLS on all tables and creates granular access policies.
--
-- Architecture notes:
--   - The app calls Supabase from Next.js API routes using the anon key.
--   - Most writes go through SECURITY DEFINER RPC functions (execute_trade,
--     post_comment, add_balance, etc.) which bypass RLS.
--   - These policies protect direct table access for reads and the few
--     direct writes that don't use RPCs.
--   - service_role always bypasses RLS (Supabase built-in), so admin
--     operations using the service_role key are unaffected.
-- ============================================================================

-- ─── 1. Enable RLS on all tables ───────────────────────────────────────────

ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets          ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcomes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets          ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows          ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history    ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sport_data       ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_data      ENABLE ROW LEVEL SECURITY;


-- ─── 2. profiles ───────────────────────────────────────────────────────────
-- Anyone can read profiles (leaderboard, user pages).
-- Only the profile owner can update their own row.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_select_public' AND tablename = 'profiles') THEN
    CREATE POLICY profiles_select_public ON profiles FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_update_own' AND tablename = 'profiles') THEN
    CREATE POLICY profiles_update_own ON profiles FOR UPDATE
      USING (clerk_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
      WITH CHECK (clerk_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub');
  END IF;
END $$;

-- Allow inserts for new user signup (webhook creates profiles via service_role,
-- but just in case anon key is used)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_insert_own' AND tablename = 'profiles') THEN
    CREATE POLICY profiles_insert_own ON profiles FOR INSERT
      WITH CHECK (clerk_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub');
  END IF;
END $$;


-- ─── 3. markets ────────────────────────────────────────────────────────────
-- Anyone can read markets. Writes are handled by SECURITY DEFINER RPCs
-- or service_role (admin).

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'markets_select_public' AND tablename = 'markets') THEN
    CREATE POLICY markets_select_public ON markets FOR SELECT USING (true);
  END IF;
END $$;


-- ─── 4. outcomes ───────────────────────────────────────────────────────────
-- Anyone can read outcomes.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'outcomes_select_public' AND tablename = 'outcomes') THEN
    CREATE POLICY outcomes_select_public ON outcomes FOR SELECT USING (true);
  END IF;
END $$;


-- ─── 5. orders ─────────────────────────────────────────────────────────────
-- Users can read only their own orders. Writes go through execute_trade RPC.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'orders_select_own' AND tablename = 'orders') THEN
    CREATE POLICY orders_select_own ON orders FOR SELECT
      USING (
        user_id IN (
          SELECT id FROM profiles
          WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
        )
      );
  END IF;
END $$;


-- ─── 6. positions ──────────────────────────────────────────────────────────
-- Users can read only their own positions.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'positions_select_own' AND tablename = 'positions') THEN
    CREATE POLICY positions_select_own ON positions FOR SELECT
      USING (
        user_id IN (
          SELECT id FROM profiles
          WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
        )
      );
  END IF;
END $$;


-- ─── 7. wallets ────────────────────────────────────────────────────────────
-- Users can read only their own wallet.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'wallets_select_own' AND tablename = 'wallets') THEN
    CREATE POLICY wallets_select_own ON wallets FOR SELECT
      USING (
        user_id IN (
          SELECT id FROM profiles
          WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
        )
      );
  END IF;
END $$;


-- ─── 8. transactions ──────────────────────────────────────────────────────
-- Users can read only their own transactions.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'transactions_select_own' AND tablename = 'transactions') THEN
    CREATE POLICY transactions_select_own ON transactions FOR SELECT
      USING (
        user_id IN (
          SELECT id FROM profiles
          WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
        )
      );
  END IF;
END $$;


-- ─── 9. comments ───────────────────────────────────────────────────────────
-- Anyone can read comments. Authenticated users can insert their own.
-- (post_comment RPC handles most inserts, but this covers direct access.)

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'comments_select_public' AND tablename = 'comments') THEN
    CREATE POLICY comments_select_public ON comments FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'comments_insert_own' AND tablename = 'comments') THEN
    CREATE POLICY comments_insert_own ON comments FOR INSERT
      WITH CHECK (
        user_id IN (
          SELECT id FROM profiles
          WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
        )
      );
  END IF;
END $$;


-- ─── 10. comment_likes ────────────────────────────────────────────────────
-- Authenticated users can manage their own likes.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'comment_likes_select_public' AND tablename = 'comment_likes') THEN
    CREATE POLICY comment_likes_select_public ON comment_likes FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'comment_likes_insert_own' AND tablename = 'comment_likes') THEN
    CREATE POLICY comment_likes_insert_own ON comment_likes FOR INSERT
      WITH CHECK (
        user_id IN (
          SELECT id FROM profiles
          WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'comment_likes_delete_own' AND tablename = 'comment_likes') THEN
    CREATE POLICY comment_likes_delete_own ON comment_likes FOR DELETE
      USING (
        user_id IN (
          SELECT id FROM profiles
          WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
        )
      );
  END IF;
END $$;


-- ─── 11. follows ───────────────────────────────────────────────────────────
-- Anyone can read follows (follower counts). Users manage their own.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'follows_select_public' AND tablename = 'follows') THEN
    CREATE POLICY follows_select_public ON follows FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'follows_insert_own' AND tablename = 'follows') THEN
    CREATE POLICY follows_insert_own ON follows FOR INSERT
      WITH CHECK (
        follower_id IN (
          SELECT id FROM profiles
          WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'follows_delete_own' AND tablename = 'follows') THEN
    CREATE POLICY follows_delete_own ON follows FOR DELETE
      USING (
        follower_id IN (
          SELECT id FROM profiles
          WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
        )
      );
  END IF;
END $$;


-- ─── 12. watchlist ─────────────────────────────────────────────────────────
-- Users manage their own watchlist.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'watchlist_select_own' AND tablename = 'watchlist') THEN
    CREATE POLICY watchlist_select_own ON watchlist FOR SELECT
      USING (
        user_id IN (
          SELECT id FROM profiles
          WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'watchlist_insert_own' AND tablename = 'watchlist') THEN
    CREATE POLICY watchlist_insert_own ON watchlist FOR INSERT
      WITH CHECK (
        user_id IN (
          SELECT id FROM profiles
          WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'watchlist_delete_own' AND tablename = 'watchlist') THEN
    CREATE POLICY watchlist_delete_own ON watchlist FOR DELETE
      USING (
        user_id IN (
          SELECT id FROM profiles
          WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
        )
      );
  END IF;
END $$;


-- ─── 13. notifications ────────────────────────────────────────────────────
-- Users can read and update (mark as read) their own notifications.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notifications_select_own' AND tablename = 'notifications') THEN
    CREATE POLICY notifications_select_own ON notifications FOR SELECT
      USING (
        user_id IN (
          SELECT id FROM profiles
          WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notifications_update_own' AND tablename = 'notifications') THEN
    CREATE POLICY notifications_update_own ON notifications FOR UPDATE
      USING (
        user_id IN (
          SELECT id FROM profiles
          WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
        )
      )
      WITH CHECK (
        user_id IN (
          SELECT id FROM profiles
          WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
        )
      );
  END IF;
END $$;


-- ─── 14. price_history ────────────────────────────────────────────────────
-- Anyone can read price history (charts).

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'price_history_select_public' AND tablename = 'price_history') THEN
    CREATE POLICY price_history_select_public ON price_history FOR SELECT USING (true);
  END IF;
END $$;


-- ─── 15. activity_log ─────────────────────────────────────────────────────
-- Anyone can read the activity log (public feed).

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'activity_log_select_public' AND tablename = 'activity_log') THEN
    CREATE POLICY activity_log_select_public ON activity_log FOR SELECT USING (true);
  END IF;
END $$;


-- ─── 16. sport_data ───────────────────────────────────────────────────────
-- Anyone can read sport data.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sport_data_select_public' AND tablename = 'sport_data') THEN
    CREATE POLICY sport_data_select_public ON sport_data FOR SELECT USING (true);
  END IF;
END $$;


-- ─── 17. crypto_data ──────────────────────────────────────────────────────
-- Anyone can read crypto data.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'crypto_data_select_public' AND tablename = 'crypto_data') THEN
    CREATE POLICY crypto_data_select_public ON crypto_data FOR SELECT USING (true);
  END IF;
END $$;


-- ============================================================================
-- NOTE: The service_role key automatically bypasses RLS in Supabase.
-- SECURITY DEFINER functions also bypass RLS since they run as the
-- function owner (typically the superuser / postgres role).
-- No additional policy is needed for those paths.
-- ============================================================================
