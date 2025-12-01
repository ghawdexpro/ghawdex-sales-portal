# Sales Portal ↔ Backoffice Integration Progress

**Last Updated:** 2024-11-29 23:15
**Resume Command:** "Integration complete - see manual steps below"

---

## Overview

Integrating customer-facing Sales Portal with Backoffice via Zoho CRM.

**Data Flow:**
```
Sales Portal → Zoho CRM → Backoffice Supabase
   (create)     (sync)       (hourly cron)
```

---

## Progress Checklist

### Phase 1: Zoho Sync Enhancement
- [x] Sales Portal writes to Zoho CRM (`src/lib/zoho.ts`)
- [x] Backoffice ZohoLead interface extended (`ghawdex-backoffice/src/lib/integrations/zoho.ts`)
- [x] Backoffice field fetching expanded (getZohoLeadsByModifiedTime, getAllZohoLeads)
- [x] Backoffice zohoLeadToCustomer mapping updated
- [x] Backoffice zoho-sync.ts writes Sales Portal fields

### Phase 2: Cross-DB Sync (Backup)
- [x] Step 1: Create this progress file
- [x] Step 2: Verify Backoffice DB columns exist (ALL PRESENT)
- [x] Step 3: Test current Zoho sync (WORKING - 25 records synced)
- [x] Step 4: Implement portal-sync route (DONE)
- [x] Step 5: Deploy and verify (DEPLOYED)

---

## Integration Complete!

**Done:**
- [x] Pushed to git (commit 4a21da9)
- [x] Deployed to Railway
- [x] Added `PORTAL_SUPABASE_URL` env var

**Manual steps remaining:**
1. Get Sales Portal Supabase SERVICE ROLE KEY from dashboard:
   - Go to: https://supabase.com/dashboard/project/lccebuetwhezxpviyfrs/settings/api
   - Copy the `service_role` key (NOT anon key)
2. Add to Backoffice Railway:
   ```bash
   cd /Users/maciejpopiel/ghawdex-backoffice
   railway variables --set "PORTAL_SUPABASE_SERVICE_KEY=<paste_key_here>"
   ```
3. Set up cron job at cron-job.org:
   - URL: `https://bo.ghawdex.pro/api/cron/portal-sync`
   - Method: POST
   - Header: `Authorization: Bearer <CRON_SECRET>`
   - Schedule: Daily at 2:00 AM Malta time (01:00 UTC winter / 00:00 UTC summer)

---

## Step 4 Results (COMPLETED)

**Files created in Backoffice:**
- `src/lib/integrations/portal-sync.ts` - Sync logic with:
  - Name splitting (full name → first/last)
  - Gozo detection from coordinates
  - Status mapping
  - Deduplication by zoho_lead_id, portal_lead_id, or email
- `src/app/api/cron/portal-sync/route.ts` - API route secured by CRON_SECRET

---

## Step 3 Results (COMPLETED)

**Findings:**
- Backoffice Zoho sync IS WORKING (last sync: 2025-11-29 11:32, pulled 25 records)
- No leads have Sales Portal fields yet (all from Zoho directly)
- Portal-sync provides backup path for direct Supabase-to-Supabase sync

---

## Step 2 Results (COMPLETED)

Backoffice Supabase `leads` table has ALL required columns:
- `system_size_kw` - DECIMAL ✅
- `total_price` - DECIMAL ✅
- `annual_savings` - DECIMAL ✅
- `payment_method` - VARCHAR ✅
- `loan_term` - INTEGER ✅
- `with_battery` - BOOLEAN ✅
- `battery_size_kwh` - DECIMAL ✅
- `portal_lead_id` - UUID ✅
- `is_gozo` - BOOLEAN ✅

---

## Key Files

### Sales Portal (this project)
- `src/lib/zoho.ts` - Writes to Zoho CRM
- `src/app/api/leads/route.ts` - Lead API

### Backoffice (`/Users/maciejpopiel/ghawdex-backoffice`)
- `src/lib/integrations/zoho.ts` - Zoho client
- `src/lib/integrations/zoho-sync.ts` - Sync logic
- `src/app/api/cron/zoho-sync/route.ts` - Hourly cron

---

## Environment

### Sales Portal Supabase
- Project ID: `lccebuetwhezxpviyfrs`
- Table: `leads`

### Backoffice Supabase
- Project ID: `kuoklfrqztafxtoghola`
- Table: `leads`

### Zoho CRM
- Region: EU (`zohoapis.eu`)
- Fields synced: System_Size, Quote_Amount, Annual_Savings, Payment_Method, Loan_Term, With_Battery, Battery_Size, Portal_Source

---

## If Crashed

1. Read this file
2. Check "Current Step" section
3. Continue from there
