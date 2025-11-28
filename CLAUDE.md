# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

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
STEP 1: Welcome → STEP 2: Property → STEP 3: Analysis → STEP 4: Recommend → STEP 5: Pricing → STEP 6: Finance → STEP 7: Deal
```

### Directory Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with analytics
│   ├── page.tsx            # Landing/entry point
│   ├── wizard/
│   │   ├── layout.tsx      # Wizard layout with progress
│   │   ├── step-1/         # Welcome & qualification
│   │   ├── step-2/         # Property details
│   │   ├── step-3/         # Roof analysis
│   │   ├── step-4/         # System recommendation
│   │   ├── step-5/         # Pricing & ROI
│   │   ├── step-6/         # Financing options
│   │   └── step-7/         # Deal & signature
│   └── api/
│       ├── ai/             # OpenRouter AI endpoints
│       ├── solar/          # Google Solar API
│       └── leads/          # Lead management
├── components/
│   ├── wizard/             # Wizard-specific components
│   ├── ui/                 # Reusable UI components
│   └── forms/              # Form components
├── lib/
│   ├── supabase.ts         # Supabase client
│   ├── openrouter.ts       # AI client
│   ├── solar-api.ts        # Google Solar API
│   ├── calculations.ts     # Solar calculations
│   └── analytics.ts        # GA4 + FB tracking
└── types/
    └── index.ts            # TypeScript types
```

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

### 6. Lead Capture
- Supabase storage
- Zoho CRM integration
- Telegram notifications
- n8n webhook triggers

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
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- GOOGLE_SOLAR_API_KEY
- OPENROUTER_API_KEY
- NEXT_PUBLIC_GA4_ID
- NEXT_PUBLIC_FB_PIXEL_ID

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

**Railway:**
```bash
# Link to project (run interactively)
railway link

# Deploy
railway up

# Add custom domain
railway domain get.ghawdex.pro
```

**DNS (Namecheap):**
```
Type     Host    Value
CNAME    get     [railway-url].up.railway.app
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
