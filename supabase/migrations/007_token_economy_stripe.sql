-- ============================================================
-- 007_token_economy_stripe.sql
-- Stripe + Token Wallet Architecture
-- Creates prerequisite tables if missing, then extends schema
-- ============================================================

-- ============================================================
-- 0. Prerequisite tables (were in schema_only.sql but never migrated)
-- ============================================================

-- user_tokens wallet table
CREATE TABLE IF NOT EXISTS public.user_tokens (
  user_id UUID NOT NULL PRIMARY KEY,
  balance INTEGER DEFAULT 100,
  total_earned INTEGER DEFAULT 100,
  total_spent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT user_tokens_balance_check CHECK (balance >= 0),
  CONSTRAINT user_tokens_total_earned_check CHECK (total_earned >= 0),
  CONSTRAINT user_tokens_total_spent_check CHECK (total_spent >= 0)
);

ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;

-- token_transactions audit log
CREATE TABLE IF NOT EXISTS public.token_transactions (
  id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  from_user_id UUID,
  to_user_id UUID,
  amount INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL,
  description TEXT,
  post_id UUID,
  comment_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT token_transactions_amount_check CHECK (amount > 0),
  CONSTRAINT token_transactions_type_check CHECK (type::text = ANY(ARRAY[
    'earned','spent','transfer','admin_award','referral',
    'referral_signup','purchased','spend','refund','bonus'
  ]::text[]))
);

-- spend_user_tokens_with_transaction RPC (uses user_tokens only)
CREATE OR REPLACE FUNCTION public.spend_user_tokens_with_transaction(
  user_id_param UUID,
  amount_param INTEGER,
  transaction_type_param TEXT DEFAULT 'spend',
  description_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  SELECT balance INTO current_balance FROM user_tokens WHERE user_id = user_id_param FOR UPDATE;
  IF current_balance IS NULL OR current_balance < amount_param THEN
    RETURN FALSE;
  END IF;

  UPDATE user_tokens SET balance = balance - amount_param,
    total_spent = total_spent + amount_param, updated_at = NOW()
  WHERE user_id = user_id_param;

  INSERT INTO token_transactions (to_user_id, amount, type, description, created_at)
  VALUES (user_id_param, amount_param, transaction_type_param, description_param, NOW());

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN RETURN FALSE;
END;
$$;

-- add_user_tokens RPC (uses user_tokens only)
CREATE OR REPLACE FUNCTION public.add_user_tokens(
  user_id_param UUID,
  amount_param INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_tokens (user_id, balance, total_earned, total_spent, created_at, updated_at)
  VALUES (user_id_param, amount_param, amount_param, 0, NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET balance = user_tokens.balance + amount_param,
      total_earned = user_tokens.total_earned + amount_param,
      updated_at = NOW();

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN RETURN FALSE;
END;
$$;

-- ============================================================
-- 1. Extend token_transactions with Stripe metadata
-- ============================================================

ALTER TABLE public.token_transactions
  ADD COLUMN IF NOT EXISTS reference_type VARCHAR(30),
  ADD COLUMN IF NOT EXISTS reference_id UUID,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;

-- Update the type constraint to include new types (drop + re-add is idempotent)
ALTER TABLE public.token_transactions
  DROP CONSTRAINT IF EXISTS token_transactions_type_check;

ALTER TABLE public.token_transactions
  ADD CONSTRAINT token_transactions_type_check
  CHECK (type::text = ANY(ARRAY[
    'earned','spent','transfer','admin_award','referral',
    'referral_signup','purchased','spend','refund','bonus'
  ]::text[]));

-- ============================================================
-- 2. Token Packages table (replaces hardcoded array)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.token_packages (
  id VARCHAR(30) PRIMARY KEY,
  tokens INTEGER NOT NULL CHECK (tokens > 0),
  bonus_tokens INTEGER NOT NULL DEFAULT 0 CHECK (bonus_tokens >= 0),
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  stripe_price_id TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.token_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "token_packages_select_active" ON public.token_packages;
CREATE POLICY "token_packages_select_active"
  ON public.token_packages FOR SELECT
  USING (is_active = true);

INSERT INTO public.token_packages (id, tokens, bonus_tokens, price_cents, display_order) VALUES
  ('basic',    100,   0,  499,  1),
  ('standard', 250,  25,  999,  2),
  ('premium',  500,  75, 1999,  3),
  ('ultimate', 1000, 200, 3499, 4)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. Video Purchases table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.video_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  tokens_spent INTEGER NOT NULL CHECK (tokens_spent >= 0),
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_video_purchase UNIQUE (user_id, video_id)
);

ALTER TABLE public.video_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "video_purchases_select_owner" ON public.video_purchases;
CREATE POLICY "video_purchases_select_owner"
  ON public.video_purchases FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- 4. Stripe Webhook Events (idempotency ledger)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  payload JSONB
);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. Lock down user_tokens RLS (read-only for owners)
-- ============================================================

DO $$
DECLARE
  pol_name TEXT;
BEGIN
  FOR pol_name IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'user_tokens' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_tokens', pol_name);
  END LOOP;
END $$;

CREATE POLICY "user_tokens_select_owner"
  ON public.user_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- 6. Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_token_transactions_stripe_pi
  ON public.token_transactions(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_token_transactions_stripe_cs
  ON public.token_transactions(stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_token_transactions_ref
  ON public.token_transactions(reference_type, reference_id)
  WHERE reference_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_video_purchases_user
  ON public.video_purchases(user_id);

CREATE INDEX IF NOT EXISTS idx_video_purchases_video
  ON public.video_purchases(video_id);

CREATE INDEX IF NOT EXISTS idx_token_packages_active
  ON public.token_packages(is_active, display_order);

-- ============================================================
-- 7. RPC: purchase_tokens_from_stripe
-- ============================================================

CREATE OR REPLACE FUNCTION public.purchase_tokens_from_stripe(
  p_user_id UUID,
  p_amount INTEGER,
  p_stripe_pi TEXT,
  p_stripe_cs TEXT,
  p_package_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing INTEGER;
BEGIN
  IF p_stripe_cs IS NOT NULL THEN
    SELECT 1 INTO v_existing
    FROM token_transactions
    WHERE stripe_checkout_session_id = p_stripe_cs AND type = 'purchased'
    LIMIT 1;
    IF v_existing IS NOT NULL THEN RETURN TRUE; END IF;
  END IF;

  -- Use user_tokens only (upsert in case wallet row doesn't exist yet)
  INSERT INTO user_tokens (user_id, balance, total_earned, total_spent, created_at, updated_at)
  VALUES (p_user_id, p_amount, p_amount, 0, NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET balance = user_tokens.balance + p_amount,
      total_earned = user_tokens.total_earned + p_amount,
      updated_at = NOW();

  INSERT INTO token_transactions (
    to_user_id, amount, type, description,
    reference_type, stripe_payment_intent_id, stripe_checkout_session_id, created_at
  ) VALUES (
    p_user_id, p_amount, 'purchased',
    'Purchased ' || p_amount || ' tokens via Stripe' ||
      CASE WHEN p_package_id IS NOT NULL THEN ' (package: ' || p_package_id || ')' ELSE '' END,
    'stripe_payment', p_stripe_pi, p_stripe_cs, NOW()
  );

  RETURN TRUE;
END;
$$;

-- ============================================================
-- 8. RPC: spend_tokens_for_video
-- ============================================================

CREATE OR REPLACE FUNCTION public.spend_tokens_for_video(
  p_user_id UUID,
  p_video_id UUID,
  p_cost INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance INTEGER;
  v_purchase_id UUID;
BEGIN
  SELECT id INTO v_purchase_id FROM video_purchases
  WHERE user_id = p_user_id AND video_id = p_video_id;
  IF v_purchase_id IS NOT NULL THEN RETURN TRUE; END IF;

  SELECT balance INTO v_balance FROM user_tokens WHERE user_id = p_user_id FOR UPDATE;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;
  IF v_balance < p_cost THEN RETURN FALSE; END IF;

  UPDATE user_tokens SET balance = balance - p_cost,
    total_spent = total_spent + p_cost, updated_at = NOW() WHERE user_id = p_user_id;

  INSERT INTO video_purchases (user_id, video_id, tokens_spent, purchased_at)
  VALUES (p_user_id, p_video_id, p_cost, NOW());

  INSERT INTO token_transactions (
    from_user_id, amount, type, description, reference_type, reference_id, created_at
  ) VALUES (p_user_id, p_cost, 'spend', 'Unlocked premium video', 'video', p_video_id, NOW());

  RETURN TRUE;
END;
$$;

-- ============================================================
-- 9. RPC: refund_stripe_tokens
-- ============================================================

CREATE OR REPLACE FUNCTION public.refund_stripe_tokens(
  p_user_id UUID,
  p_amount INTEGER,
  p_stripe_pi TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance INTEGER;
  v_deducted INTEGER;
  v_went_negative BOOLEAN := FALSE;
BEGIN
  SELECT balance INTO v_balance FROM user_tokens WHERE user_id = p_user_id FOR UPDATE;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;

  IF v_balance >= p_amount THEN v_deducted := p_amount;
  ELSE v_deducted := v_balance; v_went_negative := TRUE; END IF;

  UPDATE user_tokens SET balance = GREATEST(balance - p_amount, 0), updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO token_transactions (
    from_user_id, amount, type, description, reference_type, stripe_payment_intent_id, created_at
  ) VALUES (p_user_id, p_amount, 'refund', 'Stripe refund processed', 'stripe_payment', p_stripe_pi, NOW());

  RETURN jsonb_build_object(
    'deducted', v_deducted, 'went_negative', v_went_negative,
    'remaining_balance', GREATEST(v_balance - p_amount, 0)
  );
END;
$$;

-- ============================================================
-- Done!
-- ============================================================
