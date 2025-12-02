-- Migration: Add bill upload and partial leads for social login recovery
-- Date: 2024-12-02

-- 1. Add bill_file_url to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS bill_file_url TEXT;

-- 2. Create partial_leads table for abandoned/incomplete leads
CREATE TABLE IF NOT EXISTS partial_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Customer identification (from social login)
  email TEXT NOT NULL,
  name TEXT,
  social_provider TEXT, -- 'google' or 'facebook'

  -- Progress tracking
  last_step INTEGER DEFAULT 1,
  phone TEXT, -- May be collected later

  -- Wizard state snapshot (for resume)
  wizard_state JSONB,

  -- Reminder tracking
  reminder_count INTEGER DEFAULT 0,
  last_reminder_at TIMESTAMPTZ,
  next_reminder_at TIMESTAMPTZ,

  -- Conversion tracking
  converted_to_lead BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  lead_id UUID REFERENCES leads(id)
);

-- 3. Create bills storage bucket (run in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('bills', 'bills', true);

-- 4. RLS policies for partial_leads
ALTER TABLE partial_leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous insert (for capturing partial leads)
CREATE POLICY "Allow anonymous insert partial_leads" ON partial_leads
  FOR INSERT WITH CHECK (true);

-- Allow anonymous update (for updating progress)
CREATE POLICY "Allow anonymous update partial_leads" ON partial_leads
  FOR UPDATE USING (true);

-- Allow anonymous select (for checking existing partial leads)
CREATE POLICY "Allow anonymous select partial_leads" ON partial_leads
  FOR SELECT USING (true);

-- 5. Index for email lookup (for deduplication and reminder queries)
CREATE INDEX IF NOT EXISTS idx_partial_leads_email ON partial_leads(email);
CREATE INDEX IF NOT EXISTS idx_partial_leads_next_reminder ON partial_leads(next_reminder_at) WHERE NOT converted_to_lead;

-- 6. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_partial_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_partial_leads_updated_at
  BEFORE UPDATE ON partial_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_partial_leads_updated_at();
