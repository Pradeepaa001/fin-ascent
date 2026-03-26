-- Run in Supabase SQL Editor (optional but recommended)
-- 1) Dedupe so users do not get duplicate emails the same day
-- 2) Optional override if Auth admin API is not available from your backend

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS notification_email TEXT;

CREATE TABLE IF NOT EXISTS email_notification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    notification_type TEXT NOT NULL,
    day_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, notification_type, day_key)
);

COMMENT ON TABLE email_notification_log IS 'One row per user per notification type per calendar day (UTC day_key).';
