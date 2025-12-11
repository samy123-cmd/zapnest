-- ============================================
-- NUCLEAR OPTION: Disable RLS Completely
-- Run this in Supabase SQL Editor to test
-- ============================================

-- Option 1: Completely disable RLS on waitlist table
ALTER TABLE public.waitlist DISABLE ROW LEVEL SECURITY;

-- Grant ALL permissions to anon
GRANT ALL ON public.waitlist TO anon;
GRANT ALL ON public.referral_codes TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Verify RLS is disabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'waitlist';
