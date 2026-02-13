-- ============================================================
-- 008_daily_login_rewards.sql
-- Daily Login Token Rewards — one reward per user per day
-- ============================================================

CREATE TABLE IF NOT EXISTS public.daily_login_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reward_date DATE NOT NULL DEFAULT CURRENT_DATE,
  tokens_awarded INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_daily_login UNIQUE (user_id, reward_date)
);

ALTER TABLE public.daily_login_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_login_rewards_select_owner" ON public.daily_login_rewards;
CREATE POLICY "daily_login_rewards_select_owner"
  ON public.daily_login_rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_daily_login_rewards_user_date
  ON public.daily_login_rewards(user_id, reward_date);

-- RPC: claim_daily_login_reward
-- Atomically inserts a reward row (unique per user+date),
-- adds tokens to user_tokens, and records a transaction.
-- Returns FALSE if already claimed today (unique_violation).
CREATE OR REPLACE FUNCTION public.claim_daily_login_reward(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Will throw unique_violation if already claimed today
  INSERT INTO daily_login_rewards (user_id, reward_date, tokens_awarded)
  VALUES (user_id_param, CURRENT_DATE, 10);

  -- Add tokens to wallet
  PERFORM add_user_tokens(user_id_param, 10);

  -- Record transaction in audit log
  INSERT INTO token_transactions (to_user_id, amount, type, description, created_at)
  VALUES (user_id_param, 10, 'earned', 'Daily login reward', NOW());

  RETURN TRUE;
EXCEPTION
  WHEN unique_violation THEN
    -- Already claimed today
    RETURN FALSE;
END;
$$;
