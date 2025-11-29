# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**GhawdeX Sales Portal** - AI-powered wizard that guides customers from curiosity to signed solar deal.

**URL:** https://get.ghawdex.pro
**GitHub:** https://github.com/ghawdexpro/ghawdex-sales-portal

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (project: kuoklfrqztafxtoghola)
- **AI:** OpenRouter API (gemini-2.0-flash-001)
- **Deployment:** Railway
- **Analytics:** GA4 + Facebook Pixel

## Development Commands

```bash
npm run dev          # Development server (http://localhost:3000)
npm run build        # Production build
npm start            # Start production server
npm run lint         # Run ESLint
```

## Project Architecture

### The Sales Journey (Wizard Flow)

```
Step 1: Location → Step 2: Consumption → Step 3: System → Step 4: Financing → Step 5: Contact → Step 6: Summary
```

Note: Step 5 (Contact) is skipped for users coming from Zoho CRM links with pre-filled data.

### Architecture

The wizard is a single-page app driven by `WizardContext` state (not URL routes). All steps render on `/` based on `state.step`.

**Key files:**
- `src/app/page.tsx` - Entry point, handles Zoho CRM URL params for pre-fill
- `src/components/wizard/WizardContext.tsx` - Central state management (useReducer)
- `src/components/wizard/WizardLayout.tsx` - Wrapper with progress bar
- `src/components/wizard/steps/Step[1-6]*.tsx` - Individual step components
- `src/lib/calculations.ts` - Solar pricing, savings, ROI calculations
- `src/lib/types.ts` - TypeScript interfaces (WizardState, Lead, SystemPackage, etc.)

**Integrations:**
- `src/lib/supabase.ts` - Lead storage
- `src/lib/zoho.ts` - Direct Zoho CRM API (OAuth2, create/update leads)
- `src/app/api/leads/route.ts` - Lead API (writes to both Supabase + Zoho in parallel)
- `src/app/api/solar/route.ts` - Google Solar API proxy

## Key Features

### 1. Wizard Navigation
- Progress bar showing current step
- Back/Next navigation
- State persistence (localStorage + Supabase)
- Mobile-responsive

### 2. AI Assistant
- OpenRouter integration (gemini-2.0-flash-001)
- Contextual help at each step
- Smart recommendations based on inputs

### 3. Solar Analysis
- Google Solar API integration
- Roof area calculation
- Production estimates
- Shading analysis

### 4. Pricing Engine
- All GhawdeX packages (5-20 kWp)
- Battery options (5-30 kWh)
- Grant vs No-Grant comparison
- 20-year ROI projection

### 5. Financing Calculator
- BOV loan calculator
- Monthly payment estimates
- Solar income vs payment comparison

### 6. Lead Capture (Dual-Write)
- **Supabase** - Primary database (backup)
- **Zoho CRM** - Sales team's CRM (direct API, no n8n)
- **Telegram** - Instant notifications
- Both systems written in parallel with `Promise.allSettled` (one failure doesn't block other)

### 7. Zoho CRM Pre-fill
Users from Zoho CRM emails can be sent with pre-filled data:
```
https://get.ghawdex.pro/?name=John&email=john@test.com&phone=79123456&zoho_id=12345
```
- Contact form (Step 5) is automatically skipped
- Lead updated in Zoho CRM on completion (not created new)

## Database Schema (Supabase)

### leads table
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contact
  name TEXT,
  email TEXT,
  phone TEXT,

  -- Property
  address TEXT,
  locality TEXT,
  property_type TEXT,
  roof_type TEXT,

  -- Qualification
  current_bill DECIMAL,
  timeline TEXT,
  goals TEXT[],

  -- Analysis
  roof_area_m2 DECIMAL,
  usable_area_m2 DECIMAL,
  annual_production_kwh DECIMAL,

  -- Selection
  system_size_kwp DECIMAL,
  battery_kwh DECIMAL,
  with_ems BOOLEAN DEFAULT FALSE,
  grant_path BOOLEAN,

  -- Pricing
  total_price DECIMAL,
  monthly_income DECIMAL,
  payback_years DECIMAL,

  -- Status
  status TEXT DEFAULT 'new',
  step_completed INTEGER DEFAULT 0,

  -- Metadata
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT
);
```

### deals table
```sql
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Deal details
  system_config JSONB,
  pricing JSONB,
  financing JSONB,

  -- Contract
  proposal_pdf_url TEXT,
  signature_status TEXT,
  signed_at TIMESTAMPTZ,

  -- Payment
  deposit_amount DECIMAL,
  deposit_paid BOOLEAN DEFAULT FALSE,
  deposit_paid_at TIMESTAMPTZ,

  -- Installation
  installation_date DATE,
  status TEXT DEFAULT 'pending'
);
```

## Environment Variables

See `.env.local` for all required variables.

**Required for production (Railway):**
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps/Solar API
- `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN` - Zoho CRM
- `ZOHO_API_DOMAIN=https://www.zohoapis.eu`, `ZOHO_ACCOUNTS_URL=https://accounts.zoho.eu`
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID` - Notifications
- `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_FB_PIXEL_ID` - Analytics

## Malta Solar Constants

```typescript
// Feed-in tariffs (20-year guarantee)
const GRANT_TARIFF = 0.105;      // €/kWh with grant
const NO_GRANT_TARIFF = 0.15;    // €/kWh without grant

// Production estimates
const MALTA_IRRADIANCE = 5.2;    // kWh/m²/day average
const PRODUCTION_FACTOR = 1.8;   // MWh/kWp/year

// Pricing
const PV_PRICE_PER_KWP = 750;    // € (average)
const BATTERY_PRICE_PER_KWH = 1000; // €
```

## Design Guidelines

- **Theme:** Dark (matching www.ghawdex.pro)
- **Primary color:** Solar gold/amber (#f59e0b)
- **Secondary:** Sky blue (#0284c7)
- **Cards:** Glassmorphism (bg-white/5, backdrop-blur)
- **Animations:** Framer Motion, subtle transitions

## Deployment

**Railway (always push manually - auto-deploy not working):**
```bash
git push origin main && railway up
```

**Set Railway variables:**
```bash
railway variables --set "KEY=value" --set "KEY2=value2"
railway variables --kv  # View all
```

## Business Documentation

All business docs are in `/docs/`:

| File | Purpose |
|------|---------|
| `GHAWDEX_PRODUCTS.md` | Product catalog & pricing |
| `GHAWDEX_FINANCING.md` | BOV loan calculator specs |
| `GRANT_OPTIMIZATION_STRATEGY.md` | Grant calculation strategy |
| `MALTA_ELECTRICITY_TARIFFS.md` | Enemalta tariff reference |
| `MALTA_SOLAR_KNOWLEDGE_BASE_COMPLETE.md` | Malta solar market knowledge |
| `QUICK_SALES_REFERENCE.md` | Sales talking points |
| `COMPANY_OVERVIEW.md` | Company profile |

## Related Projects

- **www.ghawdex.pro** - Main landing page
- **app.ghawdex.pro** - Solar scanner tool
- **portal.ghawdex.pro** - Employee portal
