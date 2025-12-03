# Plan: Unify Supabase Databases

> **Status**: READY FOR EXECUTION
> **Created**: December 2024
> **Quick Start**: `claude "continue with supabase unification plan in /docs/SUPABASE_UNIFICATION_PLAN.md"`

## Goal
Merge Sales Portal and Backoffice into single Supabase project (`epxeimwsheyttevwtjku` - ghawdexpro's Project).

## Current State
| Project | Reference | Tables | Leads |
|---------|-----------|--------|-------|
| ghawdexpro's Project (TARGET) | `epxeimwsheyttevwtjku` | leads | ~4 |
| ghawdex-sales-portal (SOURCE) | `lccebuetwhezxpviyfrs` | leads, wizard_sessions, avatar_sessions | 21 |

---

## Schema Comparison (COMPLETED)

### Target DB (ghawdexpro) - 20 columns:
```
address, analysis_id, assigned_to, coordinates_lat, coordinates_lng,
created_at, email, email_sent_at, google_maps_link, id, location_link_id,
name, notes, pdf_generated_at, phone, report_expires_at, report_token,
source, status, zoho_lead_id
```

### Sales Portal DB - 40 columns:
```
address, annual_savings, battery_brand, battery_model, battery_size_kwh,
bill_file_url, consumption_kwh, coordinates (JSONB), created_at, email,
google_maps_link, grant_amount, grant_path, grant_type, household_size,
id, inverter_brand, inverter_model, loan_term, monthly_bill, monthly_payment,
name, notes, panel_brand, panel_count, panel_model, panel_wattage,
payment_method, phone, proposal_file_url, roof_area, selected_system,
social_provider, source, status, system_size_kw, total_price, updated_at,
with_battery, zoho_lead_id
```

### Key Differences:
- **Coordinates**: Target uses `coordinates_lat`/`coordinates_lng`, Sales Portal uses JSONB `coordinates`
- **Sales Portal exclusive (27 cols)**: solar system, financing, consumption data
- **Target exclusive (8 cols)**: analysis_id, assigned_to, email_sent_at, location_link_id, pdf_generated_at, report_expires_at, report_token

---

## STAGE 1: Schema Migration (Target DB)
**Checkpoint**: [x] Complete (2024-12-03)

Run in Supabase SQL Editor for project `epxeimwsheyttevwtjku`:

```sql
-- ============================================================================
-- STAGE 1: Add Sales Portal columns to Target DB
-- Project: epxeimwsheyttevwtjku (ghawdexpro's Project)
-- ============================================================================

-- Solar System Details
ALTER TABLE leads ADD COLUMN IF NOT EXISTS system_size_kw NUMERIC;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS selected_system TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS panel_brand TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS panel_model TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS panel_count INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS panel_wattage INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS inverter_brand TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS inverter_model TEXT;

-- Battery Details
ALTER TABLE leads ADD COLUMN IF NOT EXISTS with_battery BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS battery_brand TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS battery_model TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS battery_size_kwh NUMERIC;

-- Consumption & Property
ALTER TABLE leads ADD COLUMN IF NOT EXISTS consumption_kwh NUMERIC;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS monthly_bill NUMERIC;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS household_size INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS roof_area NUMERIC;

-- Financials & Grant
ALTER TABLE leads ADD COLUMN IF NOT EXISTS total_price NUMERIC;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS annual_savings NUMERIC;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS monthly_payment NUMERIC;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS loan_term INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS grant_path BOOLEAN DEFAULT true;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS grant_type TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS grant_amount NUMERIC;

-- Files & Documents
ALTER TABLE leads ADD COLUMN IF NOT EXISTS bill_file_url TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS proposal_file_url TEXT;

-- Coordinates (JSONB format for Sales Portal compatibility)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS coordinates JSONB;

-- Metadata
ALTER TABLE leads ADD COLUMN IF NOT EXISTS social_provider TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## STAGE 2: Create Supporting Tables (Target DB)
**Checkpoint**: [x] Complete (2024-12-03)

Run in Supabase SQL Editor for project `epxeimwsheyttevwtjku`:

```sql
-- ============================================================================
-- STAGE 2: Create wizard_sessions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS wizard_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT UNIQUE,

  -- Progress
  current_step INTEGER DEFAULT 1,
  completed_steps INTEGER[] DEFAULT '{}',

  -- Lead reference
  lead_id UUID REFERENCES leads(id),

  -- Session data (stores all wizard state)
  session_data JSONB DEFAULT '{}'
);

-- RLS for wizard_sessions (public access like leads)
ALTER TABLE wizard_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on wizard_sessions"
ON wizard_sessions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public select on wizard_sessions"
ON wizard_sessions FOR SELECT
USING (true);

CREATE POLICY "Allow public update on wizard_sessions"
ON wizard_sessions FOR UPDATE
USING (true);

-- ============================================================================
-- STAGE 2B: Create avatar_sessions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS avatar_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Customer identification
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  zoho_lead_id VARCHAR(50),

  -- Session state
  status TEXT DEFAULT 'active',
  current_phase TEXT DEFAULT 'greeting',
  resume_token UUID UNIQUE DEFAULT gen_random_uuid(),

  -- Conversation data
  conversation_history JSONB DEFAULT '[]',
  collected_data JSONB,
  documents JSONB DEFAULT '[]',

  -- Metadata
  source TEXT DEFAULT 'website',
  total_duration_seconds INTEGER DEFAULT 0,
  heygen_session_id VARCHAR(100)
);

-- RLS for avatar_sessions
ALTER TABLE avatar_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on avatar_sessions"
ON avatar_sessions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public select on avatar_sessions"
ON avatar_sessions FOR SELECT
USING (true);

CREATE POLICY "Allow public update on avatar_sessions"
ON avatar_sessions FOR UPDATE
USING (true);
```

---

## STAGE 3: Data Migration
**Checkpoint**: [x] Complete (2024-12-03) - 17 leads migrated, 4 duplicates skipped

### 3A: Export from Sales Portal
Run Node.js script to export all leads:

```javascript
// File: scripts/export-leads.mjs
const SUPABASE_URL = "https://lccebuetwhezxpviyfrs.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjY2VidWV0d2hlenhwdml5ZnJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzQ2MjYsImV4cCI6MjA4MDAxMDYyNn0.Zfl7pNWwhWcLbGnoFHk2twiTxNBMxubRNr7SMa_oKWQ";

const response = await fetch(`${SUPABASE_URL}/rest/v1/leads?select=*`, {
  headers: {
    "apikey": ANON_KEY,
    "Authorization": `Bearer ${ANON_KEY}`
  }
});
const leads = await response.json();
console.log(JSON.stringify(leads, null, 2));
```

### 3B: Import to Target DB
After schema migration, import leads with coordinate transformation:

```javascript
// File: scripts/import-leads.mjs
const TARGET_URL = "https://epxeimwsheyttevwtjku.supabase.co";
const TARGET_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVweGVpbXdzaGV5dHRldnd0amt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMTA3MzcsImV4cCI6MjA3ODg4NjczN30.I_cQdlUy3fAXW6Gj-_EbML3p4wEarjA71MbN1Y4Wpx8";

// Load exported leads (from stage 3A output)
const leads = [...]; // Paste exported data here

for (const lead of leads) {
  // Transform coordinates: copy JSONB to lat/lng columns
  if (lead.coordinates) {
    lead.coordinates_lat = lead.coordinates.lat;
    lead.coordinates_lng = lead.coordinates.lng;
  }

  // Mark source as migrated
  lead.source = lead.source || 'sales-portal-migrated';

  // Remove id to let target generate new UUID
  const { id, ...leadData } = lead;

  const res = await fetch(`${TARGET_URL}/rest/v1/leads`, {
    method: 'POST',
    headers: {
      "apikey": TARGET_KEY,
      "Authorization": `Bearer ${TARGET_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    },
    body: JSON.stringify(leadData)
  });

  const result = await res.json();
  console.log(`Migrated: ${lead.email || lead.name} -> ${result[0]?.id}`);
}
```

---

## STAGE 4: Update Sales Portal
**Checkpoint**: [x] Complete (2024-12-03)

### 4A: Update Environment Variables

**`.env.local` changes:**
```bash
# OLD (Sales Portal DB)
# NEXT_PUBLIC_SUPABASE_URL=https://lccebuetwhezxpviyfrs.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...Zfl7pN...

# NEW (ghawdexpro's Project - unified)
NEXT_PUBLIC_SUPABASE_URL=https://epxeimwsheyttevwtjku.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVweGVpbXdzaGV5dHRldnd0amt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMTA3MzcsImV4cCI6MjA3ODg4NjczN30.I_cQdlUy3fAXW6Gj-_EbML3p4wEarjA71MbN1Y4Wpx8
```

### 4B: Update Railway Environment Variables
```bash
/opt/homebrew/bin/railway variables --set \
  "NEXT_PUBLIC_SUPABASE_URL=https://epxeimwsheyttevwtjku.supabase.co" \
  "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVweGVpbXdzaGV5dHRldnd0amt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMTA3MzcsImV4cCI6MjA3ODg4NjczN30.I_cQdlUy3fAXW6Gj-_EbML3p4wEarjA71MbN1Y4Wpx8"
```

### 4C: Update CLAUDE.md
Change database reference from `lccebuetwhezxpviyfrs` to `epxeimwsheyttevwtjku`.

### 4D: Deploy to Railway
```bash
git add .
git commit -m "chore: migrate to unified Supabase database (epxeimwsheyttevwtjku)"
/opt/homebrew/bin/railway up
```

---

## STAGE 5: Update Backoffice
**Checkpoint**: [x] Complete (2024-12-03) - Removed portal-sync cron, updated docs

### 5A: Disable Portal Sync Cron
In `/Users/maciejpopiel/ghawdex-backoffice`:
- Find and disable the portal-sync cron job (no longer needed - same DB now)

### 5B: Update CLAUDE.md
Document the unified database architecture.

---

## STAGE 6: Verification & Cleanup
**Checkpoint**: [x] Complete (2024-12-03)

### 6A: Verify Migration
```bash
# Check lead count in target DB
curl -s "https://epxeimwsheyttevwtjku.supabase.co/rest/v1/leads?select=id,email,source" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVweGVpbXdzaGV5dHRldnd0amt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMTA3MzcsImV4cCI6MjA3ODg4NjczN30.I_cQdlUy3fAXW6Gj-_EbML3p4wEarjA71MbN1Y4Wpx8" | jq length
```

### 6B: Test Sales Portal
1. Visit https://get.ghawdex.pro
2. Complete a test lead through wizard
3. Verify lead appears in unified database

### 6C: Archive Old Database
- Keep `lccebuetwhezxpviyfrs` paused for 30 days as backup
- Then delete if all is working

---

## Files to Modify Summary

| File | Change |
|------|--------|
| `sales-portal/.env.local` | Update SUPABASE_URL and ANON_KEY |
| `sales-portal/CLAUDE.md` | Update project reference |
| `backoffice/CLAUDE.md` | Document unified DB |
| `backoffice/*/portal-sync.*` | Remove sync job |
| Railway env vars | Update via CLI |

---

## Rollback Plan

If issues occur:
1. Revert `.env.local` to old values
2. Revert Railway env vars
3. Old database `lccebuetwhezxpviyfrs` still contains all original data
