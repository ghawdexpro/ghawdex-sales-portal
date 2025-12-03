-- Migration: Add columns needed for Backoffice zoho-sync compatibility
-- Target: epxeimwsheyttevwtjku (ghawdexpro's Project)

-- Core backoffice columns
ALTER TABLE leads ADD COLUMN IF NOT EXISTS locality TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_type TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS meter_number TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS arms_account_number TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS average_monthly_bill NUMERIC;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS current_step INTEGER DEFAULT 1;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_gozo BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS google_maps_url TEXT;

-- Remove source check constraint to allow different sources
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_source_check;

-- Create sync_metadata table for tracking sync history
CREATE TABLE IF NOT EXISTS sync_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL,
  last_sync_at TIMESTAMPTZ NOT NULL,
  records_pushed INTEGER DEFAULT 0,
  records_pulled INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for sync_metadata
ALTER TABLE sync_metadata ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on sync_metadata" ON sync_metadata;
CREATE POLICY "Allow all on sync_metadata" ON sync_metadata FOR ALL USING (true);

-- Index for faster sync queries
CREATE INDEX IF NOT EXISTS idx_sync_metadata_type_created ON sync_metadata(sync_type, created_at DESC);

-- Index for Zoho sync lookups
CREATE INDEX IF NOT EXISTS idx_leads_zoho_lead_id ON leads(zoho_lead_id) WHERE zoho_lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
