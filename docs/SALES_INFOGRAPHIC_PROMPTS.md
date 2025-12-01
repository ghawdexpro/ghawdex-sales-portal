# Sales Infographic Prompts for Google NanoBanana Pro

**Purpose:** Ready-to-use prompts to generate sales infographics and cheat sheets
**Tool:** Google NanoBanana Pro
**Usage:** Copy each prompt, paste into NanoBanana, generate, download

---

## SECTION A: COMPLETE SYSTEM WORKFLOW

### A1: Full Customer Journey (End-to-End)

```
Create an infographic showing the complete GhawdeX customer journey from lead to installation:

PHASE 1: LEAD CAPTURE (get.ghawdex.pro)
├─ Customer enters address on wizard
├─ AI analyzes roof with Google Solar API
├─ System recommends size (5-20 kWp)
├─ Grant calculated automatically
├─ Customer submits contact details
└─ Lead saved to: Supabase + Zoho CRM + Telegram alert

PHASE 2: SALES PROCESS (Backoffice)
├─ Lead appears in pipeline as "NEW"
├─ Sales team contacts customer
├─ Bill upload link sent to customer
├─ AI extracts consumption from bill (Gemini)
├─ Quote generated with exact pricing
└─ Status: NEW → CONTACTED → QUOTED

PHASE 3: APPROVAL & CONTRACT
├─ Customer reviews quote
├─ Site visit scheduled if needed
├─ Contract generated with e-signature
├─ Customer uploads ID card
├─ Customer signs electronically
├─ Deposit paid via Stripe
└─ Status: QUOTED → SITE_VISIT → APPROVED

PHASE 4: INSTALLATION
├─ REWS Part A application (instant approval)
├─ Materials ordered
├─ Installation team assigned
├─ 14-day installation guarantee
├─ Enemalta inspection
├─ Grid connection activated
└─ Status: INSTALLATION → COMPLETED

PHASE 5: HANDOVER
├─ REWS Part B submitted
├─ Grant paid to customer (4-6 weeks)
├─ Monitoring app activated
├─ 10-year warranty begins
└─ Customer earning €0.105/kWh for 20 years!

Style: Vertical flowchart with icons, green color scheme
Show 7 pipeline stages as colored badges
Include time estimates for each phase
```

---

### A2: Data Flow Architecture (Technical)

```
Create a technical diagram showing how data flows between GhawdeX systems:

THREE-SYSTEM ARCHITECTURE:

SYSTEM 1: SALES PORTAL (get.ghawdex.pro)
├─ Next.js 15 + Supabase
├─ Project: lccebuetwhezxpviyfrs
├─ Captures: address, bill, system selection, contact
└─ Outputs: Lead record + Telegram notification

    ↓ [Instant] POST /api/leads
    ↓ [Hourly] Zoho Sync

SYSTEM 2: ZOHO CRM (zohoapis.eu)
├─ EU region, OAuth2 authentication
├─ Leads & Contacts modules
├─ Custom fields for solar data
├─ Sales team's daily workspace
└─ MASTER for conflicts (Zoho wins)

    ↓ [Hourly] Bidirectional sync
    ↓ [Daily 01:00] Portal backup sync

SYSTEM 3: BACKOFFICE (ghawdex-backoffice)
├─ Next.js + Supabase
├─ Project: kuoklfrqztafxtoghola
├─ Dashboard, documents, contracts
├─ Bill analysis (Gemini AI)
└─ Payment processing (Stripe)

SYNC PATHS:
Path A: Portal → Zoho → Backoffice (Primary, hourly)
Path B: Portal → Backoffice (Backup, daily)
Path C: Bill Upload → AI → Lead Match → Zoho (Reactive)

Style: Technical flowchart with database icons
Show sync frequencies
Color code each system differently
```

---

### A3: Simple 7-Stage Pipeline

```
Create a horizontal pipeline infographic:

GHAWDEX LEAD PIPELINE - 7 STAGES

1. NEW (Gray)
   Lead captured from portal or manual entry
   Action: Contact within 24 hours

2. CONTACTED (Blue)
   Sales team reached out
   Action: Send bill upload link

3. QUOTED (Blue)
   Quote generated and sent
   Action: Follow up in 3 days

4. SITE_VISIT (Yellow)
   Physical assessment scheduled
   Action: Confirm appointment

5. APPROVED (Orange)
   Customer accepted quote
   Action: Generate contract

6. INSTALLATION (Green)
   System being installed
   Action: Track progress daily

7. COMPLETED (Light Green)
   Installation finished
   Action: Submit REWS Part B

Show as colored circles connected by arrows
Add lead count placeholder in each stage
Include "CANCELLED" as exit path (red)
```

---

## SECTION B: SALES TEAM DAILY WORKFLOWS

### B1: New Lead Checklist

```
Create a checklist infographic for handling new leads:

TITLE: New Lead - First 24 Hours Checklist

STEP 1: REVIEW LEAD DATA ⏱️ 5 min
□ Check source (Portal / Manual / Zoho)
□ Verify contact details (phone, email)
□ Note location (Malta or Gozo - affects grant!)
□ Review system selection from wizard
□ Check if pre-filled from Zoho (zoho_id exists)

STEP 2: PREPARE FOR CALL ⏱️ 5 min
□ Calculate exact grant amount
□ Check monthly bill estimate
□ Prepare system recommendation
□ Have financing options ready (BOV 0.5%)

STEP 3: FIRST CONTACT ⏱️ 10 min
□ Call within 24 hours (critical!)
□ Confirm interest and timeline
□ Verify property details
□ Ask about current electricity provider
□ Schedule follow-up if needed

STEP 4: SEND BILL UPLOAD LINK ⏱️ 2 min
□ Generate upload token from backoffice
□ Send WhatsApp/email with link
□ Explain what we need (ARMS bill, both pages)
□ Set 7-day reminder

STEP 5: UPDATE STATUS ⏱️ 1 min
□ Change status: NEW → CONTACTED
□ Add notes about conversation
□ Set next action date
□ Telegram confirms update

Total time: ~25 minutes per lead
Goal: Contact ALL new leads within 24 hours

Style: Clean checklist with time estimates
Add checkbox icons
Green header, white background
```

---

### B2: Bill Upload & Analysis Flow

```
Create a flowchart for the bill analysis process:

TITLE: Bill Upload & AI Analysis Workflow

CUSTOMER SIDE:
1. Receives WhatsApp/email with unique link
2. Clicks link: get.ghawdex.pro/upload/[token]
3. Takes photos of ARMS/Enemalta bill (both pages)
4. Uploads images
5. Sees confirmation message

SYSTEM SIDE:
1. Images uploaded to Supabase Storage
   └─ Private 'bills' bucket with signed URLs

2. Gemini Vision AI analyzes images
   └─ Extracts: customer name, ARMS account,
      meter number, address, consumption kWh,
      locality, monthly bill amount

3. Auto-Match to Existing Lead
   Priority matching:
   ├─ 1. Meter number (exact)
   ├─ 2. ARMS account number
   ├─ 3. Name + address
   ├─ 4. Name + email
   └─ 5. Email only (fallback)

4. Lead Updated or Created
   └─ Consumption data filled automatically

5. Sync to Zoho CRM
   └─ Bill images attached to lead record

6. Notifications Sent
   ├─ Telegram: 📄 "Bill Received"
   └─ Telegram: ✅ "Bill Analyzed - Match Found"

SALES ACTION:
✓ Review AI extraction accuracy
✓ Verify consumption matches bill
✓ Generate quote with real data
✓ Call customer to discuss

Style: Vertical flowchart with two lanes (Customer / System)
Show AI brain icon for analysis step
Green checkmarks for success states
```

---

### B3: Quote Generation Cheat Sheet

```
Create a quick reference for generating quotes:

TITLE: Quote Generation - Quick Reference

STEP 1: VERIFY DATA
□ Customer name and address correct
□ Consumption data from bill (not estimate)
□ Location confirmed (Malta/Gozo)
□ Property type noted

STEP 2: SELECT SYSTEM
Based on consumption:
├─ 3,000-5,000 kWh/year → 5 kWp
├─ 5,000-8,000 kWh/year → 8-10 kWp
├─ 8,000-15,000 kWh/year → 10-15 kWp
└─ 15,000+ kWh/year → 15-20 kWp

STEP 3: ADD BATTERY (Optional)
├─ 5 kWh - Small homes, basic backup
├─ 10 kWh - Most popular, good balance
└─ 15 kWh - Large homes, max independence

STEP 4: SELECT GRANT PATH
□ With Grant: 50% PV + 80%/95% battery
  └─ FIT rate: €0.105/kWh for 20 years
□ Without Grant: No subsidy
  └─ FIT rate: €0.15/kWh for 20 years
  └─ Faster payback (2.8 vs 4 years)

STEP 5: GENERATE DOCUMENTS
From backoffice dashboard:
1. Click "Generate Quote"
2. Select template
3. Review pricing
4. Download PDF
5. Send to customer

QUICK PRICE LOOKUP (After Grant):
| System | Malta | Gozo |
|--------|-------|------|
| 5kWp only | €1,875 | €1,875 |
| 5kWp + 10kWh | €2,500 | €1,375 |
| 10kWp + 10kWh | €3,500 | €2,375 |
| 10kWp + 15kWh | €5,300 | €3,950 |

Style: Compact reference card format
Color-coded sections
Print-friendly A5 size
```

---

## SECTION C: GRANT CALCULATION VISUALS

### C1: Three-Way Cap Explainer

```
Create an infographic explaining the grant calculation:

TITLE: How Grant is Calculated - The Three Caps

YOUR GRANT = THE SMALLEST OF THESE THREE:

CAP 1: PER-UNIT RATE 📏
├─ PV System: €750 per kWp
├─ Battery: €720 per kWh
└─ Example: 10kWh × €720 = €7,200

CAP 2: PERCENTAGE OF PRICE 📊
├─ PV: 50% of system price
├─ Battery Malta: 80% of battery price
├─ Battery Gozo: 95% of battery price
└─ Example: €7,500 × 80% = €6,000

CAP 3: MAXIMUM TOTAL 🔒
├─ PV: €3,000 maximum
├─ Battery Malta: €7,200 maximum
├─ Battery Gozo: €8,550 maximum
└─ Total Malta: €10,200 max
└─ Total Gozo: €11,550 max

EXAMPLE CALCULATION:
10kWh Battery at €7,500 in Malta:
├─ Cap 1: 10 × €720 = €7,200
├─ Cap 2: €7,500 × 80% = €6,000 ← LOWEST!
├─ Cap 3: €7,200 max
└─ GRANT = €6,000

Customer pays: €7,500 - €6,000 = €1,500

Visual: Three funnels merging, smallest wins
Use calculator/math icons
Show the "winner" cap highlighted
```

---

### C2: Malta vs Gozo Quick Comparison

```
Create a side-by-side comparison:

MALTA 🇲🇹 vs GOZO 🏝️

BATTERY GRANT:
Malta: 80% coverage
Gozo: 95% coverage ⭐ +15%

MAXIMUM BATTERY GRANT:
Malta: €7,200
Gozo: €8,550 ⭐ +€1,350

10KWH BATTERY CUSTOMER COST:
Malta: €1,500
Gozo: €375 ⭐ 75% LESS!

PV GRANT:
Malta: 50% (max €3,000)
Gozo: 50% (max €3,000) - Same

TOTAL MAX GRANT:
Malta: €10,200
Gozo: €11,550 ⭐ +€1,350

WHY GOZO GETS MORE:
✓ Island energy independence
✓ Submarine cable reliability issues
✓ Government Gozo development policy

SALES TIP:
"In Gozo, the government covers 95% of your battery - you pay just €375 for a €7,500 system!"

Style: Split screen, Malta left (blue), Gozo right (green/gold)
Make Gozo side visually "winning"
Star icons on better deals
```

---

### C3: Customer Cost Quick Lookup Table

```
Create a pricing table infographic:

TITLE: What Will Customer Pay? (After Grant)

BATTERY ONLY:
┌─────────┬─────────┬────────────┬────────────┐
│ Battery │ Price   │ Malta Pays │ Gozo Pays  │
├─────────┼─────────┼────────────┼────────────┤
│ 5 kWh   │ €4,000  │ €800       │ €400       │
│ 10 kWh  │ €7,500  │ €1,500     │ €375 ⭐    │
│ 15 kWh  │ €10,500 │ €3,300     │ €1,950     │
└─────────┴─────────┴────────────┴────────────┘

PV ONLY (with grant):
┌─────────┬─────────┬────────────┐
│ System  │ Price   │ After Grant│
├─────────┼─────────┼────────────┤
│ 3 kWp   │ €2,950  │ €1,475     │
│ 5 kWp   │ €3,750  │ €1,875     │
│ 10 kWp  │ €7,500  │ €4,500     │
│ 15 kWp  │ €11,250 │ €8,250     │
└─────────┴─────────┴────────────┘

PV + BATTERY BUNDLES:
┌───────────────┬─────────┬────────────┬────────────┐
│ System        │ Price   │ Malta Pays │ Gozo Pays  │
├───────────────┼─────────┼────────────┼────────────┤
│ 5kWp + 5kWh   │ €5,750  │ €1,800     │ €1,400     │
│ 5kWp + 10kWh  │ €9,500  │ €2,500     │ €1,375 ⭐  │
│ 10kWp + 10kWh │ €11,500 │ €3,500     │ €2,375     │
│ 10kWp + 15kWh │ €14,500 │ €5,300     │ €3,950     │
│ 15kWp + 15kWh │ €17,750 │ €7,550     │ €6,200     │
└───────────────┴─────────┴────────────┴────────────┘

Highlight best deals with stars
Green background for Gozo column
Print-ready format
```

---

## SECTION D: ELIGIBILITY & DECISION TREES

### D1: Can Customer Get Grant? Flowchart

```
Create a decision tree flowchart:

TITLE: Grant Eligibility - Quick Check

START: What does customer want?

→ PV (Solar Panels):
  └─ Had PV grant since 2010?
     ├─ YES: ❌ NOT ELIGIBLE (permanent)
     │       But CAN get battery grant!
     └─ NO: ✅ ELIGIBLE
            50% grant, max €3,000

→ Battery Storage:
  └─ Had battery grant in last 6 years?
     ├─ YES: ❌ NOT ELIGIBLE
     │       Wait until 6 years pass
     └─ NO: ✅ ELIGIBLE
            ├─ Malta: 80%, max €7,200
            └─ Gozo: 95%, max €8,550

→ Both PV + Battery:
  └─ Check each separately
     └─ Can get one without the other!

IMPORTANT RULES:
⚠️ PV grant since 2010 = NEVER eligible again
⚠️ Battery grant = 6 year cooling off
✓ Different grant types are independent
✓ Gozo location = automatic 95% battery

Style: Flowchart with clear YES/NO paths
Red for ineligible, green for eligible
Include the "since 2010" rule prominently
```

---

### D2: Property Eligibility Checklist

```
Create a checklist infographic:

TITLE: Is This Property Eligible? ✓

BASIC REQUIREMENTS:
□ Residential property (house, apartment, penthouse, farmhouse, maisonette)
□ Located in Malta or Gozo
□ Customer is owner OR tenant with landlord consent
□ Active Enemalta grid connection
□ Valid Maltese ID or residence permit

FOR PV GRANT:
□ NO PV grant received since 2010 (any property!)
□ Roof suitable for installation
□ No major shading issues
□ Structural capacity for panels
□ Using REWS-registered installer ✓ GhawdeX

FOR BATTERY GRANT:
□ NO battery grant in last 6 years
□ Minimum 2.5 kWh capacity
□ From approved manufacturer list
□ Professional installation required

GOZO 95% BONUS:
□ Property address is in Gozo or Comino
□ Utility bill shows Gozo address
□ NOT a Malta resident's vacation home
→ Automatic upgrade to 95% battery grant!

DISQUALIFYING FACTORS:
✗ Commercial property (separate scheme)
✗ Government/social housing (check rules)
✗ Under construction (must be habitable)
✗ Illegal structures (no permit)

Style: Checklist with icons
Green checks, red X marks
GhawdeX logo at bottom
```

---

## SECTION E: CONTRACT & PAYMENT FLOW

### E1: Contract Signing Process

```
Create a flowchart for contract signing:

TITLE: Electronic Contract Signing Flow

SALES TEAM ACTIONS:

1. Generate Contract
   └─ Click "Create Contract" in backoffice
   └─ Select customer and quote
   └─ System generates PDF

2. Approve Contract
   └─ Review terms and pricing
   └─ Click "Approve" to enable sending
   └─ Status: pending_approval → approved

3. Send to Customer
   └─ Customer receives email with unique link
   └─ Link valid for 7 days
   └─ Status: approved → sent

CUSTOMER ACTIONS:

4. View Contract
   └─ Click link in email
   └─ Read full contract PDF
   └─ Status: sent → viewed

5. Upload ID Card
   └─ Take photo of ID (front + back)
   └─ Upload through secure form
   └─ Status: viewed → id_uploaded

6. Sign Electronically
   └─ Draw signature on screen
   └─ Timestamp recorded
   └─ Status: id_uploaded → signed

7. Pay Deposit
   └─ Redirected to Stripe checkout
   └─ Pay deposit amount (30-50%)
   └─ Status: signed → deposit_paid

COMPLETION:
└─ Telegram notification: 💰 "Payment Received"
└─ Installation scheduling begins
└─ Customer receives confirmation

Style: Two-lane flowchart (Sales Team / Customer)
Show status badges at each step
Green checkmarks for completed steps
```

---

### E2: Payment Collection Cheat Sheet

```
Create a quick reference for payments:

TITLE: Payment Collection - Quick Guide

DEPOSIT AMOUNTS:
├─ Standard: 30% of total price
├─ Large systems (>€10k): 40%
└─ Custom: As negotiated

PAYMENT METHODS:

1. STRIPE (Recommended)
   ✓ Credit/debit cards
   ✓ Instant confirmation
   ✓ Automatic receipt
   ✓ Webhook updates status

   How: Contract page → "Pay Deposit" button

2. BANK TRANSFER
   Account: [Bank details]
   Reference: Customer name + Quote number
   ⚠️ Manual status update required

3. BOV LOAN
   ✓ 0.5% interest first 3 years
   ✓ Up to €50,000
   ✓ 15 year term max
   ✓ No collateral needed

   Process:
   1. Customer applies at BOV
   2. BOV approves (1-2 weeks)
   3. Loan disbursed to GhawdeX
   4. Mark as paid in system

AFTER PAYMENT:
□ Verify payment received
□ Update contract status → deposit_paid
□ Send confirmation to customer
□ Schedule installation
□ Order materials
□ Assign installation team

Style: Quick reference card
Icon for each payment method
BOV highlighted as recommended for large purchases
```

---

## SECTION F: OBJECTION HANDLING CARDS

### F1: Top 5 Objections Response Cards

```
Create 5 response cards for common objections:

CARD 1: "It's too expensive"
─────────────────────────────
RESPONSE:
"I understand the concern. Let me show you the real numbers:
- Government grant covers 50-95% of the cost
- With BOV financing at 0.5%, your monthly payment is €33 for a 5kWp system
- Your solar income is €113/month
- You PROFIT €80/month from day one!
- No upfront payment required with BOV loan"

KEY POINTS:
✓ Grant covers most of cost
✓ €0 down payment option
✓ Positive cash flow immediately
✓ ROI in 2-4 years

CARD 2: "I'll wait for better technology"
─────────────────────────────
RESPONSE:
"Solar panel efficiency improves only 0.5% per year. Waiting 3 years means:
- Losing €2,800+ in solar income
- Grant funds may run out
- Electricity prices keep rising
- Today's panels last 25+ years and are already 22%+ efficient"

KEY POINTS:
✓ Marginal improvements only
✓ Opportunity cost is real
✓ Current tech is excellent
✓ 25-year panel lifespan

CARD 3: "What if I sell my house?"
─────────────────────────────
RESPONSE:
"Solar actually INCREASES your property value! Buyers pay premium for:
- €3,000+ guaranteed annual income
- Lower electricity bills
- Green energy credentials
- The system transfers with the property - it's an asset, not a cost"

KEY POINTS:
✓ Increases home value
✓ Attractive to buyers
✓ Investment, not expense
✓ Transfers with sale

CARD 4: "I need to think about it"
─────────────────────────────
RESPONSE:
"Of course, it's an important decision. While you think:
- Grant funds are limited (€10.3M budget)
- Once funds run out, no more grants until next year
- I can send you our detailed quote to review
- Would Tuesday be a good time to discuss any questions?"

KEY POINTS:
✓ Respect the decision
✓ Create urgency (limited funds)
✓ Offer information
✓ Schedule follow-up

CARD 5: "I'm not sure about the grant process"
─────────────────────────────
RESPONSE:
"We handle ALL the paperwork for you:
- Part A application: We submit, instant approval same day
- Installation: Done in 14 days
- Part B application: We prepare everything
- Grant payment: Directly to your bank in 4-6 weeks
You don't need to visit any government office!"

KEY POINTS:
✓ We do all paperwork
✓ Instant Part A approval
✓ No office visits needed
✓ Grant paid to customer

Style: Card format with clear headers
Speech bubble for response
Bullet points for key arguments
Print on A6 cards for sales team
```

---

## SECTION G: ONE-PAGE CHEAT SHEETS

### G1: Ultimate Sales Cheat Sheet (Print Ready)

```
Create a comprehensive one-page cheat sheet:

═══════════════════════════════════════════════
       GHAWDEX SALES CHEAT SHEET 2025
═══════════════════════════════════════════════

GRANT RATES:
┌───────────┬────────┬────────┐
│ Component │ Malta  │ Gozo   │
├───────────┼────────┼────────┤
│ PV        │ 50%    │ 50%    │
│ Battery   │ 80%    │ 95% ⭐ │
├───────────┼────────┼────────┤
│ Max Total │€10,200 │€11,550 │
└───────────┴────────┴────────┘

PER-UNIT CAPS:
• PV: €750/kWp (max €3,000)
• Battery: €720/kWh (max €7,200/€8,550)

CUSTOMER COSTS (After Grant):
┌────────────┬────────┬────────┐
│ Battery    │ Malta  │ Gozo   │
├────────────┼────────┼────────┤
│ 5 kWh      │ €800   │ €400   │
│ 10 kWh     │ €1,500 │ €375 ⭐│
│ 15 kWh     │ €3,300 │ €1,950 │
└────────────┴────────┴────────┘

KEY NUMBERS:
• FIT rate: €0.105/kWh (with grant)
• FIT rate: €0.15/kWh (no grant)
• Production: 1,800 kWh/kWp/year
• Payback: 2-4 years
• BOV loan: 0.5% (first 3 years)
• Installation: 14 days

ELIGIBILITY BLOCKERS:
❌ PV grant since 2010 = NO PV grant ever
❌ Battery grant <6 years ago = NO battery
✅ Can get battery if had PV (different type)

PIPELINE STAGES:
NEW → CONTACTED → QUOTED → SITE_VISIT → APPROVED → INSTALLATION → COMPLETED

QUICK OBJECTION RESPONSES:
"Too expensive" → Grant 50-95%, BOV €0 down
"Wait for tech" → Losing €900+/year waiting
"Might move" → Increases property value
"Not sure" → We handle ALL paperwork

SYSTEM RECOMMENDATIONS BY BILL:
• €50-80/month → 5 kWp
• €80-120/month → 8-10 kWp
• €120-200/month → 10-15 kWp
• €200+/month → 15-20 kWp

CONTACT:
📞 +356 7905 5156
📧 info@ghawdex.pro
🌐 ghawdex.pro | get.ghawdex.pro

═══════════════════════════════════════════════

Style: Compact, dense information
Print-ready A4 format
Color sections for easy scanning
Laminate for daily use
```

---

### G2: Gozo Special Deals Card

```
Create a Gozo-focused promotional card:

╔═══════════════════════════════════════════════╗
║     🏝️ GOZO EXCLUSIVE OFFERS 🏝️              ║
║     Government Covers 95% of Battery!         ║
╠═══════════════════════════════════════════════╣
║                                               ║
║  10kWh BATTERY SYSTEM                         ║
║  ────────────────────                         ║
║  Normal Price:     €7,500                     ║
║  Government Grant: €7,125 (95%)               ║
║  ══════════════════════════                   ║
║  YOU PAY ONLY:     €375                       ║
║                                               ║
║  That's less than ONE electricity bill        ║
║  for a system that lasts 15+ years!           ║
║                                               ║
╠═══════════════════════════════════════════════╣
║  COMPLETE SYSTEMS:                            ║
║  ┌─────────────────┬──────────┐               ║
║  │ 5kWp + 10kWh    │ €1,375   │               ║
║  │ 10kWp + 10kWh   │ €2,375   │               ║
║  │ 10kWp + 15kWh   │ €3,950   │               ║
║  └─────────────────┴──────────┘               ║
║                                               ║
║  WHY GOZO GETS MORE:                          ║
║  ✓ Island energy independence                 ║
║  ✓ Submarine cable reliability                ║
║  ✓ Government commitment to Gozo              ║
║                                               ║
║  ⚡ LIMITED FUNDING - €10.3M BUDGET           ║
║  ⚡ APPLY BEFORE FUNDS RUN OUT!               ║
║                                               ║
╚═══════════════════════════════════════════════╝

Style: Premium offer card
Gold/green color scheme
Large numbers for price
Urgency messaging at bottom
```

---

## SECTION H: TELEGRAM NOTIFICATION REFERENCE

### H1: Notification Types Guide

```
Create a reference card for Telegram notifications:

TITLE: Telegram Notifications - What They Mean

LEAD NOTIFICATIONS:
🆕 NEW LEAD
   Manual entry in backoffice
   Action: Contact within 24 hours

🌐 LEAD FROM PORTAL
   Customer completed wizard on get.ghawdex.pro
   Action: Contact immediately (hot lead!)

📄 BILL RECEIVED
   Customer uploaded ARMS/Enemalta bill
   Action: Check backoffice for images

✅ BILL ANALYZED
   AI extracted consumption data
   Action: Review accuracy, generate quote

DOCUMENT NOTIFICATIONS:
📋 QUOTE SENT
   Quote emailed to customer
   Action: Follow up in 3 days

✍️ CONTRACT SIGNED
   Customer signed electronically
   Action: Verify ID upload, await payment

💰 PAYMENT RECEIVED
   Stripe deposit confirmed
   Action: Schedule installation

REMINDER NOTIFICATIONS:
⏰ REMINDER SENT
   Bill upload reminder to customer
   Action: None (automatic)

⚠️ FOLLOW-UP NEEDED
   Manual action required
   Action: Check backoffice for details

ERROR NOTIFICATIONS:
❌ ERROR
   System error occurred
   Action: Check logs, contact support

All notifications include links to:
• Backoffice dashboard
• Zoho CRM record
• Customer detail page

Style: Reference card with emoji legend
Group by notification type
Include action for each
```

---

## USAGE INSTRUCTIONS

### How to Use These Prompts

1. **Copy the entire prompt** including all text and formatting
2. **Paste into Google NanoBanana Pro**
3. **Generate** the infographic
4. **Customize** colors to match GhawdeX brand
5. **Download** in high resolution (PNG or PDF)
6. **Print** for sales team or use digitally

### GhawdeX Brand Colors
- Primary Green: #22c55e
- Dark Green: #15803d
- White: #ffffff
- Dark text: #1f2937
- Accent Gold: #f59e0b (for Gozo highlights)

### Recommended Outputs
- **Cheat Sheets**: Print A4, laminate for durability
- **Flowcharts**: Large format for office wall
- **Cards**: A6 size for pocket reference
- **Social Media**: 1080x1080 square format

---

*Prompts created for GhawdeX sales team - December 2025*
*Based on Sales Portal + Backoffice workflow analysis*
