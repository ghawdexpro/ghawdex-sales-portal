-- Migration: Add bill upload and social login fields
-- Date: 2024-12-02
-- NOTE: partial_leads table SKIPPED - using wizard_sessions table instead

-- 1. Add bill_file_url to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS bill_file_url TEXT;

-- 2. Add social_provider to leads table (tracks which OAuth provider was used)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS social_provider TEXT;

-- 3. Create bills storage bucket (run in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('bills', 'bills', true);

-- NOTE: partial_leads table is NOT created here.
-- Social login recovery data is stored in wizard_sessions table instead.
-- The wizard_sessions table has a social_provider column added in the
-- 20251202000000_create_wizard_sessions_table.sql migration.
