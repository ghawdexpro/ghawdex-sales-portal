# GhawdeX Sales Portal - get.ghawdex.pro

## Vision
**AI-powered sales walkthrough** that guides customers from curiosity to signed deal in one session.

Not a traditional webshop - more like a **personal solar consultant** that:
- Understands their needs
- Analyzes their property
- Recommends the right system
- Shows exact pricing & ROI
- Handles financing options
- Generates contract for signature

---

## Core Concept: The AI Journey

### Flow Overview
```
ENTRY → QUALIFY → ANALYZE → RECOMMEND → PRICE → FINANCE → SIGN
```

### Step 1: Entry & Qualification
- "Tell me about your home" (conversational)
- Property type (house/apartment/farmhouse)
- Location (Malta/Gozo - which locality)
- Roof type (flat/pitched/mixed)
- Current electricity bill (rough)
- Goals (save money / independence / environment)

### Step 2: Property Analysis
- Enter address OR upload Google Maps screenshot
- AI analyzes roof using Google Solar API
- Shows 3D visualization of their roof
- Calculates available space
- Identifies shading issues

### Step 3: Smart Recommendation
- AI recommends optimal system size
- Explains WHY this size (based on their inputs)
- Shows production estimates
- Compares with/without battery

### Step 4: Pricing & ROI
- Real-time pricing from our catalog
- Grant vs No-Grant comparison
- 20-year profit projection
- Interactive calculator (adjust system size)
- Monthly income visualization

### Step 5: Financing Options
- Cash purchase
- BOV loan calculator (monthly payments)
- Show "solar income vs loan payment" comparison
- Pre-qualification check (optional)

### Step 6: Deal & Signature
- Generate personalized proposal PDF
- Digital signature (DocuSign/similar)
- Payment deposit option
- Booking installation date
- Welcome email with next steps

---

## Tech Stack Proposal

### Frontend
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS v4** (matching ghawdex landings style)
- **Framer Motion** (smooth transitions between steps)
- **React Hook Form** (form handling)

### AI / Chat Interface
- **Vercel AI SDK** (streaming chat)
- **OpenRouter** (we have keys - grok-4-fast or claude)
- OR **Anthropic API** directly for Claude

### Backend / Data
- **Supabase** (new project for leads/deals)
- **Google Solar API** (roof analysis)
- **Google Maps API** (address lookup)

### Signatures & Documents
- **DocuSign** OR **SignWell** OR **PandaDoc**
- **React-PDF** (generate proposals)

### Payments (Optional)
- **Stripe** (deposits)

### Deployment
- **Railway** (new project)
- **GitHub** (new repo: ghawdex-sales-portal)

---

## UI/UX Approach

### Style Direction
Two options:

**Option A: Chat-First Interface**
- Full-screen chat with AI assistant
- Assistant guides through steps
- Cards/forms appear inline in chat
- Very conversational, feels like WhatsApp

**Option B: Wizard with AI Helper**
- Step-by-step wizard (like TurboTax)
- AI assistant in sidebar/corner
- More structured, less conversational
- Progress bar visible

**Option C: Hybrid (Recommended)**
- Start with chat-style qualification
- Transition to visual steps for analysis/pricing
- AI available throughout as helper
- Best of both worlds

### Visual Theme
- Dark theme (matching www.ghawdex.pro)
- Solar gold/amber accents
- Glassmorphism cards
- Smooth animations
- Mobile-first (many users come from WhatsApp)

---

## Data We Need to Collect

### Lead Information
- [ ] Name
- [ ] Phone (WhatsApp)
- [ ] Email
- [ ] Property address
- [ ] Property type
- [ ] Roof details
- [ ] Current bill estimate
- [ ] Timeline (when they want solar)

### Deal Information
- [ ] Selected system size
- [ ] With/without battery
- [ ] With/without EMS
- [ ] Grant or no-grant path
- [ ] Financing choice
- [ ] Total price
- [ ] Signature status
- [ ] Deposit paid (if applicable)

---

## Integration Points

### Existing Systems
- [ ] Connect to existing Solar Scan analysis
- [ ] Push leads to Google Sheets (existing)
- [ ] Send to n8n for automation
- [ ] Notify via Telegram bot

### New Integrations Needed
- [ ] E-signature service
- [ ] PDF generation
- [ ] Calendar booking (installation slot)
- [ ] Payment processing (optional)

---

## MVP Features (Phase 1)

**Must Have:**
1. Conversational qualification flow
2. Address lookup + basic roof info
3. System recommendation engine
4. Price calculator (all packages)
5. Grant vs No-Grant comparison
6. BOV financing calculator
7. Lead capture to Supabase
8. PDF proposal generation
9. WhatsApp/email follow-up trigger

**Nice to Have (Phase 2):**
- Digital signature integration
- Deposit payment
- Calendar booking
- Full 3D roof visualization
- AI chat throughout (not just qualification)

---

## Project Setup Checklist

### GitHub
- [ ] Create new repo: `ghawdex-sales-portal`
- [ ] Initialize Next.js 15 project
- [ ] Set up TypeScript + Tailwind v4
- [ ] Add to GitHub

### Railway
- [ ] Create new Railway project
- [ ] Link to GitHub repo
- [ ] Set up environment variables
- [ ] Configure custom domain: get.ghawdex.pro

### Supabase
- [ ] Create new Supabase project (or use existing?)
- [ ] Design leads table
- [ ] Design deals table
- [ ] Set up RLS policies

### DNS (Namecheap)
- [ ] Add CNAME for get.ghawdex.pro → Railway

### Environment Variables
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google
GOOGLE_MAPS_API_KEY=
GOOGLE_SOLAR_API_KEY=

# AI
OPENROUTER_API_KEY=

# Analytics
NEXT_PUBLIC_GA4_ID=G-2SZNR72JNF
NEXT_PUBLIC_FB_PIXEL_ID=809814008544994

# Notifications
TELEGRAM_BOT_TOKEN=
N8N_WEBHOOK_URL=
```

---

## Questions to Decide

1. **Chat-first or Wizard-first?** (Option A, B, or C above)

2. **AI Provider?**
   - OpenRouter (grok-4-fast) - we have keys
   - Anthropic Claude direct
   - OpenAI GPT-4

3. **E-signature service?**
   - DocuSign (enterprise, expensive)
   - SignWell (simpler, cheaper)
   - PandaDoc (good for proposals)
   - Skip for MVP?

4. **Use existing Solar Scan Supabase or new?**
   - Existing: `epxeimwsheyttevwtjku.supabase.co`
   - New project for clean separation

5. **Payment deposits in MVP?**
   - Yes (Stripe)
   - No (handle offline)

6. **Calendar integration?**
   - Calendly embed
   - Custom booking system
   - Manual (call to book)

---

## Timeline Estimate

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Setup | 1 day | Repo, Railway, basic Next.js |
| UI Framework | 2-3 days | Layout, theme, navigation |
| Qualification Flow | 2-3 days | Chat interface, lead capture |
| Analysis Integration | 2-3 days | Google Solar API, roof display |
| Pricing Engine | 2-3 days | All packages, calculator |
| PDF Generation | 1-2 days | Proposal document |
| Testing & Polish | 2-3 days | Mobile, animations, bugs |
| **Total MVP** | **~2 weeks** | |

---

## Next Steps

1. **Confirm approach** (chat vs wizard vs hybrid)
2. **Create GitHub repo**
3. **Set up Railway project**
4. **Initialize Next.js project**
5. **Start building!**

---

*Let's build the future of solar sales!*
