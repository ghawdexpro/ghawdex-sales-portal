-- Fix migration for existing tables
-- Adds missing columns to existing quotes, installations, communications tables

-- Add lead_id to quotes if missing
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE CASCADE;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS quote_number VARCHAR(50);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS system_type VARCHAR(50);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS panel_count INTEGER;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS panel_wattage INTEGER;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS total_kwp DECIMAL(5,2);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS battery_kwh DECIMAL(5,2);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS inverter_type VARCHAR(100);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS gross_price DECIMAL(10,2);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS solar_grant DECIMAL(10,2) DEFAULT 0;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS solar_grant_percent INTEGER DEFAULT 50;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS battery_grant DECIMAL(10,2) DEFAULT 0;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS battery_grant_percent INTEGER DEFAULT 80;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS net_price DECIMAL(10,2);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS annual_savings DECIMAL(10,2);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payback_years DECIMAL(4,1);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS annual_production_kwh INTEGER;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS co2_savings_kg INTEGER;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS financing_option VARCHAR(50);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS financing_months INTEGER;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS monthly_payment DECIMAL(10,2);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft';
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS proposal_pdf_url TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS zoho_quote_id VARCHAR(50);

-- Add columns to leads
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

-- Create appointments table if not exists
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id),
  appointment_type VARCHAR(50),
  scheduled_date DATE,
  scheduled_time_start TIME,
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

-- Create referrals table if not exists
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

-- Create utm_tracking table if not exists
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

-- Create daily_metrics table if not exists
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

-- Create lead_score_history table if not exists
CREATE TABLE IF NOT EXISTS lead_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  previous_score INTEGER,
  new_score INTEGER,
  score_change INTEGER,
  reason VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes (ignore if exist)
CREATE INDEX IF NOT EXISTS idx_quotes_lead_id ON quotes(lead_id);
CREATE INDEX IF NOT EXISTS idx_appointments_lead_id ON appointments(lead_id);
CREATE INDEX IF NOT EXISTS idx_utm_campaign ON utm_tracking(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date);
