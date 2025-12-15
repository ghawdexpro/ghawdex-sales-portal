# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**GhawdeX Sales Portal** - AI-powered wizard that guides customers from property inquiry to solar installation quote.

- **Live:** https://get.ghawdex.pro
- **Purpose:** Capture qualified solar leads with system specs and financing options
- **Architecture:** Dual-write (Supabase + Zoho CRM in parallel)
- **Database:** Supabase `epxeimwsheyttevwtjku` (unified with backoffice)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router), TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Supabase PostgreSQL |
| CRM | Zoho CRM (EU region, OAuth2) |
| Maps | Google Maps + Solar API |
| AI | Gemini 2.0 Flash (OpenRouter) |
| Avatar | HeyGen Streaming Avatar |
| Notifications | Telegram 3-tier system |
| Analytics | GA4 + Facebook Pixel |

## Development Commands

```bash
npm run dev          # Dev server (localhost:3000)
npm run build        # Production build
git push origin main # Deploy (Railway auto-deploys)
railway logs         # Monitor deployment
```

## Wizard Flow

Single-page, context-driven (not route-based):

```
Step 1: Location     → Address + Map (detect Gozo/Malta)
Step 2: Consumption  → Bill amount + Google Solar API
Step 3: System       → Package (3-15 kWp) + battery option
Step 4: Financing    → Cash vs BOV loan
Step 5: Contact      → SKIPPED if pre-filled from Zoho
Step 6: Summary      → Review + Submit
```

**State Management:** Central `WizardContext` with `useReducer` (13 action types)

## Key Features

| Feature | Description |
|---------|-------------|
| **Dual-Write** | Supabase + Zoho CRM in parallel (`Promise.allSettled`) |
| **Zoho Pre-fill** | Links like `?name=John&email=...&zoho_id=123` skip Step 5 |
| **Solar Analysis** | Google Solar API for roof area, panel count |
| **Battery-Only** | Toggle for customers with existing PV |
| **Avatar Chat** | `/avatar` - Voice consultation with AI "Anthony" |
| **Session Recovery** | Resume paused sessions via `/avatar/resume/[token]` |

## Key Modules

| Module | Purpose |
|--------|---------|
| `src/lib/calculations.ts` | Pricing, ROI, grant calculations |
| `src/lib/types.ts` | TypeScript interfaces, package definitions |
| `src/lib/zoho.ts` | Zoho CRM API with OAuth2 |
| `src/lib/supabase.ts` | Database client |
| `src/lib/telegram/` | 3-tier notification routing |
| `src/lib/avatar/` | HeyGen avatar conversation engine |
| `src/lib/sms/` | SMS client (Vodacom) |
| `src/lib/email/` | Email service with templates |
| `src/lib/wizard-session.ts` | Session persistence for abandoned leads |

## Cron Jobs

| Route | Purpose |
|-------|---------|
| `/api/cron/avatar-auto-save` | Auto-save avatar sessions |
| `/api/cron/avatar-session-recovery` | Recover abandoned sessions |
| `/api/cron/customer-follow-ups` | Follow-up email automation |
| `/api/cron/email-sequences` | Automated email sequences |
| `/api/cron/follow-up-reminders` | Reminder system |
| `/api/cron/wizard-session-cleanup` | Clean old sessions |

## API Routes

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/leads` | POST | Create lead (Supabase + Zoho + Telegram) |
| `/api/solar` | GET | Google Solar API proxy |
| `/api/avatar/message` | POST | Avatar conversation handler |
| `/api/telegram-event` | POST | Event tracking |
| `/api/partial-leads` | POST | Capture abandoned wizard data |
| `/api/upload/bill` | POST | Customer bill uploads |
| `/api/unsubscribe` | GET | Email unsubscribe |

## Telegram 3-Tier System

| Tier | Env Var | Purpose |
|------|---------|---------|
| `admin` | `TELEGRAM_ADMIN_CHAT_ID` | Critical events (CEO/CTO) |
| `team` | `TELEGRAM_TEAM_CHAT_ID` | Actionable items (Operations) |
| `everything` | `TELEGRAM_EVERYTHING_CHAT_ID` | Full audit log (Developers) |

See [TRACKING_AND_NOTIFICATIONS.md](../ghawdex%20overlord/TRACKING_AND_NOTIFICATIONS.md) for routing matrix.

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

# Zoho CRM (EU)
ZOHO_CLIENT_ID
ZOHO_CLIENT_SECRET
ZOHO_REFRESH_TOKEN
ZOHO_API_DOMAIN=https://www.zohoapis.eu

# Google APIs
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
GOOGLE_SOLAR_API_KEY

# Telegram (3-tier)
TELEGRAM_BOT_TOKEN
TELEGRAM_ADMIN_CHAT_ID
TELEGRAM_TEAM_CHAT_ID
TELEGRAM_EVERYTHING_CHAT_ID

# HeyGen Avatar
HEYGEN_API_KEY

# Analytics
NEXT_PUBLIC_GA4_ID
NEXT_PUBLIC_FB_PIXEL_ID
```

## Pricing Model

**Source of Truth:** `src/lib/types.ts`

See [PRICING_AND_GRANTS.md](docs/PRICING_AND_GRANTS.md) for complete pricing rules.

### Key Rules
1. All prices are **GROSS** (VAT 18% included)
2. Inverter cost **ALWAYS** included in package or battery price
3. Bundle discount via `priceWithBattery` when buying PV + Battery
4. Grant = `min(actualPrice × percentage, maxCap)` - NOT per-kWh cap

### Grant Scheme (REWS 2025)

| Type | Malta | Gozo | Max |
|------|-------|------|-----|
| PV (hybrid) | 50% | 50% | €3,000 |
| Battery | 80% | 95% | €7,200 / €8,550 |
| Inverter (retrofit) | 80% | 80% | €1,800 |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Leads not in Zoho | Check Telegram first, verify `ZOHO_REFRESH_TOKEN` |
| Solar API fallback | Check Google Cloud quotas, geocoding must succeed |
| Supabase 403 | Check RLS policies allow anonymous INSERT |
| Pre-fill not updating | Verify `zoho_id` param, check if converted to Contact |
| Telegram not sending | Check all 3 chat ID env vars |

## Key Files

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Main wizard entry |
| `src/components/wizard/WizardContext.tsx` | State management |
| `src/components/wizard/steps/Step*.tsx` | Wizard steps |
| `src/app/avatar/page.tsx` | Avatar chat interface |
| `src/lib/avatar/conversation-engine.ts` | Dialogue state machine |
| `src/app/api/leads/route.ts` | Lead capture endpoint |

## Business Docs

Key docs in `/docs/`:
- `REWS_GRANT_RULES_REFERENCE.md` - Grant calculations
- `BATTERY_ONLY_GRANT_COMPLETE_GUIDE.md` - Battery retrofit rules
- `GHAWDEX_PRODUCTS.md` - Product catalog
- `infographics/` - 17 visual sales cheat sheets

## Integration with Backoffice

After wizard completion:
1. Lead created in Supabase + Zoho CRM
2. Backoffice AI Agent (Max) takes over via WhatsApp/SMS
3. Max can request DB (fusebox) photo for upsell analysis
4. Extras (Salva Vita, OVR, DB upgrade) added to quote
5. Quote + contract generation with extras in backoffice

See `ghawdex-backoffice/docs/DB_PHOTO_UPSELL_MASTER_PLAN.md` for extras system.

## Related Projects

- **Backoffice:** `ghawdex-backoffice` - Lead processing, quotes, contracts, extras
- **Landings:** `ghawdex landings` - www.ghawdex.pro landing page
- **Overlord:** `ghawdex overlord` - Coordination hub
