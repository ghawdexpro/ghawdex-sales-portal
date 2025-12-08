-- GhawdeX Sales System - Additional Tables
-- Version: 1.1
-- Date: December 2025
-- Note: leads table already exists, this adds supporting tables

-- ============================================
-- EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- ENUMS (with IF NOT EXISTS pattern)
-- ============================================

DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM (
    'new', 'contacted', 'qualified', 'quote_sent', 'appointment_scheduled',
    'assessment_complete', 'proposal_sent', 'negotiating', 'won', 'lost', 'nurture'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE lead_source AS ENUM (
    'facebook_ad', 'instagram_ad', 'google_ad', 'organic_search', 'direct',
    'referral', 'calculator', 'phone_inquiry', 'walk_in', 'partner', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE location_type AS ENUM ('gozo', 'malta');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE system_type AS ENUM ('solar_only', 'solar_battery', 'battery_only', 'commercial');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM (
    'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE installation_status AS ENUM (
    'pending_grant', 'grant_approved', 'equipment_ordered', 'scheduled',
    'in_progress', 'completed', 'inspection_pending', 'inspection_passed', 'grant_paid'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE comm_channel AS ENUM ('phone', 'sms', 'email', 'whatsapp', 'messenger', 'in_person');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- ADD COLUMNS TO EXISTING LEADS TABLE
-- ============================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS first_contact_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_campaign VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_medium VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_content VARCHAR(255);

-- ============================================
-- NEW TABLES
-- ============================================

-- Lead scoring history
CREATE TABLE IF NOT EXISTS lead_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  previous_score INTEGER,
  new_score INTEGER,
  score_change INTEGER,
  reason VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotes/Proposals
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  quote_number VARCHAR(50) UNIQUE,
  system_type VARCHAR(50),
  panel_count INTEGER,
  panel_wattage INTEGER,
  total_kwp DECIMAL(5,2),
  battery_kwh DECIMAL(5,2),
  inverter_type VARCHAR(100),
  gross_price DECIMAL(10,2),
  solar_grant DECIMAL(10,2) DEFAULT 0,
  solar_grant_percent INTEGER DEFAULT 50,
  battery_grant DECIMAL(10,2) DEFAULT 0,
  battery_grant_percent INTEGER DEFAULT 80,
  discount DECIMAL(10,2) DEFAULT 0,
  net_price DECIMAL(10,2),
  annual_savings DECIMAL(10,2),
  payback_years DECIMAL(4,1),
  annual_production_kwh INTEGER,
  co2_savings_kg INTEGER,
  financing_option VARCHAR(50),
  financing_months INTEGER,
  monthly_payment DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'draft',
  valid_until TIMESTAMPTZ,
  proposal_pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  zoho_quote_id VARCHAR(50)
);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id),
  appointment_type VARCHAR(50),
  scheduled_date DATE NOT NULL,
  scheduled_time_start TIME NOT NULL,
  scheduled_time_end TIME,
  duration_minutes INTEGER DEFAULT 60,
  technician_id UUID,
  technician_name VARCHAR(100),
  technician_phone VARCHAR(50),
  status VARCHAR(50) DEFAULT 'scheduled',
  customer_notes TEXT,
  internal_notes TEXT,
  assessment_notes TEXT,
  confirmation_sent_at TIMESTAMPTZ,
  reminder_24h_sent_at TIMESTAMPTZ,
  reminder_2h_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT
);

-- Installations
CREATE TABLE IF NOT EXISTS installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id),
  quote_id UUID REFERENCES quotes(id),
  installation_number VARCHAR(50) UNIQUE,
  status VARCHAR(50) DEFAULT 'pending_grant',
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
  panel_serials JSONB,
  inverter_serial VARCHAR(100),
  battery_serial VARCHAR(100),
  arms_reference VARCHAR(100),
  grant_amount_approved DECIMAL(10,2),
  installation_team JSONB,
  installation_notes TEXT,
  contract_pdf_url TEXT,
  permit_pdf_url TEXT,
  completion_certificate_url TEXT,
  nps_score INTEGER,
  review_requested_at TIMESTAMPTZ,
  review_submitted_at TIMESTAMPTZ,
  google_review_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  zoho_deal_id VARCHAR(50)
);

-- Communications log
CREATE TABLE IF NOT EXISTS communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL,
  direction VARCHAR(10) NOT NULL,
  subject VARCHAR(255),
  content TEXT,
  template_used VARCHAR(100),
  status VARCHAR(50),
  call_duration_seconds INTEGER,
  call_recording_url TEXT,
  call_outcome VARCHAR(100),
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  zoho_activity_id VARCHAR(50),
  external_message_id VARCHAR(255)
);

-- Referrals
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_lead_id UUID REFERENCES leads(id),
  referrer_installation_id UUID REFERENCES installations(id),
  referrer_name VARCHAR(200),
  referrer_email VARCHAR(255),
  referrer_phone VARCHAR(50),
  referred_lead_id UUID REFERENCES leads(id),
  referred_name VARCHAR(200),
  referred_email VARCHAR(255),
  referred_phone VARCHAR(50),
  referral_code VARCHAR(50) UNIQUE,
  status VARCHAR(50) DEFAULT 'pending',
  reward_amount DECIMAL(10,2) DEFAULT 100,
  reward_paid_at TIMESTAMPTZ,
  reward_payment_method VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ
);

-- UTM tracking
CREATE TABLE IF NOT EXISTS utm_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(255),
  utm_content VARCHAR(255),
  utm_term VARCHAR(255),
  landing_page TEXT,
  referrer TEXT,
  device_type VARCHAR(50),
  browser VARCHAR(100),
  ip_address INET,
  fb_ad_id VARCHAR(100),
  fb_adset_id VARCHAR(100),
  fb_campaign_id VARCHAR(100),
  fbclid VARCHAR(255),
  gclid VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily metrics
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  leads_total INTEGER DEFAULT 0,
  leads_gozo INTEGER DEFAULT 0,
  leads_malta INTEGER DEFAULT 0,
  leads_from_calculator INTEGER DEFAULT 0,
  leads_from_ads INTEGER DEFAULT 0,
  avg_response_time_seconds INTEGER,
  leads_contacted_under_2min INTEGER DEFAULT 0,
  leads_contacted_under_5min INTEGER DEFAULT 0,
  appointments_scheduled INTEGER DEFAULT 0,
  quotes_sent INTEGER DEFAULT 0,
  quotes_accepted INTEGER DEFAULT 0,
  deals_won INTEGER DEFAULT 0,
  revenue_gross DECIMAL(12,2) DEFAULT 0,
  revenue_net DECIMAL(12,2) DEFAULT 0,
  grants_secured DECIMAL(12,2) DEFAULT 0,
  facebook_spend DECIMAL(10,2) DEFAULT 0,
  google_spend DECIMAL(10,2) DEFAULT 0,
  total_ad_spend DECIMAL(10,2) DEFAULT 0,
  cost_per_lead DECIMAL(10,2),
  conversion_rate DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_quotes_lead_id ON quotes(lead_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_appointments_lead_id ON appointments(lead_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_communications_lead_id ON communications(lead_id);
CREATE INDEX IF NOT EXISTS idx_utm_campaign ON utm_tracking(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date);

-- ============================================
-- FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS trigger_quotes_updated_at ON quotes;
CREATE TRIGGER trigger_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_appointments_updated_at ON appointments;
CREATE TRIGGER trigger_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_installations_updated_at ON installations;
CREATE TRIGGER trigger_installations_updated_at
  BEFORE UPDATE ON installations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for authenticated" ON quotes;
DROP POLICY IF EXISTS "Enable all for authenticated" ON appointments;
DROP POLICY IF EXISTS "Enable all for authenticated" ON installations;
DROP POLICY IF EXISTS "Enable all for authenticated" ON communications;
DROP POLICY IF EXISTS "Enable all for authenticated" ON referrals;

CREATE POLICY "Enable all for authenticated" ON quotes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated" ON appointments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated" ON installations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated" ON communications FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated" ON referrals FOR ALL USING (auth.role() = 'authenticated');

-- Grant access
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
