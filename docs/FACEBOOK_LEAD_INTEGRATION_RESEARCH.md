# Facebook Lead Ads Integration Research

> **Research Branch:** `claude/facebook-lead-form-research-01XtAcEpfHB9sgiV7obEuDc8`
> **Date:** 2025-12-03
> **Status:** Research Complete - Ready for Implementation Planning

---

## 📋 Executive Summary

This document outlines the research and implementation plan for integrating Facebook Lead Ads with the GhawdeX Sales Portal and Zoho CRM, ensuring leads from Facebook ads are properly tracked, matched, and marked as "hot leads" when they complete the wizard.

### The Problem

1. **Facebook leads are created in Zoho CRM** but customers don't fill out the detailed solar quote wizard
2. **No automated email** is sent with a personalized link to complete the quote
3. **When customers do fill out the wizard**, the system may create duplicates instead of updating the existing lead
4. **No way to identify "hot leads"** (leads who clicked ad AND completed wizard)
5. **No priority notification** to sales team for these high-intent leads

### The Solution

A multi-part integration that:
1. **Zoho Workflow** → Sends email with pre-filled wizard link when Facebook lead is created
2. **Enhanced Lead Matching** → Matches by phone, email, OR name to find existing leads
3. **Lead Stage Update** → Sets lead to "Hot - Qualified" stage when wizard is completed
4. **Priority Notifications** → Special Telegram alert for hot leads
5. **Supabase Merge** → Updates existing records instead of creating duplicates

---

## 🔍 Current System Analysis

### How Pre-filled Links Work Today

The sales portal already supports pre-filled links from Zoho CRM:

```
https://get.ghawdex.pro/?name=John&email=john@test.com&phone=79123456&zoho_id=12345
```

**Current Flow:**
1. URL params are parsed in `src/app/page.tsx`
2. `SET_PREFILL` action populates contact info in wizard state
3. Step 5 (Contact Form) is skipped for pre-filled users
4. On submit, `zoho_lead_id` triggers UPDATE instead of CREATE in Zoho

**File References:**
- `src/app/page.tsx:81-96` - URL param parsing
- `src/components/wizard/WizardContext.tsx:103-111` - SET_PREFILL action
- `src/app/api/leads/route.ts:237-279` - Prefilled lead handling

### Current Lead Matching Logic

**Zoho CRM (`src/lib/zoho.ts`):**
- Only matches by `zoho_lead_id` (explicit ID in URL)
- Falls back to email search for converted Contacts (lines 168-225)
- No matching by phone or name

**Supabase (`src/lib/supabase.ts`):**
- Only `getLeadByZohoId()` function exists
- No search by phone, email, or name

### Current Telegram Notifications

Located in `src/app/api/leads/route.ts:79-153`:
- Sends notification for all new leads
- Different message for "Quote Completions" (prefilled users)
- Includes priority scoring (0-100 based on system size, price, etc.)
- Generates "Quick Quote Link" for sales team

---

## 🚀 Implementation Plan

### Part 1: Zoho CRM Workflow (No Code Changes Required)

**Goal:** Automatically send welcome email with personalized wizard link when Facebook lead is created.

#### Option A: Native Zoho Workflow (Recommended)

1. **Create Workflow Rule** in Zoho CRM:
   - **Module:** Leads
   - **Trigger:** On a record action → Create
   - **Condition:** Lead Source = "Facebook" OR Lead Source = "Facebook Lead Ads"

2. **Add Email Alert Action:**
   - Use Email Template with merge fields
   - Template should include personalized link:
   ```
   https://get.ghawdex.pro/?name=${Leads.Full Name}&email=${Leads.Email}&phone=${Leads.Phone}&zoho_id=${Leads.Lead Id}
   ```

3. **Email Template Example:**
   ```html
   Subject: Your Free Solar Quote is Ready - GhawdeX

   Hi ${Leads.First Name},

   Thank you for your interest in solar power! 🌞

   Your personalized solar quote is just 2 minutes away.
   Click below to complete your quote:

   [Get My Free Quote]
   https://get.ghawdex.pro/?name=${Leads.Full Name}&email=${Leads.Email}&phone=${Leads.Phone}&zoho_id=${Leads.Lead Id}

   What you'll get:
   ✅ AI-powered roof analysis
   ✅ Instant pricing with grant calculations
   ✅ Monthly savings estimate
   ✅ Financing options

   Questions? Call us at +356 xxxx xxxx

   Best regards,
   The GhawdeX Team
   ```

#### Option B: Zoho Flow (More Flexibility)

Use Zoho Flow for advanced logic:
- Can add delays (send email after 5 minutes)
- Can check if lead already has quote data
- Can trigger multiple actions (email + SMS)

#### Option C: Third-Party Integration

Use [LeadsBridge](https://leadsbridge.com/blog/zoho-crm/), [Make](https://www.make.com/en/integrations/facebook-lead-ads/zohocrm), or [Zapier](https://zapier.com/apps/facebook-lead-ads/integrations/zoho-crm) for:
- More complex email sequences
- Multi-channel notifications
- Advanced duplicate checking

**Sources:**
- [Zoho CRM Facebook Integration](https://www.zoho.com/crm/facebook.html)
- [Configuring Workflow Rules](https://help.zoho.com/portal/en/kb/crm/automate-business-processes/workflow-management/articles/configuring-workflow-rules)

---

### Part 2: Enhanced Lead Matching (Code Changes Required)

**Goal:** Match incoming leads by phone, email, OR name to prevent duplicates.

#### 2.1 New Zoho Search Function

Add to `src/lib/zoho.ts`:

```typescript
/**
 * Search for existing lead by multiple criteria
 * Priority: zoho_id > email > phone > name
 */
export async function findExistingZohoLead(
  criteria: {
    zoho_lead_id?: string | null;
    email?: string;
    phone?: string;
    name?: string;
  }
): Promise<{ id: string; type: 'lead' | 'contact' } | null> {
  const accessToken = await getAccessToken();
  const apiDomain = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.eu';

  // 1. If we have zoho_lead_id, verify it exists
  if (criteria.zoho_lead_id) {
    try {
      const response = await fetch(
        `${apiDomain}/crm/v2/Leads/${criteria.zoho_lead_id}`,
        {
          headers: { 'Authorization': `Zoho-oauthtoken ${accessToken}` },
        }
      );
      if (response.ok) {
        return { id: criteria.zoho_lead_id, type: 'lead' };
      }
    } catch (e) {
      // Lead may have been converted, continue searching
    }
  }

  // 2. Search by email in Leads
  if (criteria.email) {
    const emailSearch = await fetch(
      `${apiDomain}/crm/v2/Leads/search?email=${encodeURIComponent(criteria.email)}`,
      {
        headers: { 'Authorization': `Zoho-oauthtoken ${accessToken}` },
      }
    );
    const emailResult = await emailSearch.json();
    if (emailResult.data?.[0]?.id) {
      return { id: emailResult.data[0].id, type: 'lead' };
    }
  }

  // 3. Search by phone in Leads
  if (criteria.phone) {
    // Normalize phone (remove spaces, +, etc.)
    const normalizedPhone = criteria.phone.replace(/[\s+\-()]/g, '');
    const phoneSearch = await fetch(
      `${apiDomain}/crm/v2/Leads/search?phone=${encodeURIComponent(normalizedPhone)}`,
      {
        headers: { 'Authorization': `Zoho-oauthtoken ${accessToken}` },
      }
    );
    const phoneResult = await phoneSearch.json();
    if (phoneResult.data?.[0]?.id) {
      return { id: phoneResult.data[0].id, type: 'lead' };
    }
  }

  // 4. Search by name using COQL (last resort)
  if (criteria.name) {
    const nameParts = criteria.name.trim().split(' ');
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : criteria.name;

    const coqlSearch = await fetch(`${apiDomain}/crm/v2/coql`, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        select_query: `SELECT id FROM Leads WHERE Last_Name = '${lastName}' LIMIT 1`
      }),
    });
    const coqlResult = await coqlSearch.json();
    if (coqlResult.data?.[0]?.id) {
      return { id: coqlResult.data[0].id, type: 'lead' };
    }
  }

  // 5. Also check Contacts (in case lead was converted)
  if (criteria.email) {
    const contactSearch = await fetch(`${apiDomain}/crm/v2/coql`, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        select_query: `SELECT id FROM Contacts WHERE Email = '${criteria.email}'`
      }),
    });
    const contactResult = await contactSearch.json();
    if (contactResult.data?.[0]?.id) {
      return { id: contactResult.data[0].id, type: 'contact' };
    }
  }

  return null;
}
```

#### 2.2 New Supabase Search Function

Add to `src/lib/supabase.ts`:

```typescript
/**
 * Search for existing lead by multiple criteria
 * Returns the most recently created matching lead
 */
export async function findExistingLead(criteria: {
  zoho_lead_id?: string | null;
  email?: string;
  phone?: string;
  name?: string;
}): Promise<Lead | null> {
  // Build OR conditions
  const conditions: string[] = [];

  if (criteria.zoho_lead_id) {
    conditions.push(`zoho_lead_id.eq.${criteria.zoho_lead_id}`);
  }
  if (criteria.email) {
    conditions.push(`email.eq.${encodeURIComponent(criteria.email)}`);
  }
  if (criteria.phone) {
    // Normalize phone for matching
    const normalizedPhone = criteria.phone.replace(/[\s+\-()]/g, '');
    conditions.push(`phone.eq.${encodeURIComponent(normalizedPhone)}`);
  }
  if (criteria.name) {
    conditions.push(`name.eq.${encodeURIComponent(criteria.name)}`);
  }

  if (conditions.length === 0) return null;

  try {
    const response = await supabaseFetch(
      `/leads?or=(${conditions.join(',')})&order=created_at.desc&limit=1`
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error('Error finding existing lead:', error);
    return null;
  }
}
```

**Sources:**
- [Zoho CRM Search Records API](https://www.zoho.com/crm/developer/docs/api/v8/search-records.html)
- [Zoho COQL API](https://www.zoho.com/crm/developer/docs/api/v8/COQL-Overview.html)

---

### Part 3: Lead Stage Update for Hot Leads

**Goal:** When a Facebook lead completes the wizard, mark them as "Hot - Qualified" in Zoho.

#### 3.1 Zoho Lead Stages

Standard Zoho Lead stages (customize as needed):
1. `New` - Just created
2. `Contacted` - Initial contact made
3. `Qualified` - Confirmed interest
4. `Hot - Qualified` - **NEW** High intent (completed wizard)
5. `Proposal Sent` - Quote delivered
6. `Negotiation` - Discussing terms
7. `Won` - Converted to customer
8. `Lost` - Did not convert

#### 3.2 Update Lead Stage in API

Modify `src/lib/zoho.ts` - Add stage to `mapToZohoFields`:

```typescript
function mapToZohoFields(lead: ZohoLeadData, options?: { isHotLead?: boolean }): Record<string, unknown> {
  const fields = {
    // ... existing fields ...

    // Set stage for hot leads (Facebook + completed wizard)
    Lead_Status: options?.isHotLead ? 'Hot - Qualified' : undefined,
  };

  return fields;
}
```

Modify `updateZohoLead` to accept options:

```typescript
export async function updateZohoLead(
  zohoLeadId: string,
  lead: ZohoLeadData,
  options?: { isHotLead?: boolean }
): Promise<boolean> {
  // ... existing code ...
  const zohoData = {
    ...mapToZohoFields(lead, options),
    id: zohoLeadId,
  };
  // ... rest of function ...
}
```

---

### Part 4: Enhanced Telegram Notifications

**Goal:** Send special priority notification for hot leads (Facebook + wizard completed).

#### 4.1 Hot Lead Detection

Add to `src/app/api/leads/route.ts`:

```typescript
// Detect if this is a "hot lead" (came from Facebook AND completed wizard)
function isHotLead(lead: Partial<Lead>, source?: string): boolean {
  const isFacebookSource =
    source?.toLowerCase().includes('facebook') ||
    lead.source?.toLowerCase().includes('facebook');

  const hasCompletedWizard =
    lead.address &&
    lead.system_size_kw &&
    lead.total_price;

  return isFacebookSource && !!hasCompletedWizard;
}
```

#### 4.2 Hot Lead Telegram Message

Add new notification format for hot leads:

```typescript
async function sendHotLeadNotification(lead: Lead, prefillLink?: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  const teamChatId = process.env.TELEGRAM_TEAM_CHAT_ID; // New: team notifications

  if (!botToken || !chatId) return;

  const message = `🔥🔥🔥 *HOT LEAD - PRIORITY!* 🔥🔥🔥

⚡ *Facebook Lead Completed Wizard!*

👤 *Name:* ${lead.name}
📧 *Email:* ${lead.email}
📱 *Phone:* ${lead.phone}

📍 *Address:* ${lead.address}
🔆 *System:* ${lead.system_size_kw} kWp
🔋 *Battery:* ${lead.with_battery ? `${lead.battery_size_kwh} kWh` : 'No'}
💰 *Total Price:* €${lead.total_price?.toLocaleString()}

🎯 *This customer:*
1. Clicked Facebook ad
2. Received our email
3. Completed full quote wizard

📞 *ACTION REQUIRED:* Call within 15 minutes!

🔗 Source: Facebook Lead Ads`;

  // Send to admin
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
    }),
  });

  // Also send to team channel if configured
  if (teamChatId) {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: teamChatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
  }
}
```

---

### Part 5: Supabase Lead Merge Logic

**Goal:** Merge data when updating existing lead, keeping best values.

```typescript
function mergeLeadData(existing: Lead, incoming: Partial<Lead>): Partial<Lead> {
  const merged: Partial<Lead> = {};

  // For each field, keep the "best" value (non-null, most recent, or most complete)
  const fields = [
    'address', 'coordinates', 'household_size', 'monthly_bill',
    'consumption_kwh', 'roof_area', 'selected_system', 'system_size_kw',
    'with_battery', 'battery_size_kwh', 'grant_type', 'grant_amount',
    'payment_method', 'loan_term', 'total_price', 'monthly_payment',
    'annual_savings', 'proposal_file_url'
  ];

  for (const field of fields) {
    const incomingValue = incoming[field as keyof Lead];
    const existingValue = existing[field as keyof Lead];

    // Prefer incoming if it has a value
    if (incomingValue !== null && incomingValue !== undefined) {
      merged[field as keyof Lead] = incomingValue;
    }
  }

  // Always update status to most advanced
  const statusOrder = ['new', 'contacted', 'quoted', 'signed', 'installed'];
  const existingIdx = statusOrder.indexOf(existing.status);
  const incomingStatus = incoming.status || 'quoted'; // Wizard completion = quoted
  const incomingIdx = statusOrder.indexOf(incomingStatus);

  if (incomingIdx > existingIdx) {
    merged.status = incomingStatus;
  }

  return merged;
}
```

---

## 📊 Updated API Flow

### New Lead Submission Flow (`POST /api/leads`)

```
1. Receive lead data from wizard
    ↓
2. SEARCH for existing lead:
   - By zoho_lead_id (if provided in URL)
   - By email
   - By phone (normalized)
   - By name (last resort)
    ↓
3. If found → UPDATE
   - Merge wizard data with existing data
   - Set status to "quoted"
   - If from Facebook → Set Lead_Status to "Hot - Qualified"
    ↓
   If not found → CREATE
   - New lead in both systems
    ↓
4. Detect if HOT LEAD (Facebook + wizard completed)
    ↓
5. Send appropriate notification:
   - Hot Lead → Priority notification to admin + team
   - Regular → Standard notification
    ↓
6. Return success
```

---

## 🔧 Environment Variables (New)

Add to `.env.local`:

```bash
# Team Telegram notification (for hot leads)
TELEGRAM_TEAM_CHAT_ID="-100xxxxxxxxxx"  # Optional: team group chat
```

---

## ✅ Implementation Checklist

### Phase 1: Zoho CRM Configuration (No Deployment)
- [ ] Create "Hot - Qualified" lead status in Zoho CRM
- [ ] Create email template for Facebook leads
- [ ] Create workflow rule for Facebook lead creation
- [ ] Test workflow with test Facebook lead

### Phase 2: Enhanced Lead Matching (Code Changes)
- [ ] Add `findExistingZohoLead()` to `src/lib/zoho.ts`
- [ ] Add `findExistingLead()` to `src/lib/supabase.ts`
- [ ] Update `POST /api/leads` to use new search functions
- [ ] Add phone normalization utility

### Phase 3: Hot Lead Detection & Stages
- [ ] Add `isHotLead()` detection function
- [ ] Update `mapToZohoFields()` to set Lead_Status
- [ ] Modify `updateZohoLead()` to accept options
- [ ] Test stage update with existing lead

### Phase 4: Enhanced Notifications
- [ ] Add `TELEGRAM_TEAM_CHAT_ID` env variable
- [ ] Add `sendHotLeadNotification()` function
- [ ] Update notification logic to detect hot leads
- [ ] Test with Facebook source lead

### Phase 5: Testing & Deployment
- [ ] Test complete flow: Facebook → Zoho → Email → Wizard → Update
- [ ] Verify duplicates are merged correctly
- [ ] Confirm hot lead notification works
- [ ] Deploy to Railway

---

## 🔗 References

- [Zoho CRM Facebook Integration](https://www.zoho.com/crm/facebook.html)
- [Configuring Workflow Rules](https://help.zoho.com/portal/en/kb/crm/automate-business-processes/workflow-management/articles/configuring-workflow-rules)
- [Zoho CRM Search Records API](https://www.zoho.com/crm/developer/docs/api/v8/search-records.html)
- [Zoho COQL API](https://www.zoho.com/crm/developer/docs/api/v8/COQL-Overview.html)
- [Duplicate Record Detection](https://help.zoho.com/portal/en/kb/crm/manage-crm-data/duplication-management/articles/check-duplicate-records)

---

## 📝 Notes

### Facebook Lead Ads Integration Options

1. **Zoho Social** - Native integration, requires Zoho Social subscription
2. **Zoho Lead Chain** - Dedicated Facebook Lead Ads connector
3. **Third-party** (Make, Zapier, LeadsBridge) - More flexibility, additional cost

### Phone Number Normalization

Malta phone formats to handle:
- `+356 7912 3456`
- `356 79123456`
- `79123456`
- `+356-7912-3456`

Normalize to: `35679123456` for matching.

### Name Matching Considerations

- Name matching is less reliable due to:
  - Typos
  - Nicknames (Joe vs Joseph)
  - Different name orders
- Use as last resort only
- Consider fuzzy matching for better results
