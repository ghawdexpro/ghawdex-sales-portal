# GhawdeX Sales Portal - Development Status

**Last Updated:** 2025-11-26
**Repository:** `/Users/maciejpopiel/ghawdex-sales-portal/`
**Live URL:** https://get.ghawdex.pro
**Hosting:** Railway (auto-deploys from GitHub main branch)

---

## Current State: DEPLOYED ✅

All grant calculations verified against REWS 2025 official rates.
**Pricing optimized** to maximize battery grant (80-95% vs 50% PV).
Live at https://get.ghawdex.pro

---

## Completed Features (Nov 26 - Session 2)

### 11. Show Both Grant Variants in Step 3
- **Commit:** `16c38b8`
- **Files Changed:** `src/components/wizard/steps/Step3System.tsx`
- Shows both income variants (with/without grant) stacked on each system card
- Primary income in green, alternative in amber below

### 12. Disable WhatsApp Overlay
- **Commit:** `16c38b8`
- **Files Changed:** `src/app/layout.tsx`
- Disabled floating WhatsApp button that was covering wizard navigation

### 13. Enhanced WhatsApp CTA on Summary
- **Commit:** `a2027ee`
- **Files Changed:** `src/components/wizard/steps/Step6Summary.tsx`
- Prominent green gradient box with "Ready to Go Solar?"
- Large WhatsApp button to fast-track installation

### 14. Fix Grant Double-Counting Bug
- **Commit:** `537e6bf`
- **Files Changed:** `src/lib/types.ts`
- Removed HYBRID_INVERTER_FOR_BATTERY grant that was incorrectly added on top of PV_HYBRID_INVERTER
- Was causing prices like €400 for 5kWp+10kWh (should be €2,200-€3,175)

### 15. Fix Gozo Battery Max Cap
- **Commit:** `7c2bb6f`
- **Files Changed:** `src/lib/types.ts`
- Changed Gozo battery maxTotal from €7,200 to €8,550 (per REWS 2025)

### 16. Optimize Pricing for Maximum Grant
- **Commit:** `bd82cf1`
- **Files Changed:** `src/lib/types.ts`
- Lowered PV prices (50% grant) to shift value to battery (80-95% grant)
- PV: 3kWp €1,500 | 5kWp €2,000 | 10kWp €4,000 | 15kWp €6,000
- Battery: 5kWh €4,000 | 10kWh €7,500 | 15kWh €10,500

---

## REWS 2025 Grant Rates (Verified)

| Component | Rate | Limit | Max |
|-----------|------|-------|-----|
| PV (hybrid inverter) | 50% | €750/kWp | €3,000 |
| Battery Malta | 80% | €720/kWh | €7,200 |
| Battery Gozo | 95% | €720/kWh | €8,550 |
| **Total Malta** | - | - | **€10,200** |
| **Total Gozo** | - | - | **€11,550** |

### FIT Rates
- With grant: €0.105/kWh (20 years)
- Without grant: €0.15/kWh (20 years)

### Customer Prices (5kWp + 10kWh) - OPTIMIZED
| Location | Gross | Grant | Customer Pays |
|----------|-------|-------|---------------|
| Malta | €9,500 | €7,000 | **€2,500** |
| Gozo | €9,500 | €8,125 | **€1,375** |

*Gozo at €1,375 for 5kWp + 10kWh battery system!*

---

## Completed Features (Nov 26 - Session 1)

### 6. Business Bill Presets
- **Commit:** `525bdc9`
- **Files Changed:**
  - `src/components/wizard/steps/Step2Consumption.tsx` - Added business-specific bill presets

**What it does:**
- Changed "Biz" label to "Business" for clarity
- When business is selected, shows higher bill presets (€300-4000+) with business descriptions
- Resets bill selection when switching between residential/business modes

---

### 7. Annual Income (not Savings)
- **Commit:** `3ae8595`
- **Files Changed:**
  - `src/components/wizard/steps/Step3System.tsx`

**What it does:**
- Changed "Est. Annual Savings" to "Est. Annual Income"
- Shows income = total production × FIT rate
- Shows FIT rate below income value
- When grant is selected, shows comparison: "Without grant: €X/yr @ €0.15"

---

### 8. Single Phase Hint
- **Commit:** `84ce67c`
- **Files Changed:**
  - `src/components/wizard/steps/Step3System.tsx`

**What it does:**
- Added "Max for single phase" hint in blue on Essential 5kW package

---

### 9. Sticky Grant Selector
- **Commit:** `3ee5039`
- **Files Changed:**
  - `src/components/wizard/steps/Step3System.tsx`

**What it does:**
- Moved grant scheme selector to sticky bottom bar
- Customer can toggle No Grant / Solar Only / + Battery while viewing systems
- All prices update in real-time as grant type changes

---

### 10. Sticky Price Summary
- **Commit:** `71e9a31`
- **Files Changed:**
  - `src/components/wizard/steps/Step3System.tsx`

**What it does:**
- Moved Total Price + Annual Income to sticky bottom bar
- Shows grant amount inline ("After €3,000 grant")
- Shows "without grant" comparison inline
- Full sticky bar now contains: Price Summary → Grant Selector → Nav Buttons

---

### 1. Grant Calculation Fix
- **Commit:** `f9cfe91`
- **Files Changed:**
  - `src/lib/types.ts` - Updated `calculateGrantAmount()` to apply 50% cap on PV grants
  - `src/lib/calculations.ts` - Pass actual prices to grant calculation
  - `src/components/wizard/steps/Step3System.tsx` - Battery toggle auto-switches grant type

**What it does:**
- When battery toggle ON → auto-switch to `pv_battery` grant
- When battery toggle OFF → switch back to `pv_only` grant
- Grant now properly capped at 50% of system cost (no more "free" systems)

---

### 2. Mobile-Friendly Updates
- **Commit:** `6fc75de`
- **Files Changed:**
  - `src/app/page.tsx` - Responsive hero, stats, trust badges
  - `src/components/wizard/steps/Step2Consumption.tsx` - Mobile grids
  - `src/components/wizard/steps/Step3System.tsx` - Mobile/desktop layouts for system cards
  - `src/components/wizard/steps/Step1Location.tsx` - Mobile text sizes

**What it does:**
- All grids responsive (1 col mobile, 3 col desktop)
- Touch-friendly buttons
- Scaled fonts and spacing

---

### 3. Product Catalog Page
- **Commit:** `fb60f65`
- **Files Changed:**
  - `src/app/products/page.tsx` - NEW FILE (complete product catalog)
  - `src/app/page.tsx` - Added link to products page

**What it does:**
- Browse all products at `/products`
- Filter by category (Solar, Battery, Bundle, Add-ons)
- Filter by home size and budget
- Product cards with specs, pricing, annual income
- "Get Quote" buttons link to wizard

---

### 4. Hero Logo Update
- **Commit:** `a54fe22`
- **Files Changed:**
  - `src/app/page.tsx` - Replaced icon with actual GhawdeX logo

**What it does:**
- Uses `/logo/Ghawdex engineering logo.svg`
- Large display (96px mobile, 160px desktop)
- Glowing amber backdrop effect

---

### 5. Wizard Header Cleanup
- **Commit:** `10666ab`
- **Files Changed:**
  - `src/components/wizard/WizardLayout.tsx` - Merged header with progress

**What it does:**
- Removed cramped logo from wizard header
- Single clean bar with X button and centered progress steps
- More compact and focused design

---

## File Structure

```
/Users/maciejpopiel/ghawdex-sales-portal/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Homepage with wizard
│   │   ├── products/
│   │   │   └── page.tsx          # Product catalog
│   │   ├── api/
│   │   │   ├── leads/route.ts    # Lead submission API
│   │   │   └── solar/route.ts    # Google Solar API
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── wizard/
│   │       ├── WizardContext.tsx # State management
│   │       ├── WizardLayout.tsx  # Header + progress bar
│   │       └── steps/
│   │           ├── Step1Location.tsx    # Map pin placement
│   │           ├── Step2Consumption.tsx # Bill/household input
│   │           ├── Step3System.tsx      # System + battery selection
│   │           ├── Step4Financing.tsx   # Payment options
│   │           ├── Step5Contact.tsx     # Contact form
│   │           └── Step6Summary.tsx     # Final summary
│   └── lib/
│       ├── types.ts           # Types + grant calculation
│       ├── calculations.ts    # Pricing, savings, payback
│       ├── analytics.ts       # GA4 + FB Pixel tracking
│       └── google/
│           └── maps-service.ts # Google Maps loader
├── public/
│   └── logo/
│       └── Ghawdex engineering logo.svg
└── package.json
```

---

## Deployment Info

**GitHub Repo:** https://github.com/ghawdexpro/ghawdex-sales-portal
**Branch:** main
**Railway Project:** ghawdex-sales-portal
**Environment:** production

### To Deploy
```bash
cd /Users/maciejpopiel/ghawdex-sales-portal
git add -A
git commit -m "Your message"
git push
# Railway auto-deploys from GitHub
```

### To Force Deploy
```bash
cd /Users/maciejpopiel/ghawdex-sales-portal
railway up
```

---

## Environment Variables (Railway)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `GOOGLE_SOLAR_API_KEY`
- `NEXT_PUBLIC_GA4_ID`
- `NEXT_PUBLIC_FB_PIXEL_ID`

---

## Next Steps / TODO

### Completed ✅
- [x] Test all wizard flows on mobile
- [x] Test business bill presets (Step 2)
- [x] Test sticky grant selector (Step 3)
- [x] Verify grant calculations are correct (REWS 2025)
- [x] Fix grant double-counting bug
- [x] Fix Gozo battery max cap
- [x] Create sales team infographics (17 cheat sheets)
- [x] Document all REWS 2025 grant rules
- [x] Battery-only grant documentation

### Nice to Have (Not Blocking)
- [ ] Product images on /products page
- [ ] Testimonials section
- [ ] FAQ section
- [ ] Reposition WhatsApp button (currently disabled - covers nav)

---

## Recovery Commands

If something breaks:

```bash
# Check status
cd /Users/maciejpopiel/ghawdex-sales-portal
git status
git log --oneline -10

# Rollback to previous commit
git revert HEAD

# Check Railway
railway status
railway logs

# Force redeploy
railway up
```
