-- ============================================================================
-- Wizard Sessions - Partial Lead Tracking
-- ============================================================================
-- This migration creates the wizard_sessions table for storing incomplete
-- wizard progress. Captures potential leads who abandon before Step 5.
-- ============================================================================

CREATE TABLE IF NOT EXISTS wizard_sessions (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),

  -- Session identification
  session_token UUID DEFAULT gen_random_uuid() UNIQUE,

  -- Session status
  status TEXT DEFAULT 'in_progress' CHECK (status IN (
    'in_progress',      -- User is actively filling wizard
    'abandoned',        -- User left without completing (detected by cron)
    'completed',        -- User reached Step 6 summary
    'converted_to_lead' -- Lead was created in Supabase/Zoho
  )),

  -- Progress tracking
  current_step INTEGER DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 6),
  highest_step_reached INTEGER DEFAULT 1 CHECK (highest_step_reached >= 1 AND highest_step_reached <= 6),

  -- Step 1: Location data
  address TEXT,
  coordinates JSONB,
  location TEXT CHECK (location IN ('malta', 'gozo') OR location IS NULL),

  -- Step 1→2: Solar analysis data
  roof_area NUMERIC,
  max_panels INTEGER,
  annual_sunshine NUMERIC,
  solar_potential JSONB,
  solar_data_is_fallback BOOLEAN DEFAULT false,

  -- Step 2: Consumption data
  household_size INTEGER,
  monthly_bill NUMERIC,
  consumption_kwh NUMERIC,

  -- Step 3: System selection
  selected_system TEXT,
  system_size_kw NUMERIC,
  with_battery BOOLEAN DEFAULT false,
  battery_size_kwh NUMERIC,
  grant_type TEXT CHECK (grant_type IN ('none', 'pv_only', 'pv_battery', 'battery_only') OR grant_type IS NULL),

  -- Step 4: Financing
  payment_method TEXT CHECK (payment_method IN ('cash', 'loan') OR payment_method IS NULL),
  loan_term INTEGER,

  -- Step 4: Calculated values
  total_price NUMERIC,
  monthly_payment NUMERIC,
  annual_savings NUMERIC,
  payback_years NUMERIC,

  -- Step 5: Contact info (if they reach this far)
  full_name TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,

  -- Pre-fill info (from Zoho CRM links)
  zoho_lead_id VARCHAR(50),
  is_prefilled_lead BOOLEAN DEFAULT false,

  -- Conversion tracking
  converted_lead_id UUID REFERENCES leads(id),

  -- Device and source info
  device_info JSONB,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,

  -- Analytics
  step_timestamps JSONB DEFAULT '{}'::jsonb,
  total_duration_seconds INTEGER DEFAULT 0
);

-- ============================================================================
-- Indexes for common queries
-- ============================================================================

-- Session token lookup (for resume functionality)
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_token
  ON wizard_sessions(session_token);

-- Status queries (active sessions, abandonment detection)
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_status
  ON wizard_sessions(status);

-- Abandonment detection (find stale in_progress sessions)
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_active_activity
  ON wizard_sessions(last_activity_at)
  WHERE status = 'in_progress';

-- Analytics: drop-off by step
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_step_status
  ON wizard_sessions(highest_step_reached, status);

-- Recent sessions
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_created_at
  ON wizard_sessions(created_at DESC);

-- Find by email (for potential recovery outreach)
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_email
  ON wizard_sessions(email)
  WHERE email IS NOT NULL;

-- Zoho lead lookups
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_zoho
  ON wizard_sessions(zoho_lead_id)
  WHERE zoho_lead_id IS NOT NULL;

-- Converted lead reference
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_converted_lead
  ON wizard_sessions(converted_lead_id)
  WHERE converted_lead_id IS NOT NULL;

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE wizard_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (new sessions)
CREATE POLICY "Allow anonymous insert" ON wizard_sessions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow reading sessions (by token)
CREATE POLICY "Allow reading sessions" ON wizard_sessions
  FOR SELECT
  TO anon
  USING (true);

-- Allow updating sessions
CREATE POLICY "Allow updating sessions" ON wizard_sessions
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Triggers
-- ============================================================================

-- Auto-update updated_at and last_activity_at timestamps
CREATE OR REPLACE FUNCTION update_wizard_session_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_activity_at = NOW();

  -- Track highest step reached
  IF NEW.current_step > COALESCE(OLD.highest_step_reached, 0) THEN
    NEW.highest_step_reached = NEW.current_step;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_wizard_sessions_timestamps
  BEFORE UPDATE ON wizard_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_wizard_session_timestamps();

-- ============================================================================
-- Analytics Functions
-- ============================================================================

-- Get wizard session statistics
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
    ROUND(
      (COUNT(*) FILTER (WHERE ws.status = 'converted_to_lead')::NUMERIC /
       NULLIF(COUNT(*), 0) * 100), 2
    ) as conversion_rate,
    ROUND(AVG(ws.highest_step_reached)::NUMERIC, 2) as avg_highest_step,
    COUNT(*) FILTER (WHERE ws.created_at >= CURRENT_DATE)::BIGINT as sessions_today,
    COUNT(*) FILTER (WHERE ws.created_at >= CURRENT_DATE - INTERVAL '7 days')::BIGINT as sessions_this_week
  FROM wizard_sessions ws;
END;
$$ LANGUAGE plpgsql;

-- Get drop-off analysis by step
CREATE OR REPLACE FUNCTION get_wizard_dropoff_analysis()
RETURNS TABLE (
  step_number INTEGER,
  reached_count BIGINT,
  abandoned_at_step BIGINT,
  dropoff_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH step_data AS (
    SELECT
      ws.highest_step_reached as step,
      COUNT(*) as total
    FROM wizard_sessions ws
    WHERE ws.status IN ('abandoned', 'completed', 'converted_to_lead')
    GROUP BY ws.highest_step_reached
  ),
  cumulative AS (
    SELECT
      s.step,
      SUM(sd.total) OVER (ORDER BY s.step DESC) as reached,
      sd.total as stopped_here
    FROM generate_series(1, 6) s(step)
    LEFT JOIN step_data sd ON sd.step = s.step
  )
  SELECT
    c.step::INTEGER as step_number,
    COALESCE(c.reached, 0)::BIGINT as reached_count,
    COALESCE(c.stopped_here, 0)::BIGINT as abandoned_at_step,
    CASE
      WHEN c.reached > 0 THEN ROUND((COALESCE(c.stopped_here, 0)::NUMERIC / c.reached * 100), 2)
      ELSE 0
    END as dropoff_rate
  FROM cumulative c
  ORDER BY c.step;
END;
$$ LANGUAGE plpgsql;

-- Mark abandoned sessions (called by cron)
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

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE wizard_sessions IS 'Stores wizard progress for partial lead tracking - captures users who abandon before completing';
COMMENT ON COLUMN wizard_sessions.session_token IS 'Unique token stored in localStorage for session continuity';
COMMENT ON COLUMN wizard_sessions.highest_step_reached IS 'Maximum step the user reached (for drop-off analysis)';
COMMENT ON COLUMN wizard_sessions.converted_lead_id IS 'Reference to leads table when session converts to a lead';
COMMENT ON COLUMN wizard_sessions.step_timestamps IS 'JSON object recording when each step was reached';
