-- ============================================
-- ZapNest Referral System Schema
-- Run this in Supabase SQL Editor after members_schema.sql
-- ============================================

-- Add referral_credit column to subscribers if not exists
ALTER TABLE subscribers 
ADD COLUMN IF NOT EXISTS referral_credit INTEGER DEFAULT 0;

-- Referral codes table
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscriber_id UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL UNIQUE,
    uses INTEGER DEFAULT 0,
    max_uses INTEGER DEFAULT 10,
    credit_per_use INTEGER DEFAULT 200,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referral usage tracking
CREATE TABLE IF NOT EXISTS referral_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
    referee_id UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
    discount_applied INTEGER DEFAULT 200,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast code lookups
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(code);
CREATE INDEX IF NOT EXISTS idx_referrals_subscriber ON referrals(subscriber_id);

-- ============================================
-- Row Level Security
-- ============================================

-- Enable RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_usage ENABLE ROW LEVEL SECURITY;

-- Referrals: Users can view their own code, anyone can validate codes
CREATE POLICY "Users can view own referral"
    ON referrals FOR SELECT
    USING (true);  -- Allow reading all (needed for code validation)

CREATE POLICY "System can insert referrals"
    ON referrals FOR INSERT
    WITH CHECK (true);

CREATE POLICY "System can update referrals"
    ON referrals FOR UPDATE
    USING (true);

-- Referral usage: Users can view their own usage
CREATE POLICY "Users can view own referral usage"
    ON referral_usage FOR SELECT
    USING (true);

CREATE POLICY "System can insert referral usage"
    ON referral_usage FOR INSERT
    WITH CHECK (true);

-- ============================================
-- Trigger to update updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_referral_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS referrals_updated_at ON referrals;
CREATE TRIGGER referrals_updated_at
    BEFORE UPDATE ON referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_referral_timestamp();

-- ============================================
-- Helper function to generate referral code on signup
-- ============================================

CREATE OR REPLACE FUNCTION create_referral_for_subscriber(
    p_subscriber_id UUID,
    p_name VARCHAR
)
RETURNS VARCHAR AS $$
DECLARE
    v_code VARCHAR(20);
    v_clean_name VARCHAR(6);
    v_random_suffix VARCHAR(4);
BEGIN
    -- Clean the name
    v_clean_name := UPPER(REGEXP_REPLACE(COALESCE(p_name, ''), '[^A-Za-z]', '', 'g'));
    v_clean_name := SUBSTRING(v_clean_name FROM 1 FOR 6);
    
    -- Generate random suffix
    v_random_suffix := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
    
    -- Create code
    IF LENGTH(v_clean_name) >= 2 THEN
        v_code := 'FOUNDER-' || v_clean_name;
    ELSE
        v_code := 'FOUNDER-' || v_random_suffix;
    END IF;
    
    -- Insert referral record
    INSERT INTO referrals (subscriber_id, code)
    VALUES (p_subscriber_id, v_code)
    ON CONFLICT (code) DO UPDATE SET code = v_code || v_random_suffix;
    
    RETURN v_code;
END;
$$ LANGUAGE plpgsql;
