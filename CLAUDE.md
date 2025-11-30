# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**GhawdeX Sales Portal** - AI-powered interactive wizard that guides customers from property inquiry to signed solar installation deal.

- **Live:** https://get.ghawdex.pro
- **GitHub:** https://github.com/ghawdexpro/ghawdex-sales-portal
- **Purpose:** Capture qualified solar leads with complete system specifications and financing options
- **Key Feature:** Dual-write architecture (Supabase + Zoho CRM in parallel)
- **Backoffice Integration:** Zoho CRM syncs to backoffice hourly; Sales Portal Supabase syncs nightly as backup

## Tech Stack

- **Framework:** Next.js 15 (App Router, Server Components)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (PostgreSQL) - project: `lccebuetwhezxpviyfrs`
- **CRM:** Zoho CRM (EU region) with OAuth2 token refresh
- **Maps:** Google Maps API + Google Solar API (roof analysis)
- **AI:** OpenRouter API (Gemini 2.0 Flash)
- **Notifications:** Telegram Bot API (real-time lead alerts)
- **Analytics:** GA4 + Facebook Pixel
- **Deployment:** Railway (manual push required)

## Development Commands

```bash
npm run dev          # Development server (http://localhost:3000)
npm run build        # Production build (checks type errors)
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Architecture Overview

### The Sales Journey (Wizard Flow)

**Single-page, context-driven** (NOT route-based):

```
/ Entry point
├─ Detect Zoho CRM pre-fill params (?name=, ?email=, ?zoho_id=)
├─ Initialize WizardContext with state
└─ Render step based on state.step

Step 1: Location      → Address + Map (Google Maps, detect Gozo/Malta)
Step 2: Consumption   → Electricity bill + Solar API analysis (Google Solar)
Step 3: System        → Choose package (5-20 kWp) + battery option
Step 4: Financing     → Cash vs BOV loan (monthly payment calc)
Step 5: Contact       → SKIPPED if pre-filled from Zoho CRM
Step 6: Summary       → Review + Submit to Supabase + Zoho CRM
```

**State Management:**
- Central `WizardContext` using `useReducer` (13 action types)
- All wizard data persisted to Supabase on form submission
- Automatic Zoho CRM update via `POST /api/leads`
- For pre-filled leads from Zoho: Step 5 is automatically skipped, and lead is UPDATED (not created new)

### Key Files & Architecture

**Entry Point:**
- `src/app/page.tsx` - Main wizard component
  - Parses Zoho CRM URL params: `?name=John&email=john@example.com&phone=123&zoho_id=12345`
  - Sets `isPrefilledLead=true` to skip Step 5 and trigger UPDATE in Zoho

**State Management:**
- `src/components/wizard/WizardContext.tsx` - Central `useReducer` for all wizard state
  - Actions: SET_STEP, SET_ADDRESS, SET_SYSTEM, SET_CALCULATIONS, SET_PREFILL, RESET
  - All step components dispatch actions to update state
- `src/components/wizard/WizardLayout.tsx` - Wrapper with progress bar and navigation

**Wizard Steps:**
- `src/components/wizard/steps/Step[1-6]*.tsx` - Individual step components
  - Each step validates input and dispatches state updates

**Business Logic:**
- `src/lib/calculations.ts` - Solar pricing & ROI calculations
  - Feed-in tariffs: €0.105/kWh (with grant), €0.15/kWh (no grant)
  - 20-year projections with inflation assumptions
  - Battery payback calculations
  - Malta vs Gozo pricing differences
- `src/lib/types.ts` - TypeScript interfaces
  - `WizardState` - Full wizard state shape
  - `SystemPackage` - Product catalog (5-20 kWp options)
  - `Lead` - Customer record for Supabase + Zoho

**Integrations:**
- `src/lib/supabase.ts` - Supabase client
  - Functions: `createLead()`, `updateLead()`, `getLeadByZohoId()`
  - Anon key for public read/write (RLS policies handle security)
- `src/lib/zoho.ts` - Zoho CRM API client
  - OAuth2 token refresh with 1-hour cache expiry
  - `createOrUpdateZohoLead()` handles both new and existing leads
  - Detects if lead was converted to Contact and updates Contact instead
- `src/lib/google/maps-service.ts` - Google Maps + Solar API
  - Geocoding, roof area calculation, sunlight hours
  - Fallback calculations if Solar API unavailable
- `src/app/api/leads/route.ts` - Lead capture endpoint
  - POST: Dual-write to Supabase + Zoho in parallel (`Promise.allSettled`)
  - Telegram notification fires even if one system fails
- `src/app/api/solar/route.ts` - Google Solar API proxy
  - Called from Step 2 to get roof analysis (area, sunlight hours, panel count)

## Data Flow

### Primary Path: Real-time Lead Capture
```
Customer submits form (Step 6)
    ↓
POST /api/leads (route.ts)
    ├─ Supabase: createLead() or updateLead()
    ├─ Zoho CRM: createOrUpdateZohoLead() [OAuth2]
    ├─ Telegram: Send admin notification
    └─ GA4: Track "lead_generated" event
```

### Backup Path: Nightly Backoffice Sync
```
Backoffice cron job (01:00 UTC daily)
    ↓
Reads Sales Portal Supabase (service role key)
    ├─ Transforms field names
    ├─ Deduplicates by zoho_lead_id, email, or portal_id
    └─ Inserts/updates into Backoffice Supabase
```

**Note:** Backoffice also syncs directly from Zoho CRM via hourly cron (separate sync)

## Key Features

### 1. Dual-Write Lead Capture
- **Supabase** - Primary database for lead storage
- **Zoho CRM** - Sales team's CRM (direct API with OAuth2)
- **Telegram** - Instant admin notifications for every lead
- **Parallel writes:** `Promise.allSettled` ensures one failure doesn't block the other
- **Resilient notifications:** Telegram fires even if Supabase or Zoho fails (uses fallback data)

### 2. Zoho CRM Pre-filled Links
Sales team can send pre-populated wizard links to customers:
```
https://get.ghawdex.pro/?name=John&email=john@test.com&phone=79123456&zoho_id=12345
```
- Automatically skips Step 5 (Contact form)
- Sets `isPrefilledLead=true` flag
- Lead is UPDATED in Zoho CRM (not created new)
- Detects if lead was converted to Contact and updates Contact instead
- Business rule: Only convert Leads to Contacts after customer signs contract

### 3. Solar Analysis
- **Google Solar API:** Roof area, panel count, sunlight hours
- **Fallback calculations:** If API unavailable, uses defaults based on address location
- Returns detailed solar potential data for ROI projections

### 4. Pricing & Financing Engine
- **System packages:** 5-20 kWp (configurable in `calculations.ts`)
- **Battery options:** 5-30 kWh with separate pricing
- **Grant comparison:** REWS 2025 scheme vs no-grant tariffs
- **BOV loan calculator:** Monthly payment estimates with interest rates
- **20-year ROI projections:** Net present value calculations with inflation

### 5. Analytics & Tracking
- **GA4 events:** Step transitions, lead generation, system selection
- **Facebook Pixel:** Lead conversion tracking
- **Session duration:** TimeTracker component monitors engagement

## Database Schema (Supabase)

### leads table
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contact
  name TEXT,
  email TEXT,
  phone TEXT,

  -- Location
  address TEXT,
  coordinates JSONB,

  -- Consumption
  household_size INTEGER,
  monthly_bill NUMERIC,
  consumption_kwh NUMERIC,
  roof_area NUMERIC,

  -- System Selection
  selected_system TEXT,
  system_size_kw NUMERIC,
  with_battery BOOLEAN DEFAULT false,
  battery_size_kwh NUMERIC,
  grant_path BOOLEAN DEFAULT true,

  -- Financing
  payment_method TEXT,
  loan_term INTEGER,

  -- Calculated Values
  total_price NUMERIC,
  monthly_payment NUMERIC,
  annual_savings NUMERIC,

  -- Metadata
  notes TEXT,
  zoho_lead_id VARCHAR(50),
  status TEXT DEFAULT 'new',
  source TEXT DEFAULT 'sales-portal'
);
```

## Common Development Tasks

### Adding a New Wizard Step
1. Create `src/components/wizard/steps/StepN*.tsx`
2. Add new state fields to `WizardState` in `src/lib/types.ts`
3. Add new action type to `WizardAction` in `WizardContext.tsx`
4. Add reducer case in `wizardReducer()` function
5. Render step in `page.tsx` based on `state.step` value

### Testing Zoho CRM Integration
1. Fill out wizard form and submit
2. Check Telegram notification in admin chat (confirms lead was captured)
3. Log into Zoho CRM and search for the customer's email to verify lead was created
4. For pre-filled links: Verify lead was UPDATED (not duplicated)
5. Browser DevTools > Network tab: Check `POST /api/leads` response for errors

### Debugging Google Solar API
- Solar API called in Step 2 when address is entered
- `solarDataIsFallback` flag indicates fallback was used
- Check `solarPotential` object in state: maxArrayPanelsCount, maxArrayAreaMeters2, yearlyEnergyDcKwh
- If API fails, fallback calculations use fixed assumptions (check `maps-service.ts`)

### Modifying Pricing or Solar Constants
1. All constants in `src/lib/calculations.ts`
2. Edit values (tariffs, grant amounts, production factors)
3. Run `npm run build` to validate
4. Test with different inputs in dev server
5. Deploy with `railway up`

### Adding Analytics Events
1. Import `trackEvent()` from `src/lib/analytics.ts`
2. Call: `trackEvent('event_name', { param1: value1 })`
3. View in Google Analytics dashboard (24-hour delay)
4. Parameters should match GA4 event schema

## Environment Variables

See `.env.local` for all required variables.

**Supabase:**
- `NEXT_PUBLIC_SUPABASE_URL` - Database URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon key for public access

**Zoho CRM (OAuth2):**
- `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`
- `ZOHO_API_DOMAIN=https://www.zohoapis.eu` (EU region)
- `ZOHO_ACCOUNTS_URL=https://accounts.zoho.eu` (token refresh)

**Google APIs:**
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Maps + Solar API
- `GOOGLE_SOLAR_API_KEY` - (may be same as above)

**Telegram (optional - lead notifications):**
- `TELEGRAM_BOT_TOKEN` - Bot API token
- `TELEGRAM_ADMIN_CHAT_ID` - Chat ID for admin alerts

**OpenRouter (optional - AI assistant):**
- `OPENROUTER_API_KEY` - API key for Gemini 2.0 Flash

**Analytics:**
- `NEXT_PUBLIC_GA4_ID` - Google Analytics property ID
- `NEXT_PUBLIC_FB_PIXEL_ID` - Facebook Pixel ID

## Deployment

**Railway (manual push required):**
```bash
git push origin main
/opt/homebrew/bin/railway up    # Use full path or: railway up
```

**Set Railway environment variables:**
```bash
railway variables --set "KEY=value" --set "KEY2=value2"
railway variables --kv          # View all variables
```

## Troubleshooting

### Leads not appearing in Zoho CRM
- Check Telegram notification first (if it succeeded, lead was captured)
- Verify `ZOHO_REFRESH_TOKEN` is valid (expires after 365 days)
- Check `POST /api/leads` response in DevTools for error
- Zoho API might be temporarily down (check https://status.zoho.com)

### Google Solar API returning fallback data
- Fallback is used if API times out (usually < 1 second timeout)
- Address must be successfully geocoded first in Step 1
- Check Google Cloud project quotas and billing in GCP console
- Solar API might have hitting daily quota (unlikely - we have very low usage)

### Supabase RLS Policy errors
- If getting 403 on insert/update, check RLS in Supabase dashboard
- Portal uses anon key - RLS must allow anonymous INSERT/UPDATE
- Settings > Authentication > Policies should allow public access for leads table

### Pre-filled lead not updating in Zoho
- Verify `zoho_id` parameter is passed correctly in URL
- Check if lead was converted to Contact in Zoho (system auto-detects and updates Contact)
- Verify `isPrefilledLead` flag is set to `true` in state
- Check API response for "converted to contact" message

### Telegram notifications not being sent
- Verify `TELEGRAM_BOT_TOKEN` and `TELEGRAM_ADMIN_CHAT_ID` are set
- Check Railway logs: `railway logs` for errors
- Telegram API might be blocked in deployment region
- Notifications are non-blocking - system continues even if Telegram fails

## Malta Solar Constants

Reference values in `src/lib/calculations.ts`:

```typescript
// Feed-in tariffs (20-year guaranteed)
const GRANT_TARIFF = 0.105;         // €/kWh with REWS 2025 grant
const NO_GRANT_TARIFF = 0.15;       // €/kWh without grant

// Solar production estimates
const MALTA_IRRADIANCE = 5.2;       // kWh/m²/day average annual
const PRODUCTION_FACTOR = 1.8;      // MWh/kWp/year
const PANEL_DEGRADATION = 0.005;    // 0.5% per year

// Equipment pricing (per unit)
const PV_PRICE_PER_KWP = 750;       // € (average)
const BATTERY_PRICE_PER_KWH = 1000; // €

// Grant amounts (REWS 2025)
const GRANT_PV_ONLY = 2400;         // Max €2,400 for PV
const GRANT_WITH_BATTERY = 1200;    // Reduced for battery bundles

// Enemy alta tariffs (residential)
const MONTHLY_FIXED = 3.50;         // €/month
const PEAK_TARIFF = 0.18;           // €/kWh (08:00-23:00)
const OFFPEAK_TARIFF = 0.11;        // €/kWh (23:00-08:00)
```

## Related Projects

- **Backoffice:** `/Users/maciejpopiel/ghawdex-backoffice` - Receives leads, processes quotes
- **www.ghawdex.pro** - Main landing page (separate repo)
- **app.ghawdex.pro** - Solar scanner tool (separate repo)

## Business Documentation

All business docs in `/docs/`:

| File | Purpose |
|------|---------|
| `GHAWDEX_PRODUCTS.md` | Product catalog & pricing |
| `GHAWDEX_FINANCING.md` | BOV loan calculator specs |
| `GRANT_OPTIMIZATION_STRATEGY.md` | REWS 2025 grant logic |
| `MALTA_ELECTRICITY_TARIFFS.md` | Enemalta tariff reference |
| `MALTA_SOLAR_KNOWLEDGE_BASE_COMPLETE.md` | Market knowledge |
| `QUICK_SALES_REFERENCE.md` | Sales talking points |
| `COMPANY_OVERVIEW.md` | Company profile |
