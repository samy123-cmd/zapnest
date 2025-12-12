-- ============================================
-- ZapNest Payments Schema
-- Tables for payment processing and tracking
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- PAYMENTS TABLE
-- Records all payment attempts and outcomes
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  
  -- Razorpay identifiers
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  
  -- Payment details
  amount_inr INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  tier TEXT NOT NULL CHECK (tier IN ('lite', 'core', 'elite', 'pro')),
  status TEXT DEFAULT 'created' CHECK (status IN (
    'created', 'authorized', 'captured', 'failed', 
    'refund_pending', 'refunded'
  )),
  
  -- Error tracking
  error_code TEXT,
  error_description TEXT,
  
  -- Refund tracking
  refund_id TEXT,
  refund_amount INTEGER,
  refunded_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  captured_at TIMESTAMPTZ,
  
  -- Raw payload for debugging (optional)
  raw_payload JSONB
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_payments_email ON payments(email);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON payments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);

-- ============================================
-- UPDATE WAITLIST TABLE
-- Add conversion tracking columns
-- ============================================
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS converted_to_subscriber BOOLEAN DEFAULT false;
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;

-- ============================================
-- UPDATE SUBSCRIBERS TABLE
-- Add missing columns if they don't exist
-- ============================================
-- These may fail if columns exist, that's okay

-- Add email_hash if missing
DO $$ 
BEGIN
  ALTER TABLE subscribers ADD COLUMN email_hash TEXT;
EXCEPTION WHEN duplicate_column THEN 
  -- Column already exists, ignore
END $$;

-- ============================================
-- RLS POLICIES FOR PAYMENTS
-- ============================================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Only service role can access payments (for security)
DROP POLICY IF EXISTS "Service role payments access" ON payments;
CREATE POLICY "Service role payments access" ON payments
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow insert from API routes (anon with server-side validation)
DROP POLICY IF EXISTS "Allow payment insert" ON payments;
CREATE POLICY "Allow payment insert" ON payments
  FOR INSERT TO anon
  WITH CHECK (true);

-- ============================================
-- UPDATE SUBSCRIBERS RLS
-- ============================================

-- Allow service role full access to subscribers
DROP POLICY IF EXISTS "Service role subscribers access" ON subscribers;
CREATE POLICY "Service role subscribers access" ON subscribers
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow insert from verify-payment endpoint
DROP POLICY IF EXISTS "Allow subscriber insert" ON subscribers;
CREATE POLICY "Allow subscriber insert" ON subscribers
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow update from verify-payment endpoint
DROP POLICY IF EXISTS "Allow subscriber update" ON subscribers;
CREATE POLICY "Allow subscriber update" ON subscribers
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================
-- VIEWS FOR ADMIN DASHBOARD
-- ============================================

-- Payment stats view
CREATE OR REPLACE VIEW payment_stats AS
SELECT
  COUNT(*) as total_payments,
  COUNT(*) FILTER (WHERE status = 'captured') as successful_payments,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_payments,
  COUNT(*) FILTER (WHERE status = 'refunded') as refunded_payments,
  COALESCE(SUM(amount_inr) FILTER (WHERE status = 'captured'), 0) as total_revenue,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as last_7d
FROM payments;

-- Revenue by tier view
CREATE OR REPLACE VIEW revenue_by_tier AS
SELECT
  tier,
  COUNT(*) as payment_count,
  SUM(amount_inr) as total_revenue,
  AVG(amount_inr) as avg_amount
FROM payments
WHERE status = 'captured'
GROUP BY tier
ORDER BY total_revenue DESC;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these after migration to verify:
-- SELECT * FROM payments LIMIT 5;
-- SELECT * FROM payment_stats;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'payments';
