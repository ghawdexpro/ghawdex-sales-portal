# Facebook Lead Ads Integration - TODO

> **Last Updated:** 2025-12-04
> **Status:** Code Complete - Manual Zoho setup + testing required

---

## SYSTEM STATUS

### Code Implementation (All Complete)

| Component | Status | Location |
|-----------|--------|----------|
| Hot lead detection | ✅ Done | `src/app/api/leads/route.ts:243-267` |
| Lead deduplication (Supabase) | ✅ Done | `src/lib/supabase.ts:120-222` |
| Lead deduplication (Zoho) | ✅ Done | `src/lib/zoho.ts` - `findExistingZohoLead()` |
| Lead_Status "Hot - Qualified" | ✅ Done | `src/lib/zoho.ts:166` |
| 3-tier Telegram notifications | ✅ Done | `src/lib/telegram/router.ts` |
| Phone normalization (Malta) | ✅ Done | Both `supabase.ts` and `zoho.ts` |

### Database Verification (Just Tested)

| Check | Result |
|-------|--------|
| No duplicate emails | ✅ Verified |
| Zoho sync working | ✅ Leads have `zoho_lead_id` |
| Facebook leads exist | ❌ None yet (no FB ads running) |

---

## MANUAL SETUP REQUIRED

### 1. Zoho CRM Workflow Rule (ONE-TIME)

The Workflow API requires OAuth scopes we don't have. Create manually:

1. **Zoho CRM** → **Setup** (⚙️) → **Automation** → **Workflow Rules**
2. Click **+ Create Rule**
3. Configure:
   - **Module:** Leads
   - **Rule Name:** `Send Wizard Link to Facebook Leads`
   - **When:** On a record action → **Create**
   - **Condition:**
     ```
     Lead Source equals "Facebook"
     OR Lead Source equals "Facebook Lead Ads"
     OR Portal_Source contains "facebook"
     ```
4. Add **Instant Action** → **Email Notification**
   - Template: **"Facebook Lead - Wizard Invitation"** (ID: `885227000000994001`)
   - Send to: Lead Email
5. **Save and Activate**

### 2. Facebook Lead Ads Connection

Choose one:

**Option A: Zoho Native Integration**
- Zoho CRM → Marketplace → "Facebook Lead Ads"
- Connect Facebook account
- Map fields: Name, Email, Phone
- Set Lead Source = "Facebook Lead Ads"

**Option B: Make.com/Zapier**
- Trigger: Facebook Lead Ads → New Lead
- Action: Zoho CRM → Create Lead
- Field mapping + Lead Source = "Facebook"

---

## TESTING CHECKLIST

### Phase 1: Unit Test - Hot Lead Detection

Run this in the dev console or create a test file:

```bash
# Test the hot lead detection logic
cd /Users/maciejpopiel/ghawdex-sales-portal
node -e "
const sources = ['facebook', 'Facebook Lead Ads', 'fb_campaign_123', 'instagram', 'meta', 'google_ads', 'sales-portal', 'website'];
sources.forEach(src => {
  const isHot = src.toLowerCase().includes('facebook') ||
                src.toLowerCase().includes('fb') ||
                src.toLowerCase().includes('instagram') ||
                src.toLowerCase().includes('meta') ||
                src.toLowerCase().includes('google_ads');
  console.log(src.padEnd(20), '→', isHot ? '🔥 HOT' : '   normal');
});
"
```

Expected output:
- facebook, Facebook Lead Ads, fb_*, instagram, meta, google_ads → 🔥 HOT
- sales-portal, website → normal

### Phase 2: API Test - Lead Creation with Facebook Source

```bash
# Create a test lead with Facebook source
curl -X POST https://get.ghawdex.pro/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "FB Test User",
    "email": "fbtest-'$(date +%s)'@test.ghawdex.pro",
    "phone": "79999999",
    "source": "facebook",
    "address": "Test Address, Malta"
  }'
```

**Verify response includes:**
- `"is_hot_lead": true`
- `"zoho_success": true`

### Phase 3: Deduplication Test

```bash
# Create lead with same email but different source
curl -X POST https://get.ghawdex.pro/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "FB Test User Updated",
    "email": "fbtest-SAME_TIMESTAMP@test.ghawdex.pro",
    "phone": "79999999",
    "source": "sales-portal",
    "system_size_kw": 5,
    "total_price": 8000
  }'
```

**Verify:**
- `"is_returning_lead": true`
- Same `zoho_lead_id` as first request
- Lead updated, not duplicated

### Phase 4: Full Flow Test (Manual)

1. **Create lead in Zoho CRM:**
   - First Name: Test
   - Last Name: Facebook
   - Email: your-email@gmail.com
   - Phone: 79123456
   - Lead Source: Facebook Lead Ads

2. **Check email** (if workflow rule is active):
   - Should receive wizard link within 1-2 minutes

3. **Click wizard link and complete:**
   - Pre-filled name/email should appear
   - Complete all steps through Summary

4. **Verify in Zoho:**
   - Lead Status = "Hot - Qualified"
   - Quote_Amount populated
   - System_Size populated

5. **Check Telegram:**
   - 🔥 HOT LEAD notification in team + admin channels

6. **Check Supabase:**
   - Single lead record (not duplicate)
   - `status` = "quoted"

---

## VERIFICATION COMMANDS

```bash
# Check Railway logs for hot lead detection
railway logs --tail 50 | grep -i "hot lead"

# Check for lead matching in logs
railway logs --tail 50 | grep -i "found existing"

# Check Supabase for recent leads
curl -s "https://epxeimwsheyttevwtjku.supabase.co/rest/v1/leads?select=id,name,source,status,zoho_lead_id&order=created_at.desc&limit=5" \
  -H "apikey: $ANON_KEY" | jq '.'

# Check for Facebook-source leads
curl -s "https://epxeimwsheyttevwtjku.supabase.co/rest/v1/leads?source=ilike.*facebook*" \
  -H "apikey: $ANON_KEY" | jq '.'
```

---

## HOT LEAD DETECTION LOGIC

Leads are marked as "hot" when:

```javascript
// From src/app/api/leads/route.ts
const isFromExternalSource =
  source.includes('facebook') ||
  source.includes('fb') ||
  source.includes('instagram') ||
  source.includes('ig') ||
  source.includes('meta') ||
  source.includes('google_ads') ||
  source.includes('ad_') ||
  existingLead !== null;  // Returning leads also qualify

const hasCompletedWizard =
  lead.address?.length > 5 &&
  lead.system_size_kw > 0 &&
  lead.total_price > 0;

isHotLead = isFromExternalSource && hasCompletedWizard;
```

---

## FILES REFERENCE

| File | Purpose |
|------|---------|
| `src/lib/zoho.ts` | Zoho API, `findExistingZohoLead()`, Lead_Status |
| `src/lib/supabase.ts` | `findExistingLead()` with multi-criteria search |
| `src/app/api/leads/route.ts` | Hot lead detection, priority notifications |
| `src/lib/telegram/router.ts` | 3-tier notification system |
| `docs/FACEBOOK_LEAD_INTEGRATION_RESEARCH.md` | Full research document |

---

## NOTES

- Hot leads trigger notifications to ALL 3 Telegram tiers (admin + team + everything)
- Phone matching handles Malta formats: +356 7912 3456, 79123456, etc.
- If a lead was converted to Contact in Zoho, system finds and updates the Contact
- Deduplication priority: zoho_lead_id > email > phone > name
