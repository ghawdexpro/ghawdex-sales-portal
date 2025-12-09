-- Add location_source column to leads table to track manual location overrides
-- This allows tracking whether the location (Malta/Gozo) was auto-detected or manually selected by the user

-- Add column to leads table
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS location_source VARCHAR(10) DEFAULT 'auto';

-- Add comment to document the column purpose
COMMENT ON COLUMN leads.location_source IS 'How location was determined: "auto" for auto-detected from coordinates, "manual" for user override in Step 3';

-- Add column to wizard_sessions table for session tracking
ALTER TABLE wizard_sessions
ADD COLUMN IF NOT EXISTS location_source VARCHAR(10) DEFAULT 'auto';

ALTER TABLE wizard_sessions
ADD COLUMN IF NOT EXISTS location_auto_detected VARCHAR(10);

-- Add comments
COMMENT ON COLUMN wizard_sessions.location_source IS 'How location was determined: "auto" or "manual"';
COMMENT ON COLUMN wizard_sessions.location_auto_detected IS 'Original auto-detected location (malta or gozo) before any manual override';
