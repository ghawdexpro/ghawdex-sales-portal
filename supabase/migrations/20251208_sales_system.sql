-- GhawdeX Sales System - Supabase Database Schema
-- Version: 1.0
-- Date: December 2025
--
-- This schema supports:
-- - Lead management and scoring
-- - Quote tracking
-- - Appointment scheduling
-- - Installation tracking
-- - Referral program
-- - Analytics and reporting
--
-- IMPORTANT: Run this in Supabase SQL Editor
-- After running, set up Row Level Security (RLS) policies

-- ============================================
-- EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- ============================================
-- ENUMS
-- ============================================

-- Lead status progression
CREATE TYPE lead_status AS ENUM (
  'new',
  'contacted',
  'qualified',
  'quote_sent',
  'appointment_scheduled',
  'assessment_complete',
  'proposal_sent',
  'negotiating',
  'won',
  'lost',
  'nurture'
);

-- Lead source tracking
CREATE TYPE lead_source AS ENUM (
  'facebook_ad',
  'instagram_ad',
  'google_ad',
  'organic_search',
  'direct',
  'referral',
  'calculator',
  'phone_inquiry',
  'walk_in',
  'partner',
  'other'
);

-- Location for grant calculation
CREATE TYPE location_type AS ENUM (
  'gozo',
  'malta'
);

-- System types offered
CREATE TYPE system_type AS ENUM (
  'solar_only',
  'solar_battery',
  'battery_only',
  'commercial'
);

-- Appointment status
CREATE TYPE appointment_status AS ENUM (
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
  'rescheduled'
);

-- Installation status
CREATE TYPE installation_status AS ENUM (
  'pending_grant',
  'grant_approved',
  'equipment_ordered',
  'scheduled',
  'in_progress',
  'completed',
  'inspection_pending',
  'inspection_passed',
  'grant_paid'
);

-- Communication channel
CREATE TYPE comm_channel AS ENUM (
  'phone',
  'sms',
  'email',
  'whatsapp',
  'messenger',
  'in_person'
);

-- ============================================
-- TABLES
-- ============================================

-- Main leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Contact info
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50) NOT NULL,
  phone_secondary VARCHAR(50),

  -- Location
  address TEXT,
  locality VARCHAR(100),
  postcode VARCHAR(10),
  location location_type DEFAULT 'malta',

  -- Property info
  property_type VARCHAR(50), -- house, apartment, commercial
  roof_type VARCHAR(50),
  roof_access BOOLEAN DEFAULT true,

  -- Current situation
  monthly_bill DECIMAL(10,2),
  annual_consumption_kwh INTEGER,
  current_provider VARCHAR(50) DEFAULT 'ARMS',

  -- Lead details
  status lead_status DEFAULT 'new',
  source lead_source,
  source_campaign VARCHAR(255), -- UTM campaign
  source_medium VARCHAR(100), -- UTM medium
  source_content VARCHAR(255), -- UTM content (ad variant)

  -- Scoring
  lead_score INTEGER DEFAULT 0,
  quality_score INTEGER DEFAULT 0, -- 1-10 manual quality rating

  -- Assignment
  assigned_to UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ,

  -- External IDs
  zoho_lead_id VARCHAR(50),
  facebook_lead_id VARCHAR(50),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  first_contact_at TIMESTAMPTZ,
  last_contact_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,

  -- Soft delete
  deleted_at TIMESTAMPTZ
);

-- Lead scoring history
CREATE TABLE lead_score_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  previous_score INTEGER,
  new_score INTEGER,
  score_change INTEGER,
  reason VARCHAR(255), -- e.g., "Completed calculator", "Answered call"

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotes/Proposals
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  quote_number VARCHAR(50) UNIQUE,

  -- System configuration
  system_type system_type NOT NULL,
  panel_count INTEGER,
  panel_wattage INTEGER,
  total_kwp DECIMAL(5,2),
  battery_kwh DECIMAL(5,2),
  inverter_type VARCHAR(100),

  -- Pricing
  gross_price DECIMAL(10,2) NOT NULL,
  solar_grant DECIMAL(10,2) DEFAULT 0,
  solar_grant_percent INTEGER DEFAULT 50,
  battery_grant DECIMAL(10,2) DEFAULT 0,
  battery_grant_percent INTEGER DEFAULT 80,
  discount DECIMAL(10,2) DEFAULT 0,
  net_price DECIMAL(10,2) NOT NULL, -- What customer pays

  -- Savings projections
  annual_savings DECIMAL(10,2),
  payback_years DECIMAL(4,1),
  annual_production_kwh INTEGER,
  co2_savings_kg INTEGER,

  -- Financing
  financing_option VARCHAR(50), -- 'cash', 'bov_0percent', 'bov_standard'
  financing_months INTEGER,
  monthly_payment DECIMAL(10,2),

  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- draft, sent, viewed, accepted, rejected, expired
  valid_until TIMESTAMPTZ,

  -- Documents
  proposal_pdf_url TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,

  -- External
  zoho_quote_id VARCHAR(50)
);

-- Appointments
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id),

  -- Scheduling
  appointment_type VARCHAR(50), -- 'site_assessment', 'installation', 'inspection'
  scheduled_date DATE NOT NULL,
  scheduled_time_start TIME NOT NULL,
  scheduled_time_end TIME,
  duration_minutes INTEGER DEFAULT 60,

  -- Assignment
  technician_id UUID REFERENCES auth.users(id),
  technician_name VARCHAR(100),
  technician_phone VARCHAR(50),

  -- Status
  status appointment_status DEFAULT 'scheduled',

  -- Notes
  customer_notes TEXT,
  internal_notes TEXT,
  assessment_notes TEXT,

  -- Confirmations
  confirmation_sent_at TIMESTAMPTZ,
  reminder_24h_sent_at TIMESTAMPTZ,
  reminder_2h_sent_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT
);

-- Installations (converted leads)
CREATE TABLE installations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id),
  quote_id UUID NOT NULL REFERENCES quotes(id),

  -- Installation details
  installation_number VARCHAR(50) UNIQUE,
  status installation_status DEFAULT 'pending_grant',

  -- Dates
  contract_signed_at TIMESTAMPTZ,
  grant_submitted_at TIMESTAMPTZ,
  grant_approved_at TIMESTAMPTZ,
  equipment_ordered_at TIMESTAMPTZ,
  installation_scheduled_date DATE,
  installation_started_at TIMESTAMPTZ,
  installation_completed_at TIMESTAMPTZ,
  inspection_date DATE,
  inspection_passed_at TIMESTAMPTZ,
  grant_paid_at TIMESTAMPTZ,

  -- Equipment serial numbers
  panel_serials JSONB,
  inverter_serial VARCHAR(100),
  battery_serial VARCHAR(100),

  -- Grant details
  arms_reference VARCHAR(100),
  grant_amount_approved DECIMAL(10,2),

  -- Installation team
  installation_team JSONB, -- Array of technician IDs/names
  installation_notes TEXT,

  -- Documents
  contract_pdf_url TEXT,
  permit_pdf_url TEXT,
  completion_certificate_url TEXT,

  -- Customer satisfaction
  nps_score INTEGER, -- 0-10
  review_requested_at TIMESTAMPTZ,
  review_submitted_at TIMESTAMPTZ,
  google_review_url TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- External
  zoho_deal_id VARCHAR(50)
);

-- Communication log
CREATE TABLE communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- Communication details
  channel comm_channel NOT NULL,
  direction VARCHAR(10) NOT NULL, -- 'inbound', 'outbound'

  -- Content
  subject VARCHAR(255),
  content TEXT,
  template_used VARCHAR(100),

  -- Status
  status VARCHAR(50), -- 'sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed'

  -- Call specific
  call_duration_seconds INTEGER,
  call_recording_url TEXT,
  call_outcome VARCHAR(100), -- 'answered', 'voicemail', 'no_answer', 'busy'

  -- Performed by
  user_id UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,

  -- External
  zoho_activity_id VARCHAR(50),
  external_message_id VARCHAR(255)
);

-- Referrals
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Referrer (existing customer)
  referrer_lead_id UUID REFERENCES leads(id),
  referrer_installation_id UUID REFERENCES installations(id),
  referrer_name VARCHAR(200),
  referrer_email VARCHAR(255),
  referrer_phone VARCHAR(50),

  -- Referred (new lead)
  referred_lead_id UUID REFERENCES leads(id),
  referred_name VARCHAR(200),
  referred_email VARCHAR(255),
  referred_phone VARCHAR(50),

  -- Referral code
  referral_code VARCHAR(50) UNIQUE,

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, contacted, converted, paid, expired

  -- Reward
  reward_amount DECIMAL(10,2) DEFAULT 100,
  reward_paid_at TIMESTAMPTZ,
  reward_payment_method VARCHAR(50),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ
);

-- UTM tracking for analytics
CREATE TABLE utm_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,

  -- UTM parameters
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(255),
  utm_content VARCHAR(255),
  utm_term VARCHAR(255),

  -- Additional tracking
  landing_page TEXT,
  referrer TEXT,
  device_type VARCHAR(50),
  browser VARCHAR(100),
  ip_address INET,

  -- Facebook specific
  fb_ad_id VARCHAR(100),
  fb_adset_id VARCHAR(100),
  fb_campaign_id VARCHAR(100),
  fbclid VARCHAR(255),

  -- Google specific
  gclid VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily metrics for dashboard
CREATE TABLE daily_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,

  -- Lead metrics
  leads_total INTEGER DEFAULT 0,
  leads_gozo INTEGER DEFAULT 0,
  leads_malta INTEGER DEFAULT 0,
  leads_from_calculator INTEGER DEFAULT 0,
  leads_from_ads INTEGER DEFAULT 0,

  -- Response metrics
  avg_response_time_seconds INTEGER,
  leads_contacted_under_2min INTEGER DEFAULT 0,
  leads_contacted_under_5min INTEGER DEFAULT 0,

  -- Conversion metrics
  appointments_scheduled INTEGER DEFAULT 0,
  quotes_sent INTEGER DEFAULT 0,
  quotes_accepted INTEGER DEFAULT 0,

  -- Revenue metrics
  deals_won INTEGER DEFAULT 0,
  revenue_gross DECIMAL(12,2) DEFAULT 0,
  revenue_net DECIMAL(12,2) DEFAULT 0,
  grants_secured DECIMAL(12,2) DEFAULT 0,

  -- Ad spend (manual input or API)
  facebook_spend DECIMAL(10,2) DEFAULT 0,
  google_spend DECIMAL(10,2) DEFAULT 0,
  total_ad_spend DECIMAL(10,2) DEFAULT 0,

  -- Calculated
  cost_per_lead DECIMAL(10,2),
  conversion_rate DECIMAL(5,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Leads indexes
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_location ON leads(location);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_zoho_id ON leads(zoho_lead_id);

-- Full text search on leads
CREATE INDEX idx_leads_name_search ON leads USING gin(
  (first_name || ' ' || COALESCE(last_name, '')) gin_trgm_ops
);

-- Quotes indexes
CREATE INDEX idx_quotes_lead_id ON quotes(lead_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_created_at ON quotes(created_at DESC);

-- Appointments indexes
CREATE INDEX idx_appointments_lead_id ON appointments(lead_id);
CREATE INDEX idx_appointments_date ON appointments(scheduled_date);
CREATE INDEX idx_appointments_technician ON appointments(technician_id);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Communications indexes
CREATE INDEX idx_communications_lead_id ON communications(lead_id);
CREATE INDEX idx_communications_created_at ON communications(created_at DESC);

-- UTM indexes
CREATE INDEX idx_utm_campaign ON utm_tracking(utm_campaign);
CREATE INDEX idx_utm_source ON utm_tracking(utm_source);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Calculate lead score
CREATE OR REPLACE FUNCTION calculate_lead_score(lead_id UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  lead_record RECORD;
BEGIN
  SELECT * INTO lead_record FROM leads WHERE id = lead_id;

  -- Base score
  score := 20;

  -- Location bonus (Gozo = higher grant = more likely to convert)
  IF lead_record.location = 'gozo' THEN
    score := score + 15;
  END IF;

  -- High bill = high motivation
  IF lead_record.monthly_bill IS NOT NULL THEN
    IF lead_record.monthly_bill >= 200 THEN
      score := score + 25;
    ELSIF lead_record.monthly_bill >= 150 THEN
      score := score + 20;
    ELSIF lead_record.monthly_bill >= 100 THEN
      score := score + 15;
    ELSIF lead_record.monthly_bill >= 50 THEN
      score := score + 10;
    END IF;
  END IF;

  -- Phone provided = contactable
  IF lead_record.phone IS NOT NULL THEN
    score := score + 10;
  END IF;

  -- Email provided = can nurture
  IF lead_record.email IS NOT NULL THEN
    score := score + 5;
  END IF;

  -- Source bonus
  IF lead_record.source = 'calculator' THEN
    score := score + 20; -- High intent
  ELSIF lead_record.source = 'referral' THEN
    score := score + 25; -- Warm lead
  END IF;

  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Update lead score and log change
CREATE OR REPLACE FUNCTION update_lead_score(
  p_lead_id UUID,
  p_reason VARCHAR DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  old_score INTEGER;
  new_score INTEGER;
BEGIN
  SELECT lead_score INTO old_score FROM leads WHERE id = p_lead_id;
  new_score := calculate_lead_score(p_lead_id);

  -- Update lead
  UPDATE leads SET lead_score = new_score WHERE id = p_lead_id;

  -- Log change if score changed
  IF old_score IS DISTINCT FROM new_score THEN
    INSERT INTO lead_score_history (lead_id, previous_score, new_score, score_change, reason)
    VALUES (p_lead_id, old_score, new_score, new_score - COALESCE(old_score, 0), p_reason);
  END IF;

  RETURN new_score;
END;
$$ LANGUAGE plpgsql;

-- Get grant amounts for location
CREATE OR REPLACE FUNCTION get_grant_info(p_location location_type)
RETURNS TABLE(
  solar_grant_percent INTEGER,
  battery_grant_percent INTEGER,
  solar_grant_amount DECIMAL,
  battery_grant_amount DECIMAL,
  total_grant DECIMAL,
  typical_customer_cost DECIMAL
) AS $$
BEGIN
  IF p_location = 'gozo' THEN
    RETURN QUERY SELECT
      50::INTEGER,
      95::INTEGER,
      3000::DECIMAL,
      8550::DECIMAL,
      11550::DECIMAL,
      499::DECIMAL;
  ELSE
    RETURN QUERY SELECT
      50::INTEGER,
      80::INTEGER,
      3000::DECIMAL,
      7200::DECIMAL,
      10200::DECIMAL,
      1800::DECIMAL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Speed to lead check
CREATE OR REPLACE FUNCTION check_speed_to_lead(p_lead_id UUID)
RETURNS TABLE(
  first_contact_seconds INTEGER,
  met_2min_target BOOLEAN,
  met_5min_target BOOLEAN
) AS $$
DECLARE
  lead_created TIMESTAMPTZ;
  first_contact TIMESTAMPTZ;
  seconds_diff INTEGER;
BEGIN
  SELECT created_at, first_contact_at
  INTO lead_created, first_contact
  FROM leads WHERE id = p_lead_id;

  IF first_contact IS NULL THEN
    RETURN QUERY SELECT NULL::INTEGER, FALSE, FALSE;
  ELSE
    seconds_diff := EXTRACT(EPOCH FROM (first_contact - lead_created))::INTEGER;
    RETURN QUERY SELECT
      seconds_diff,
      seconds_diff <= 120,
      seconds_diff <= 300;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update timestamps
CREATE TRIGGER trigger_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_installations_updated_at
  BEFORE UPDATE ON installations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-calculate lead score on insert
CREATE OR REPLACE FUNCTION trigger_calculate_initial_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.lead_score := calculate_lead_score(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This trigger runs AFTER insert since we need the row to exist first
CREATE OR REPLACE FUNCTION trigger_set_initial_score()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_lead_score(NEW.id, 'Initial score calculation');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_leads_initial_score
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_initial_score();

-- ============================================
-- VIEWS
-- ============================================

-- Active leads dashboard view
CREATE VIEW v_active_leads AS
SELECT
  l.*,
  q.quote_number,
  q.net_price,
  q.status as quote_status,
  a.scheduled_date as next_appointment,
  a.status as appointment_status,
  (SELECT COUNT(*) FROM communications WHERE lead_id = l.id) as total_contacts,
  (SELECT MAX(created_at) FROM communications WHERE lead_id = l.id) as last_communication
FROM leads l
LEFT JOIN quotes q ON q.lead_id = l.id AND q.status NOT IN ('rejected', 'expired')
LEFT JOIN appointments a ON a.lead_id = l.id AND a.status IN ('scheduled', 'confirmed')
WHERE l.deleted_at IS NULL
  AND l.status NOT IN ('won', 'lost');

-- Pipeline summary view
CREATE VIEW v_pipeline_summary AS
SELECT
  status,
  location,
  COUNT(*) as count,
  SUM(lead_score) as total_score,
  AVG(lead_score) as avg_score,
  SUM(monthly_bill) as total_monthly_bills
FROM leads
WHERE deleted_at IS NULL
  AND status NOT IN ('lost')
GROUP BY status, location;

-- Today's appointments view
CREATE VIEW v_todays_appointments AS
SELECT
  a.*,
  l.first_name,
  l.last_name,
  l.phone,
  l.address,
  l.locality,
  l.monthly_bill,
  q.net_price,
  q.system_type
FROM appointments a
JOIN leads l ON l.id = a.lead_id
LEFT JOIN quotes q ON q.id = a.quote_id
WHERE a.scheduled_date = CURRENT_DATE
  AND a.status NOT IN ('cancelled', 'no_show')
ORDER BY a.scheduled_time_start;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users (team members)
-- Note: Adjust these based on your auth setup

CREATE POLICY "Team members can view all leads"
  ON leads FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Team members can insert leads"
  ON leads FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Team members can update leads"
  ON leads FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Similar policies for other tables
CREATE POLICY "Team members can view all quotes"
  ON quotes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Team members can manage quotes"
  ON quotes FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Team members can view all appointments"
  ON appointments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Team members can manage appointments"
  ON appointments FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================

-- Uncomment to insert sample data for testing
/*
INSERT INTO leads (first_name, last_name, email, phone, location, monthly_bill, source, source_campaign)
VALUES
  ('Test', 'Lead', 'test@example.com', '+35679000001', 'gozo', 180, 'calculator', 'gozo_solar_2025'),
  ('Sample', 'Customer', 'sample@example.com', '+35679000002', 'malta', 150, 'facebook_ad', 'malta_solar_2025');
*/

-- ============================================
-- GRANTS FOR API ACCESS
-- ============================================

-- Grant access to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE leads IS 'Main table for all sales leads';
COMMENT ON TABLE quotes IS 'Solar system quotes/proposals';
COMMENT ON TABLE appointments IS 'Site assessments and installations';
COMMENT ON TABLE installations IS 'Completed installations tracking';
COMMENT ON TABLE communications IS 'All customer communications log';
COMMENT ON TABLE referrals IS 'Referral program tracking';
COMMENT ON TABLE utm_tracking IS 'Marketing attribution data';
COMMENT ON TABLE daily_metrics IS 'Aggregated daily KPIs';

COMMENT ON COLUMN leads.lead_score IS 'Auto-calculated score 0-100 based on engagement and fit';
COMMENT ON COLUMN leads.quality_score IS 'Manual 1-10 rating by sales team';
COMMENT ON COLUMN quotes.net_price IS 'Final price customer pays after all grants';
COMMENT ON COLUMN installations.nps_score IS 'Net Promoter Score 0-10 from customer survey';
