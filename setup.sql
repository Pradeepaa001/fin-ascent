-- Execute this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
    name TEXT NOT NULL,
    business_type TEXT CHECK (business_type IN ('small', 'medium', 'large')),
    employees INTEGER,
    revenue_range TEXT,
    industry TEXT,
    current_liquidity NUMERIC(15, 2),
    penalty_weight NUMERIC(3, 2) DEFAULT 1.0,
    relationship_weight NUMERIC(3, 2) DEFAULT 1.0,
    flexibility_weight NUMERIC(3, 2) DEFAULT 1.0,
    priority_entities JSONB DEFAULT '[]'::jsonb,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" 
ON user_profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
ON user_profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON user_profiles FOR UPDATE 
USING (auth.uid() = user_id);
