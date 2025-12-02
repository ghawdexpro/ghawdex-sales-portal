-- =============================================================================
-- MIGRATION: Bill Upload + Wizard Session Tracking
-- =============================================================================
-- Run this entire file in Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/lccebuetwhezxpviyfrs/sql/new
-- =============================================================================

-- STAGE 1.1: Create wizard_sessions table
CREATE TABLE IF NOT EXISTS wizard_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  session_token UUID DEFAULT gen_random_uuid() UNIQUE,
  status TEXT DEFAULT 'in_progress' CHECK (status IN (
    'in_progress', 'abandoned', 'completed', 'converted_to_lead'
  )),
  current_step INTEGER DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 6),
  highest_step_reached INTEGER DEFAULT 1 CHECK (highest_step_reached >= 1 AND highest_step_reached <= 6),
  address TEXT,
  coordinates JSONB,
  location TEXT CHECK (location IN ('malta', 'gozo') OR location IS NULL),
  roof_area NUMERIC,
  max_panels INTEGER,
  annual_sunshine NUMERIC,
  solar_potential JSONB,
  solar_data_is_fallback BOOLEAN DEFAULT false,
  household_size INTEGER,
  monthly_bill NUMERIC,
  consumption_kwh NUMERIC,
  selected_system TEXT,
  system_size_kw NUMERIC,
  with_battery BOOLEAN DEFAULT false,
  battery_size_kwh NUMERIC,
  grant_type TEXT CHECK (grant_type IN ('none', 'pv_only', 'pv_battery', 'battery_only') OR grant_type IS NULL),
  payment_method TEXT CHECK (payment_method IN ('cash', 'loan') OR payment_method IS NULL),
  loan_term INTEGER,
  total_price NUMERIC,
  monthly_payment NUMERIC,
  annual_savings NUMERIC,
  payback_years NUMERIC,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  zoho_lead_id VARCHAR(50),
  is_prefilled_lead BOOLEAN DEFAULT false,
  social_provider TEXT CHECK (social_provider IN ('google', 'facebook') OR social_provider IS NULL),
  converted_lead_id UUID REFERENCES leads(id),
  device_info JSONB,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  step_timestamps JSONB DEFAULT '{}'::jsonb,
  total_duration_seconds INTEGER DEFAULT 0
);

-- STAGE 1.2: Create indexes
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_token ON wizard_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_status ON wizard_sessions(status);
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_active_activity ON wizard_sessions(last_activity_at) WHERE status = 'in_progress';
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_step_status ON wizard_sessions(highest_step_reached, status);
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_created_at ON wizard_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_email ON wizard_sessions(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_zoho ON wizard_sessions(zoho_lead_id) WHERE zoho_lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_converted_lead ON wizard_sessions(converted_lead_id) WHERE converted_lead_id IS NOT NULL;

-- STAGE 1.3: Enable RLS and create policies
ALTER TABLE wizard_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert" ON wizard_sessions
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow reading sessions" ON wizard_sessions
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow updating sessions" ON wizard_sessions
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- STAGE 1.4: Create trigger function
CREATE OR REPLACE FUNCTION update_wizard_session_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_activity_at = NOW();
  IF NEW.current_step > COALESCE(OLD.highest_step_reached, 0) THEN
    NEW.highest_step_reached = NEW.current_step;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_wizard_sessions_timestamps ON wizard_sessions;
CREATE TRIGGER trigger_wizard_sessions_timestamps
  BEFORE UPDATE ON wizard_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_wizard_session_timestamps();

-- STAGE 1.5: Create analytics functions
CREATE OR REPLACE FUNCTION get_wizard_session_stats()
RETURNS TABLE (
  total_sessions BIGINT,
  in_progress BIGINT,
  abandoned BIGINT,
  completed BIGINT,
  converted_to_lead BIGINT,
  conversion_rate NUMERIC,
  avg_highest_step NUMERIC,
  sessions_today BIGINT,
  sessions_this_week BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_sessions,
    COUNT(*) FILTER (WHERE ws.status = 'in_progress')::BIGINT as in_progress,
    COUNT(*) FILTER (WHERE ws.status = 'abandoned')::BIGINT as abandoned,
    COUNT(*) FILTER (WHERE ws.status = 'completed')::BIGINT as completed,
    COUNT(*) FILTER (WHERE ws.status = 'converted_to_lead')::BIGINT as converted_to_lead,
    ROUND((COUNT(*) FILTER (WHERE ws.status = 'converted_to_lead')::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2) as conversion_rate,
    ROUND(AVG(ws.highest_step_reached)::NUMERIC, 2) as avg_highest_step,
    COUNT(*) FILTER (WHERE ws.created_at >= CURRENT_DATE)::BIGINT as sessions_today,
    COUNT(*) FILTER (WHERE ws.created_at >= CURRENT_DATE - INTERVAL '7 days')::BIGINT as sessions_this_week
  FROM wizard_sessions ws;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mark_abandoned_wizard_sessions(minutes_threshold INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE wizard_sessions
  SET status = 'abandoned'
  WHERE status = 'in_progress'
    AND last_activity_at < NOW() - (minutes_threshold || ' minutes')::INTERVAL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- STAGE 2: Add columns to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS bill_file_url TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS social_provider TEXT;

-- =============================================================================
-- DONE! Verify by running:
-- SELECT * FROM wizard_sessions LIMIT 1;
-- SELECT bill_file_url, social_provider FROM leads LIMIT 1;
-- =============================================================================
