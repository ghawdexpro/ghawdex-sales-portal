# Database Migration Plan - Sales Portal

## Status: ✅ COMPLETE
Last updated: 2024-12-02
Completed via: Supabase CLI with access token

---

## How to Apply

1. Go to: https://supabase.com/dashboard/project/lccebuetwhezxpviyfrs/sql/new
2. Copy each SQL block below
3. Run them in order (Stage 1.1 through Stage 2)
4. Check the boxes as you complete each stage

**Supabase Project:** `lccebuetwhezxpviyfrs` (Sales Portal)

---

## Stages

### Stage 1: Create wizard_sessions table
- [ ] Run SQL to create table with all columns
- [ ] Run SQL to create indexes
- [ ] Run SQL to create RLS policies
- [ ] Run SQL to create triggers
- [ ] Run SQL to create analytics functions
- [ ] Verify table exists

### Stage 2: Add columns to leads table
- [ ] Add `bill_file_url TEXT` column
- [ ] Add `social_provider TEXT` column
- [ ] Verify columns exist

### Stage 3: Create storage bucket
- [ ] Create `bills` bucket in Supabase Storage
- [ ] Set bucket to public
- [ ] Create storage RLS policy for uploads

### Stage 4: Verify deployment
- [ ] Check Railway deployment status
- [ ] Test wizard session creation endpoint
- [ ] Test bill upload endpoint (if bucket created)

---

## Stage 1: wizard_sessions table

### 1.1 Create table (core)

```sql
CREATE TABLE IF NOT EXISTS wizard_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  session_token UUID DEFAULT gen_random_uuid() UNIQUE,
  status TEXT DEFAULT 'in_progress' CHECK (status IN (
    'in_progress', 'abandoned', 'completed', 'converted_to_lead'
  )),
  current_step INTEGER DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 6),
  highest_step_reached INTEGER DEFAULT 1 CHECK (highest_step_reached >= 1 AND highest_step_reached <= 6),
  address TEXT,
  coordinates JSONB,
  location TEXT CHECK (location IN ('malta', 'gozo') OR location IS NULL),
  roof_area NUMERIC,
  max_panels INTEGER,
  annual_sunshine NUMERIC,
  solar_potential JSONB,
  solar_data_is_fallback BOOLEAN DEFAULT false,
  household_size INTEGER,
  monthly_bill NUMERIC,
  consumption_kwh NUMERIC,
  selected_system TEXT,
  system_size_kw NUMERIC,
  with_battery BOOLEAN DEFAULT false,
  battery_size_kwh NUMERIC,
  grant_type TEXT CHECK (grant_type IN ('none', 'pv_only', 'pv_battery', 'battery_only') OR grant_type IS NULL),
  payment_method TEXT CHECK (payment_method IN ('cash', 'loan') OR payment_method IS NULL),
  loan_term INTEGER,
  total_price NUMERIC,
  monthly_payment NUMERIC,
  annual_savings NUMERIC,
  payback_years NUMERIC,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  zoho_lead_id VARCHAR(50),
  is_prefilled_lead BOOLEAN DEFAULT false,
  social_provider TEXT CHECK (social_provider IN ('google', 'facebook') OR social_provider IS NULL),
  converted_lead_id UUID REFERENCES leads(id),
  device_info JSONB,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  step_timestamps JSONB DEFAULT '{}'::jsonb,
  total_duration_seconds INTEGER DEFAULT 0
);
```

### 1.2 Create indexes

```sql
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_token ON wizard_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_status ON wizard_sessions(status);
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_active_activity ON wizard_sessions(last_activity_at) WHERE status = 'in_progress';
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_step_status ON wizard_sessions(highest_step_reached, status);
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_created_at ON wizard_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_email ON wizard_sessions(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_zoho ON wizard_sessions(zoho_lead_id) WHERE zoho_lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_converted_lead ON wizard_sessions(converted_lead_id) WHERE converted_lead_id IS NOT NULL;
```

### 1.3 Enable RLS and create policies

```sql
ALTER TABLE wizard_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert" ON wizard_sessions
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow reading sessions" ON wizard_sessions
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow updating sessions" ON wizard_sessions
  FOR UPDATE TO anon USING (true) WITH CHECK (true);
```

### 1.4 Create trigger function

```sql
CREATE OR REPLACE FUNCTION update_wizard_session_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_activity_at = NOW();
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
```

### 1.5 Create analytics functions

```sql
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
    ROUND((COUNT(*) FILTER (WHERE ws.status = 'converted_to_lead')::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2) as conversion_rate,
    ROUND(AVG(ws.highest_step_reached)::NUMERIC, 2) as avg_highest_step,
    COUNT(*) FILTER (WHERE ws.created_at >= CURRENT_DATE)::BIGINT as sessions_today,
    COUNT(*) FILTER (WHERE ws.created_at >= CURRENT_DATE - INTERVAL '7 days')::BIGINT as sessions_this_week
  FROM wizard_sessions ws;
END;
$$ LANGUAGE plpgsql;

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
```

---

## Stage 2: leads table columns

```sql
ALTER TABLE leads ADD COLUMN IF NOT EXISTS bill_file_url TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS social_provider TEXT;
```

---

## Stage 3: Storage bucket

Manual steps in Supabase Dashboard:
1. Go to Storage
2. Create bucket named `bills`
3. Set public: true
4. Add policy for uploads (optional - anon can upload)

---

## Completion Checklist

- [ ] Stage 1.1: Table created
- [ ] Stage 1.2: Indexes created
- [ ] Stage 1.3: RLS policies created
- [ ] Stage 1.4: Trigger created
- [ ] Stage 1.5: Analytics functions created
- [ ] Stage 2: leads columns added
- [ ] Stage 3: Storage bucket created
- [ ] Stage 4: Deployment verified
