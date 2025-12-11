-- ============================================
-- ZapNest Waitlist Database Schema
-- Supabase PostgreSQL
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- WAITLIST TABLE
-- Stores founder waitlist signups
-- ============================================
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  email_hash TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('lite', 'core', 'elite')),
  referral_code TEXT,
  referred_by UUID REFERENCES waitlist(id),
  consent BOOLEAN NOT NULL DEFAULT false,
  source TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_tier ON waitlist(tier);
CREATE INDEX IF NOT EXISTS idx_waitlist_referral ON waitlist(referral_code);
CREATE INDEX IF NOT EXISTS idx_waitlist_created ON waitlist(created_at DESC);

-- ============================================
-- REFERRAL CODES TABLE
-- Unique codes for referral tracking
-- ============================================
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES waitlist(id) ON DELETE CASCADE,
  uses INT NOT NULL DEFAULT 0,
  max_uses INT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_code ON referral_codes(code);

-- ============================================
-- ANALYTICS EVENTS TABLE
-- Privacy-first analytics (no PII)
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  session_id TEXT,
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Restrictive by default
-- ============================================

-- Enable RLS on all tables
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Waitlist: Allow insert from anon (signup)
CREATE POLICY "Allow public signup" ON waitlist
  FOR INSERT TO anon
  WITH CHECK (consent = true);

-- Waitlist: Only service role can read
CREATE POLICY "Service role full access" ON waitlist
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Referral codes: Public can verify codes exist
CREATE POLICY "Public can check referral codes" ON referral_codes
  FOR SELECT TO anon
  USING (true);

-- Analytics: Allow insert from anon
CREATE POLICY "Allow public analytics" ON analytics_events
  FOR INSERT TO anon
  WITH CHECK (true);

-- Analytics: Only service role can read
CREATE POLICY "Service role analytics access" ON analytics_events
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(length INT DEFAULT 8)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to create referral code after signup
CREATE OR REPLACE FUNCTION create_referral_code_for_signup()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
BEGIN
  -- Generate unique code
  LOOP
    new_code := generate_referral_code(8);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM referral_codes WHERE code = new_code);
  END LOOP;
  
  -- Insert referral code
  INSERT INTO referral_codes (code, owner_id)
  VALUES (new_code, NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create referral code
CREATE TRIGGER on_waitlist_signup
  AFTER INSERT ON waitlist
  FOR EACH ROW
  EXECUTE FUNCTION create_referral_code_for_signup();

-- Function to increment referral uses
CREATE OR REPLACE FUNCTION increment_referral_uses(ref_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE referral_codes
  SET uses = uses + 1
  WHERE code = ref_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VIEWS (for admin dashboard)
-- ============================================

-- Waitlist stats view
CREATE OR REPLACE VIEW waitlist_stats AS
SELECT
  COUNT(*) as total_signups,
  COUNT(*) FILTER (WHERE tier = 'lite') as tier_lite,
  COUNT(*) FILTER (WHERE tier = 'core') as tier_core,
  COUNT(*) FILTER (WHERE tier = 'elite') as tier_elite,
  COUNT(*) FILTER (WHERE referral_code IS NOT NULL) as with_referral,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as last_7d
FROM waitlist;

-- Daily signups view
CREATE OR REPLACE VIEW daily_signups AS
SELECT
  DATE(created_at) as signup_date,
  COUNT(*) as signups,
  COUNT(*) FILTER (WHERE tier = 'lite') as tier_lite,
  COUNT(*) FILTER (WHERE tier = 'core') as tier_core,
  COUNT(*) FILTER (WHERE tier = 'elite') as tier_elite
FROM waitlist
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY signup_date DESC;
