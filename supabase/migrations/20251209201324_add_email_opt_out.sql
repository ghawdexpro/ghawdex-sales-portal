-- Add email opt-out columns to leads table
-- Used by unsubscribe functionality

ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_opted_out boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_opted_out_at timestamptz;

-- Create index for efficient filtering in cron queries
CREATE INDEX IF NOT EXISTS idx_leads_email_opted_out ON leads(email_opted_out) WHERE email_opted_out = false;

-- Add comment for documentation
COMMENT ON COLUMN leads.email_opted_out IS 'True if lead unsubscribed from email communications';
COMMENT ON COLUMN leads.email_opted_out_at IS 'Timestamp when lead unsubscribed';
