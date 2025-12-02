-- Add grant_type and grant_amount columns to leads table
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS grant_type TEXT DEFAULT 'pv_only',
ADD COLUMN IF NOT EXISTS grant_amount NUMERIC DEFAULT 0;

-- Add proposal_file_url column to leads table
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS proposal_file_url TEXT;

-- Create proposals storage bucket for PDF uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('proposals', 'proposals', true)
ON CONFLICT (id) DO NOTHING;

-- Comment explaining the new fields
COMMENT ON COLUMN leads.grant_type IS 'Grant type: none, pv_only, pv_battery, battery_only';
COMMENT ON COLUMN leads.grant_amount IS 'Calculated grant amount in EUR';
COMMENT ON COLUMN leads.proposal_file_url IS 'URL to uploaded proposal PDF in Supabase storage';
