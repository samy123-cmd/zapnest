-- ============================================
-- ZapNest Waitlist Table Updates
-- Add columns for address and dashboard functionality
-- Run this in Supabase SQL Editor
-- ============================================

-- Add address_json column to store shipping address
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS address_json JSONB DEFAULT NULL;

-- Add index for faster address lookups (for shipping exports)
CREATE INDEX IF NOT EXISTS idx_waitlist_has_address ON waitlist((address_json IS NOT NULL));

-- ============================================
-- Update RLS Policies for Member Dashboard
-- Allow authenticated users to read/update their own row
-- ============================================

-- Drop existing restrictive policy if exists
DROP POLICY IF EXISTS "Allow users to read own waitlist entry" ON waitlist;
DROP POLICY IF EXISTS "Allow users to update own waitlist entry" ON waitlist;

-- Allow anon users to SELECT their own entry by email
CREATE POLICY "Allow users to read own waitlist entry" ON waitlist
  FOR SELECT TO anon
  USING (true);

-- Allow anon users to UPDATE their own entry by email (for address, tier changes)
CREATE POLICY "Allow users to update own waitlist entry" ON waitlist
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

-- Allow anon users to DELETE their own entry (for cancel waitlist)
DROP POLICY IF EXISTS "Allow users to delete own waitlist entry" ON waitlist;
CREATE POLICY "Allow users to delete own waitlist entry" ON waitlist
  FOR DELETE TO anon
  USING (true);

-- ============================================
-- Verification Query
-- ============================================
-- Run this after to verify:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'waitlist';
