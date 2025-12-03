# Facebook Lead Ads Integration - TODO

> **Branch:** `claude/facebook-lead-form-research-01XtAcEpfHB9sgiV7obEuDc8`
> **Created:** 2025-12-03

---

## 1. Merge to Main & Deploy

```bash
git checkout main
git merge claude/facebook-lead-form-research-01XtAcEpfHB9sgiV7obEuDc8
git push origin main
railway up
```

---

## 2. Zoho CRM Configuration

### 2.1 Create "Hot - Qualified" Lead Status

1. Go to **Zoho CRM** → **Setup** (gear icon)
2. Navigate to **Customization** → **Modules and Fields**
3. Click on **Leads** module
4. Find **Lead Status** field → click to edit
5. Add new value: `Hot - Qualified`
6. Save changes

### 2.2 Create Email Template for Facebook Leads

1. Go to **Setup** → **Automation** → **Email Templates**
2. Click **+ New Template**
3. Name: `Facebook Lead - Wizard Invitation`
4. Module: Leads
5. Use this content:

```
Subject: Your Free Solar Quote is Ready - GhawdeX

Hi ${Leads.First Name},

Thank you for your interest in solar power! 🌞

Your personalized solar quote is just 2 minutes away.
Click below to complete your quote:

👉 https://get.ghawdex.pro/?name=${Leads.Full Name}&email=${Leads.Email}&phone=${Leads.Phone}&zoho_id=${Leads.Lead Id}

What you'll get:
✅ AI-powered roof analysis
✅ Instant pricing with grant calculations
✅ Monthly savings estimate
✅ Financing options

Questions? Call us at +356 xxxx xxxx

Best regards,
The GhawdeX Team
```

6. Save template

### 2.3 Create Workflow Rule for Facebook Leads

1. Go to **Setup** → **Automation** → **Workflow Rules**
2. Click **+ Create Rule**
3. Configure:
   - **Module:** Leads
   - **Rule Name:** `Send Wizard Link to Facebook Leads`
   - **When:** On a record action → Create
   - **Condition:** Lead Source equals "Facebook" OR "Facebook Lead Ads"
4. Add **Instant Action** → **Email Notification**
   - Select the template created above
   - Send to: Lead Email
5. Save and activate the rule

---

## 3. Environment Variables (Railway)

Add these to Railway if not already set:

```bash
# Team Telegram channel for hot lead notifications (optional)
railway variables --set "TELEGRAM_TEAM_CHAT_ID=-100xxxxxxxxxx"
```

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
