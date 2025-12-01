# Database Integration Fix Plan

**Status**: Comprehensive plan to complete Sales Portal ↔ Backoffice integration

**Problem**: Integration development complete but 3 critical manual steps not executed

---

## Current Architecture

```
Sales Portal (lccebuetwhezxpviyfrs)
    ↓ (Zoho CRM via zoho.ts)
Zoho CRM (EU region)
    ↓ (Backoffice sync)
Backoffice Supabase (kuoklfrqztafxtoghola)
```

Plus backup sync:
```
Sales Portal Supabase → Backoffice Supabase (via portal-sync cron)
```

---

## Fix Plan (3 Steps)

### Step 1: Get Sales Portal Service Role Key
**Goal**: Retrieve authentication key for Backoffice to read Sales Portal Supabase

**Actions**:
1. Open Sales Portal Supabase dashboard: https://supabase.com/dashboard/project/lccebuetwhezxpviyfrs/settings/api
2. Find "Service Role Secret" section (NOT anon key)
3. Copy the full service role key (starts with `eyJ...`)
4. Store temporarily for Step 2

**Expected**: Service role key in clipboard (64+ character JWT)

---

### Step 2: Configure Backoffice Environment Variable
**Goal**: Add service role key to Backoffice Railway so it can authenticate with Sales Portal Supabase

**Actions**:
1. From terminal, set Railway variable:
   ```bash
   cd /Users/maciejpopiel/ghawdex-backoffice
   railway variables --set "PORTAL_SUPABASE_SERVICE_KEY=<paste_key_from_step1>"
   ```
2. Verify it was set:
   ```bash
   railway variables --kv | grep PORTAL_SUPABASE_SERVICE_KEY
   ```
3. Redeploy backoffice to Railway:
   ```bash
   git push origin main && railway up
   ```

**Expected**: Backoffice can now authenticate with Sales Portal Supabase

**Code that uses this**: `/Users/maciejpopiel/ghawdex-backoffice/src/lib/integrations/portal-sync.ts` lines 1-20

---

### Step 3: Configure External Cron Job
**Goal**: Set up daily sync trigger at cron-job.org to call backoffice portal-sync endpoint

**Note**: Need to generate CRON_SECRET first (security token for cron requests)

**Sub-step 3a: Generate CRON_SECRET (if not already set)**
```bash
cd /Users/maciejpopiel/ghawdex-backoffice
# Check if already set
railway variables --kv | grep CRON_SECRET
```
If NOT set, generate one:
```bash
openssl rand -base64 32
# Copy the output (e.g., "abc123xyz...")
railway variables --set "CRON_SECRET=<generated_secret>"
```

**Sub-step 3b: Create Cron Job at cron-job.org**
1. Visit https://cron-job.org/en/
2. Click "Create cron job"
3. Configure:
   - **Title**: `Portal Sync - GhawdeX`
   - **URL**: `https://bo.ghawdex.pro/api/cron/portal-sync`
   - **HTTP Method**: POST
   - **Execution schedule**: Every day
   - **Time**: 02:00 (Malta time) = 01:00 UTC (winter) / 00:00 UTC (summer)
   - **Request headers** (click "Add header"):
     - Name: `Authorization`
     - Value: `Bearer <CRON_SECRET_from_step_3a>`
4. Save and test

**Expected**: Cron fires daily and syncs new portal leads to backoffice

---

### Step 4: Verify Integration is Working

**4a: Test Portal → Zoho path (PRIMARY)**
- Create a test lead in sales portal: https://get.ghawdex.pro
- Confirm it appears in Zoho CRM dashboard within 1 minute
- Confirm it appears in backoffice (via hourly Zoho sync)

**4b: Test Portal → Backoffice direct path (BACKUP)**
- Wait 24 hours OR manually trigger via:
  ```bash
  curl -X POST https://bo.ghawdex.pro/api/cron/portal-sync \
    -H "Authorization: Bearer <CRON_SECRET>"
  ```
- Check backoffice database for test lead
- Verify `sync_metadata` table has sync record (logs each attempt)

**4c: Check logs**
```bash
# Backoffice Railway logs
cd /Users/maciejpopiel/ghawdex-backoffice
railway logs
```

---

## Files Involved

### Sales Portal
- `src/lib/zoho.ts` - Writes to Zoho CRM (PRIMARY)
- `src/app/api/leads/route.ts` - Lead API endpoint
- Supabase project: `lccebuetwhezxpviyfrs`

### Backoffice
- `src/lib/integrations/portal-sync.ts` - Reads from Sales Portal Supabase (BACKUP)
- `src/app/api/cron/portal-sync/route.ts` - Cron endpoint (needs CRON_SECRET)
- `src/lib/integrations/zoho-sync.ts` - Reads from Zoho CRM (PRIMARY)
- Supabase project: `kuoklfrqztafxtoghola`

---

## Success Criteria

- [ ] Step 1: Service role key obtained
- [ ] Step 2: PORTAL_SUPABASE_SERVICE_KEY set in backoffice Railway
- [ ] Step 3: Cron job configured and tested at cron-job.org
- [ ] Step 4a: Test lead reaches Zoho CRM
- [ ] Step 4b: Test lead reaches backoffice
- [ ] Step 4c: No errors in backoffice Railway logs

---

## Rollback (if needed)

If anything breaks:
1. Remove cron job at cron-job.org
2. Reset backoffice: `railway variables --unset "PORTAL_SUPABASE_SERVICE_KEY"`
3. Revert Railway: `git revert HEAD && railway up`
4. Primary path (Portal → Zoho → Backoffice) will continue working

---

## Notes

- **Primary path is WORKING**: Sales Portal → Zoho CRM → Backoffice (via hourly sync)
- **Backup path INCOMPLETE**: Sales Portal → Backoffice Supabase direct (needs cron)
- **Security**: CRON_SECRET prevents unauthorized sync triggers
- **Deduplication**: Portal-sync prevents duplicate leads via zoho_lead_id, portal_lead_id, or email matching
- **Schema compatible**: All required columns verified in backoffice leads table

