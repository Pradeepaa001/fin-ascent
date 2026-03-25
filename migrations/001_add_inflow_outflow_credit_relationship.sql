-- Run in Supabase SQL Editor after your base schema exists.
-- Additive only: new columns + backfill for existing rows.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS average_inflow NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS average_outflow NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS credit_score INTEGER,
  ADD COLUMN IF NOT EXISTS relationship_impact NUMERIC(10, 4) DEFAULT 0.1;

-- Random plausible defaults where missing (existing users)
UPDATE user_profiles
SET
  average_inflow = COALESCE(
    average_inflow,
    ROUND((random() * 12000 + 3000)::numeric, 2)
  ),
  average_outflow = COALESCE(
    average_outflow,
    ROUND((random() * 9000 + 2500)::numeric, 2)
  )
WHERE average_inflow IS NULL OR average_outflow IS NULL;

-- Avoid divide-by-zero in zero-day
UPDATE user_profiles
SET average_outflow = GREATEST(COALESCE(average_outflow, 0), 1)
WHERE average_outflow IS NULL OR average_outflow <= 0;

COMMENT ON COLUMN user_profiles.average_inflow IS 'Typical cash inflow per period (same unit as liquidity)';
COMMENT ON COLUMN user_profiles.average_outflow IS 'Typical cash outflow per period';
COMMENT ON COLUMN user_profiles.credit_score IS 'Financial health score 1-100, derived from receivables+balance-payables';
COMMENT ON COLUMN user_profiles.relationship_impact IS 'User-tunable relationship term in priority engine (default 0.1)';
