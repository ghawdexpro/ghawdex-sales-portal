-- Add Google Maps link field to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS google_maps_link TEXT;

-- Add Google Maps link field to wizard_sessions table
ALTER TABLE wizard_sessions ADD COLUMN IF NOT EXISTS google_maps_link TEXT;

-- Add comment for documentation
COMMENT ON COLUMN leads.google_maps_link IS 'Direct Google Maps link to customer location (format: https://www.google.com/maps?q=LAT,LNG)';
COMMENT ON COLUMN wizard_sessions.google_maps_link IS 'Direct Google Maps link to selected location';
