# Facebook Lead Ads Integration - TODO

> **Last Updated:** 2025-12-03
> **Status:** Mostly Complete - One manual step remaining

---

## ✅ COMPLETED AUTOMATICALLY

### 1. Code Merged & Deployed
- [x] Branch merged to main
- [x] Deployed to Railway
- [x] Gozo address autocomplete fixed

### 2. Zoho CRM - "Hot - Qualified" Status
- [x] Status auto-created via API (created when first lead uses it)

### 3. Email Template Created
- [x] Template ID: `885227000000994001`
- [x] Name: "Facebook Lead - Wizard Invitation"
- [x] Sends wizard link with pre-filled customer data

### 4. Environment Variables
- [x] `ZOHO_REFRESH_TOKEN` updated with expanded scopes
- [x] `TELEGRAM_TEAM_CHAT_ID` already configured (-5000982375)

---

## ⏳ MANUAL STEP REQUIRED

### Create Workflow Rule in Zoho CRM

The Workflow API requires additional OAuth scopes not available via API. Create manually:

1. Go to **Zoho CRM** → **Setup** (⚙️) → **Automation** → **Workflow Rules**
2. Click **+ Create Rule**
3. Configure:
   - **Module:** Leads
   - **Rule Name:** `Send Wizard Link to Facebook Leads`
   - **When:** On a record action → **Create**
   - **Condition:** Lead Source **equals** "Facebook" **OR** "Facebook Lead Ads"
4. Add **Instant Action** → **Email Notification**
   - Select template: **"Facebook Lead - Wizard Invitation"**
   - Send to: Lead Email
5. **Save and Activate** the rule

---

## 🧪 Testing Checklist

To find your team chat ID:
1. Add @userinfobot to your team group
2. Send any message in the group
3. The bot will reply with the chat ID (negative number for groups)

---

## 4. Facebook Lead Ads Setup (if not done)

### Option A: Native Zoho Integration

1. Go to **Zoho Social** or **Zoho CRM** → **Marketplace**
2. Search for "Facebook Lead Ads"
3. Install and connect your Facebook account
4. Map Facebook form fields to Zoho Lead fields
5. Set Lead Source to "Facebook Lead Ads"

### Option B: Third-Party (Make/Zapier)

1. Create integration: Facebook Lead Ads → Zoho CRM
2. Set up field mapping
3. Ensure Lead Source is set to "Facebook" or "Facebook Lead Ads"

---

## 5. Testing Checklist

- [ ] Create test lead in Zoho with source "Facebook"
- [ ] Verify email is sent with correct wizard link
- [ ] Click wizard link and complete quote
- [ ] Verify lead is updated (not duplicated) in Zoho
- [ ] Check Lead Status is set to "Hot - Qualified"
- [ ] Verify Telegram hot lead notification received
- [ ] Check Supabase for lead update (not duplicate)

---

## 6. Verification Commands

```bash
# Check Railway logs for hot lead detection
railway logs | grep "Hot lead"

# Check for lead matching logs
railway logs | grep "Found existing"
```

---

## Notes

- Hot leads are detected when: source contains "facebook/fb/instagram/meta/google_ads" AND wizard is completed
- Phone matching handles Malta formats: +356 7912 3456, 79123456, etc.
- If lead was converted to Contact in Zoho, system will find and update the Contact instead

---

## Files Changed

| File | Changes |
|------|---------|
| `src/lib/zoho.ts` | `findExistingZohoLead()`, `normalizePhone()`, Lead_Status support |
| `src/lib/supabase.ts` | `findExistingLead()` with multi-criteria search |
| `src/app/api/leads/route.ts` | Enhanced matching, hot lead detection, priority notifications |
| `docs/FACEBOOK_LEAD_INTEGRATION_RESEARCH.md` | Full research document |
