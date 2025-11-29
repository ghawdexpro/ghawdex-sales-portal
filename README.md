# GhawdeX Sales Portal

AI-powered wizard that guides customers from curiosity to signed solar deal.

**Live:** https://get.ghawdex.pro

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** Supabase
- **AI:** OpenRouter API (Gemini 2.0 Flash)
- **Deployment:** Railway
- **Analytics:** GA4 + Facebook Pixel

## The Sales Journey

```
Step 1: Location    → Pin your property on map
Step 2: Consumption → Enter electricity bill
Step 3: System      → Choose solar package + battery
Step 4: Financing   → Cash or BOV loan options
Step 5: Contact     → Enter details
Step 6: Summary     → Review & download proposal
```

## Features

- Google Solar API integration for roof analysis
- Malta/Gozo grant calculations (REWS 2025 scheme)
- Dual pricing: PV-only vs PV+Battery bundles
- BOV loan calculator
- 20-year ROI projections
- PDF proposal generation
- **Dual-write lead capture:** Supabase + Zoho CRM (parallel writes)
- **Telegram notifications** for every new lead
- **Zoho CRM pre-fill links** - skip contact form for CRM campaigns
- **Lead-to-Contact conversion handling** - auto-detects converted leads

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # Production build
```

## Environment Variables

Required in `.env.local`:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Google APIs
GOOGLE_SOLAR_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# Zoho CRM
ZOHO_CLIENT_ID=
ZOHO_CLIENT_SECRET=
ZOHO_REFRESH_TOKEN=
ZOHO_API_DOMAIN=https://www.zohoapis.eu
ZOHO_ACCOUNTS_URL=https://accounts.zoho.eu

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_CHAT_ID=

# AI
OPENROUTER_API_KEY=

# Analytics
NEXT_PUBLIC_GA4_ID=
NEXT_PUBLIC_FB_PIXEL_ID=
```

## Deployment

```bash
railway up
```

## Related

- [www.ghawdex.pro](https://www.ghawdex.pro) - Main landing page
- [app.ghawdex.pro](https://app.ghawdex.pro) - Solar scanner tool
