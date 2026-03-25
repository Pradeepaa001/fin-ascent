-- Runway: current_balance / avg_cash_inflow (API defaults missing inflow to 50,000).

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS current_balance NUMERIC(15, 2);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avg_cash_inflow NUMERIC(15, 2);

UPDATE user_profiles
SET current_balance = current_liquidity
WHERE current_balance IS NULL AND current_liquidity IS NOT NULL;

UPDATE user_profiles
SET avg_cash_inflow = NULLIF(average_inflow, 0)
WHERE avg_cash_inflow IS NULL AND NULLIF(average_inflow, 0) IS NOT NULL;
