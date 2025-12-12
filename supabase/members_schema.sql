-- ============================================
-- ZapNest Members Schema
-- Tables for subscribers, orders, and tracking
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- SUBSCRIBERS TABLE (Paid Members)
-- ============================================
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  email_hash TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('lite', 'core', 'elite')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  
  -- Razorpay integration
  razorpay_customer_id TEXT,
  razorpay_subscription_id TEXT,
  
  -- Pricing (locked at signup for founders)
  monthly_price INTEGER NOT NULL,
  is_founder BOOLEAN DEFAULT false,
  
  -- Dates
  created_at TIMESTAMPTZ DEFAULT now(),
  next_billing_date TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Referral
  referral_code TEXT UNIQUE,
  referred_by TEXT
);

-- ============================================
-- ORDERS TABLE (Monthly Shipments)
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
  
  -- Order details
  order_number TEXT UNIQUE,
  month TEXT NOT NULL, -- e.g., "january_2025"
  tier TEXT NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'packed', 'shipped', 'delivered', 'returned'
  )),
  
  -- Shipping
  shipping_address JSONB,
  tracking_number TEXT,
  courier TEXT, -- e.g., "shiprocket", "delhivery"
  
  -- Dates
  created_at TIMESTAMPTZ DEFAULT now(),
  packed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
  
  -- Razorpay details
  razorpay_payment_id TEXT UNIQUE,
  razorpay_order_id TEXT,
  razorpay_signature TEXT,
  
  -- Amount
  amount INTEGER NOT NULL, -- in paise
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  
  -- Metadata
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- MEMBER SESSIONS (Magic Link Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS member_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status);
CREATE INDEX IF NOT EXISTS idx_orders_subscriber ON orders(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_month ON orders(month);
CREATE INDEX IF NOT EXISTS idx_payments_subscriber ON payments(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_member_sessions_token ON member_sessions(token);
CREATE INDEX IF NOT EXISTS idx_member_sessions_email ON member_sessions(email);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Subscribers: Members can only read their own data
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own subscription" ON subscribers
  FOR SELECT TO authenticated
  USING (auth.email() = email);

CREATE POLICY "Service role full access to subscribers" ON subscribers
  FOR ALL TO service_role
  USING (true);

-- Orders: Members can only read their own orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own orders" ON orders
  FOR SELECT TO authenticated
  USING (subscriber_id IN (SELECT id FROM subscribers WHERE email = auth.email()));

CREATE POLICY "Service role full access to orders" ON orders
  FOR ALL TO service_role
  USING (true);

-- Payments: Members can view own payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own payments" ON payments
  FOR SELECT TO authenticated
  USING (subscriber_id IN (SELECT id FROM subscribers WHERE email = auth.email()));

CREATE POLICY "Service role full access to payments" ON payments
  FOR ALL TO service_role
  USING (true);

-- Sessions: Public can insert (for magic link), and can validate their own token
ALTER TABLE member_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create session" ON member_sessions
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can read sessions for validation" ON member_sessions
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "Anyone can mark session as used" ON member_sessions
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to sessions" ON member_sessions
  FOR ALL TO service_role
  USING (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'ZN-' || TO_CHAR(now(), 'YYMM') || '-' || LPAD(nextval('order_number_seq')::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Generate magic link token
CREATE OR REPLACE FUNCTION generate_session_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS FOR ADMIN DASHBOARD
-- ============================================

-- Subscriber stats
CREATE OR REPLACE VIEW subscriber_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'active') as active_count,
  COUNT(*) FILTER (WHERE status = 'paused') as paused_count,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
  COUNT(*) FILTER (WHERE is_founder = true) as founder_count,
  SUM(monthly_price) FILTER (WHERE status = 'active') as monthly_revenue,
  COUNT(*) FILTER (WHERE tier = 'lite' AND status = 'active') as lite_count,
  COUNT(*) FILTER (WHERE tier = 'core' AND status = 'active') as core_count,
  COUNT(*) FILTER (WHERE tier = 'elite' AND status = 'active') as elite_count
FROM subscribers;

-- Monthly orders
CREATE OR REPLACE VIEW monthly_orders AS
SELECT
  month,
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'shipped') as shipped,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered
FROM orders
GROUP BY month
ORDER BY month DESC;
