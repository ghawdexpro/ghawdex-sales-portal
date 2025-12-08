-- Fix installations table - add missing columns
-- The table exists from a previous migration but is missing sales system columns

ALTER TABLE installations ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id);
ALTER TABLE installations ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id);
ALTER TABLE installations ADD COLUMN IF NOT EXISTS installation_number VARCHAR(50);
ALTER TABLE installations ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending_grant';
ALTER TABLE installations ADD COLUMN IF NOT EXISTS contract_signed_at TIMESTAMPTZ;
ALTER TABLE installations ADD COLUMN IF NOT EXISTS grant_submitted_at TIMESTAMPTZ;
ALTER TABLE installations ADD COLUMN IF NOT EXISTS grant_approved_at TIMESTAMPTZ;
ALTER TABLE installations ADD COLUMN IF NOT EXISTS equipment_ordered_at TIMESTAMPTZ;
ALTER TABLE installations ADD COLUMN IF NOT EXISTS installation_scheduled_date DATE;
ALTER TABLE installations ADD COLUMN IF NOT EXISTS installation_started_at TIMESTAMPTZ;
ALTER TABLE installations ADD COLUMN IF NOT EXISTS installation_completed_at TIMESTAMPTZ;
ALTER TABLE installations ADD COLUMN IF NOT EXISTS inspection_date DATE;
ALTER TABLE installations ADD COLUMN IF NOT EXISTS inspection_passed_at TIMESTAMPTZ;
ALTER TABLE installations ADD COLUMN IF NOT EXISTS grant_paid_at TIMESTAMPTZ;
ALTER TABLE installations ADD COLUMN IF NOT EXISTS panel_serials JSONB;
ALTER TABLE installations ADD COLUMN IF NOT EXISTS inverter_serial VARCHAR(100);
ALTER TABLE installations ADD COLUMN IF NOT EXISTS battery_serial VARCHAR(100);
ALTER TABLE installations ADD COLUMN IF NOT EXISTS arms_reference VARCHAR(100);
ALTER TABLE installations ADD COLUMN IF NOT EXISTS grant_amount_approved DECIMAL(10,2);
ALTER TABLE installations ADD COLUMN IF NOT EXISTS installation_team JSONB;
ALTER TABLE installations ADD COLUMN IF NOT EXISTS installation_notes TEXT;
ALTER TABLE installations ADD COLUMN IF NOT EXISTS contract_pdf_url TEXT;
ALTER TABLE installations ADD COLUMN IF NOT EXISTS permit_pdf_url TEXT;
ALTER TABLE installations ADD COLUMN IF NOT EXISTS completion_certificate_url TEXT;
ALTER TABLE installations ADD COLUMN IF NOT EXISTS nps_score INTEGER;
ALTER TABLE installations ADD COLUMN IF NOT EXISTS review_requested_at TIMESTAMPTZ;
ALTER TABLE installations ADD COLUMN IF NOT EXISTS review_submitted_at TIMESTAMPTZ;
ALTER TABLE installations ADD COLUMN IF NOT EXISTS google_review_url TEXT;
ALTER TABLE installations ADD COLUMN IF NOT EXISTS zoho_deal_id VARCHAR(50);

-- Fix communications table - add missing columns
ALTER TABLE communications ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE CASCADE;
ALTER TABLE communications ADD COLUMN IF NOT EXISTS channel VARCHAR(50);
ALTER TABLE communications ADD COLUMN IF NOT EXISTS direction VARCHAR(10);
ALTER TABLE communications ADD COLUMN IF NOT EXISTS subject VARCHAR(255);
ALTER TABLE communications ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE communications ADD COLUMN IF NOT EXISTS template_used VARCHAR(100);
ALTER TABLE communications ADD COLUMN IF NOT EXISTS status VARCHAR(50);
ALTER TABLE communications ADD COLUMN IF NOT EXISTS call_duration_seconds INTEGER;
ALTER TABLE communications ADD COLUMN IF NOT EXISTS call_recording_url TEXT;
ALTER TABLE communications ADD COLUMN IF NOT EXISTS call_outcome VARCHAR(100);
ALTER TABLE communications ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE communications ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE communications ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ;
ALTER TABLE communications ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ;
ALTER TABLE communications ADD COLUMN IF NOT EXISTS zoho_activity_id VARCHAR(50);
ALTER TABLE communications ADD COLUMN IF NOT EXISTS external_message_id VARCHAR(255);

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_installations_lead_id ON installations(lead_id);
CREATE INDEX IF NOT EXISTS idx_installations_status ON installations(status);
