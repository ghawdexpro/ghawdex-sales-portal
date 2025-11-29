-- Create leads table for GhawdeX Sales Portal
-- Schema matches the API field names exactly

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contact info
  name TEXT,
  email TEXT,
  phone TEXT,

  -- Location
  address TEXT,
  coordinates JSONB,

  -- Consumption
  household_size INTEGER,
  monthly_bill NUMERIC,
  consumption_kwh NUMERIC,
  roof_area NUMERIC,

  -- System selection
  selected_system TEXT,
  system_size_kw NUMERIC,
  with_battery BOOLEAN DEFAULT false,
  battery_size_kwh NUMERIC,
  grant_path BOOLEAN DEFAULT true,

  -- Financing
  payment_method TEXT,
  loan_term INTEGER,

  -- Calculated values
  total_price NUMERIC,
  monthly_payment NUMERIC,
  annual_savings NUMERIC,

  -- Notes and metadata
  notes TEXT,
  zoho_lead_id VARCHAR(50),
  status TEXT DEFAULT 'new',
  source TEXT DEFAULT 'sales-portal'
);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for the wizard to create leads)
CREATE POLICY "Allow anonymous inserts" ON leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous selects (for reading back created leads)
CREATE POLICY "Allow anonymous selects" ON leads
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous updates (for updating leads)
CREATE POLICY "Allow anonymous updates" ON leads
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create index on zoho_lead_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_leads_zoho_lead_id ON leads(zoho_lead_id);

-- Create index on email for duplicate detection
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- Create index on created_at for recent leads queries
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
