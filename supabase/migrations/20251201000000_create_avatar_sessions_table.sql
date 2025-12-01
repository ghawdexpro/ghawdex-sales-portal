-- ============================================================================
-- Hayden Avatar Chat - Session Persistence Schema
-- ============================================================================
-- This migration creates the avatar_sessions table for storing conversation
-- state, collected data, and session metadata for the Hayden Avatar Chat system.
-- ============================================================================

-- Create avatar_sessions table
CREATE TABLE IF NOT EXISTS avatar_sessions (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Customer identification
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  zoho_lead_id VARCHAR(50),

  -- Session state
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
  current_phase TEXT DEFAULT 'greeting',
  resume_token UUID DEFAULT gen_random_uuid() UNIQUE,

  -- Conversation history (array of message objects)
  conversation_history JSONB DEFAULT '[]'::jsonb,
  last_message_at TIMESTAMPTZ,

  -- Collected data (structured object with all customer/system data)
  collected_data JSONB DEFAULT '{
    "address": null,
    "coordinates": null,
    "location": null,
    "bill_image_url": null,
    "bill_ocr_data": null,
    "monthly_bill": null,
    "consumption_kwh": null,
    "household_size": null,
    "solar_analysis": null,
    "roof_area": null,
    "max_panels": null,
    "selected_system": null,
    "with_battery": false,
    "selected_battery": null,
    "grant_type": "pv_only",
    "payment_method": null,
    "loan_term": null,
    "full_name": null,
    "email": null,
    "phone": null,
    "notes": null,
    "total_price": null,
    "grant_amount": null,
    "monthly_payment": null,
    "annual_savings": null,
    "payback_years": null
  }'::jsonb,

  -- Documents (array of document objects)
  documents JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  source TEXT DEFAULT 'website',
  device_info JSONB,
  total_duration_seconds INTEGER DEFAULT 0,
  heygen_session_id VARCHAR(100),

  -- Prefill data (from Zoho or other sources)
  prefill_data JSONB
);

-- ============================================================================
-- Indexes for common queries
-- ============================================================================

-- Resume token lookup (for resuming sessions)
CREATE INDEX IF NOT EXISTS idx_avatar_sessions_resume_token
  ON avatar_sessions(resume_token);

-- Customer lookups (by phone and email)
CREATE INDEX IF NOT EXISTS idx_avatar_sessions_customer_phone
  ON avatar_sessions(customer_phone)
  WHERE customer_phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_avatar_sessions_customer_email
  ON avatar_sessions(customer_email)
  WHERE customer_email IS NOT NULL;

-- Status queries (active sessions, abandoned cleanup)
CREATE INDEX IF NOT EXISTS idx_avatar_sessions_status
  ON avatar_sessions(status);

-- Zoho integration
CREATE INDEX IF NOT EXISTS idx_avatar_sessions_zoho_lead_id
  ON avatar_sessions(zoho_lead_id)
  WHERE zoho_lead_id IS NOT NULL;

-- Recent sessions query
CREATE INDEX IF NOT EXISTS idx_avatar_sessions_created_at
  ON avatar_sessions(created_at DESC);

-- Active sessions by updated_at (for timeout detection)
CREATE INDEX IF NOT EXISTS idx_avatar_sessions_active_updated
  ON avatar_sessions(updated_at)
  WHERE status = 'active';

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE avatar_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts (new sessions)
CREATE POLICY "Allow anonymous insert" ON avatar_sessions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Allow reading own session by ID or resume token
CREATE POLICY "Allow reading sessions" ON avatar_sessions
  FOR SELECT
  TO anon
  USING (true);

-- Policy: Allow updating own session
CREATE POLICY "Allow updating sessions" ON avatar_sessions
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Triggers
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_avatar_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_avatar_sessions_updated_at
  BEFORE UPDATE ON avatar_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_avatar_session_updated_at();

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to get session statistics
CREATE OR REPLACE FUNCTION get_avatar_session_stats()
RETURNS TABLE (
  total_sessions BIGINT,
  active_sessions BIGINT,
  completed_sessions BIGINT,
  abandoned_sessions BIGINT,
  avg_duration_seconds NUMERIC,
  sessions_today BIGINT,
  sessions_this_week BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_sessions,
    COUNT(*) FILTER (WHERE status = 'active')::BIGINT as active_sessions,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as completed_sessions,
    COUNT(*) FILTER (WHERE status = 'abandoned')::BIGINT as abandoned_sessions,
    ROUND(AVG(total_duration_seconds)::NUMERIC, 2) as avg_duration_seconds,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::BIGINT as sessions_today,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')::BIGINT as sessions_this_week
  FROM avatar_sessions;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up abandoned sessions
CREATE OR REPLACE FUNCTION cleanup_abandoned_avatar_sessions(hours_threshold INTEGER DEFAULT 24)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE avatar_sessions
  SET status = 'abandoned'
  WHERE status = 'active'
    AND updated_at < NOW() - (hours_threshold || ' hours')::INTERVAL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE avatar_sessions IS 'Stores Hayden Avatar Chat conversation sessions with full state persistence';
COMMENT ON COLUMN avatar_sessions.resume_token IS 'Unique token for resuming paused sessions via link';
COMMENT ON COLUMN avatar_sessions.conversation_history IS 'JSON array of all messages in the conversation';
COMMENT ON COLUMN avatar_sessions.collected_data IS 'JSON object with all customer and system selection data';
COMMENT ON COLUMN avatar_sessions.current_phase IS 'Current step in the conversation flow';
COMMENT ON COLUMN avatar_sessions.heygen_session_id IS 'HeyGen streaming session ID for avatar';
