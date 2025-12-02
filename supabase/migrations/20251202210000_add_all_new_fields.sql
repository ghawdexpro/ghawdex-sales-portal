-- Add grant and proposal fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS grant_type TEXT DEFAULT 'pv_only';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS grant_amount NUMERIC DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS proposal_file_url TEXT;

-- Add equipment detail fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS panel_brand TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS panel_model TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS panel_count INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS panel_wattage INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS inverter_brand TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS inverter_model TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS battery_brand TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS battery_model TEXT;

-- Create proposals storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('proposals', 'proposals', true)
ON CONFLICT (id) DO NOTHING;
