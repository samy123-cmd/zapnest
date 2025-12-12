-- ============================================
-- ZapNest Payments Schema - SIMPLE VERSION
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  amount_inr INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  tier TEXT NOT NULL,
  status TEXT DEFAULT 'created',
  error_code TEXT,
  error_description TEXT,
  refund_id TEXT,
  refund_amount INTEGER,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  captured_at TIMESTAMPTZ,
  raw_payload JSONB
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_email ON payments(email);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);

-- Step 3: Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies
DROP POLICY IF EXISTS "Service role payments access" ON payments;
CREATE POLICY "Service role payments access" ON payments
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow payment insert" ON payments;
CREATE POLICY "Allow payment insert" ON payments
  FOR INSERT TO anon
  WITH CHECK (true);

-- Step 5: Create subscribers table if not exists
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  tier TEXT DEFAULT 'core',
  status TEXT DEFAULT 'active',
  razorpay_subscription_id TEXT,
  monthly_price INTEGER DEFAULT 2999,
  is_founder BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  next_billing_date TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  referral_code TEXT
);

-- Step 6: Subscribers RLS
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role subscribers access" ON subscribers;
CREATE POLICY "Service role subscribers access" ON subscribers
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow subscriber insert" ON subscribers;
CREATE POLICY "Allow subscriber insert" ON subscribers
  FOR INSERT TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow subscriber update" ON subscribers;
CREATE POLICY "Allow subscriber update" ON subscribers
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

-- Done! Verify with:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'payments';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'subscribers';
