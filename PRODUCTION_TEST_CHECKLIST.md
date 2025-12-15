# Production Testing Checklist
**GhawdeX Sales Portal** • December 10, 2025

## Automated Pre-Flight Checks ✅

- ✅ **Production site**: https://get.ghawdex.pro (HTTP 200, loads in ~1.1s)
- ✅ **Railway deployment**: Active (production environment)
- ✅ **Recent commits**: 27 commits deployed in last 24 hours

---

## Quick Smoke Test (5 minutes)

### Test 1: Basic Wizard Flow
- [ ] Open https://get.ghawdex.pro
- [ ] Type "Valletta" → Click suggestion → **Map zooms** ✅
- [ ] Click on map → Marker appears ✅
- [ ] Continue through all 7 steps
- [ ] Download PDF → **No text cutoff** ✅
- [ ] Check Telegram → **Notification received** ✅

---

## Critical Path Testing (30 minutes)

### Flow 1: Malta Solar + Battery (With Grant)

**Step 1 - Location:**
- [ ] Search "Sliema" → Click → **Map zooms**
- [ ] Click rooftop → **Marker placed**
- [ ] Continue → **Solar analysis completes**

**Step 2 - Consumption:**
- [ ] **Verify defaults**: Household=4+, Bill=€180-250 ✅
- [ ] Continue

**Step 3 - System:**
- [ ] Select "6 kWp" package
- [ ] Toggle "Add Battery" → Select "10 kWh"
- [ ] Select "With Government Grant"
- [ ] **Verify**: Total price, grant amount display
- [ ] Continue

**Step 4 - Financing:**
- [ ] **Verify deposit**: 50% or €799 (e.g., €2,800 → €1,400) ✅
- [ ] Select "BOV Financing" → "5 years"
- [ ] **Verify loan terms**: 2 cols mobile, 4 cols desktop ✅
- [ ] Continue

**Step 5-6:**
- [ ] Skip bill upload
- [ ] Enter contact info
- [ ] Continue

**Step 7 - Summary:**
- [ ] Click "View Contract Proposal"
- [ ] **PDF Preview**: No overlap, footer wraps ✅
- [ ] Click "Download PDF"
- [ ] **Open PDF**: Verify header, footer, no cutoff ✅

**Backend Verification:**
- [ ] Supabase: Check `leads` table for new entry
- [ ] Zoho CRM: Search by email → **Lead created** ✅
- [ ] Telegram: **3 channels** (everything, team) received notification ✅

---

### Flow 2: Gozo Battery-Only (95% Grant)

**Step 1:** Select Victoria, Gozo location
**Step 3:** Toggle "Battery Only" → Select battery
- [ ] **Verify purple theme** (not amber) ✅
- [ ] **Verify 95% grant** (Gozo) ✅

**Step 7:** Download PDF
- [ ] **Verify title**: "Battery Storage Proposal" ✅
- [ ] **Verify footer**: 3 lines, no cutoff ✅

---

### Flow 3: Progress Bar Navigation

**Test Clickable Steps:**
1. [ ] Complete Steps 1, 2, 3 (reach Step 4)
2. [ ] **Hover over Step 2** (green) → **Scales up** ✅
3. [ ] **Click Step 2** → **Jumps back** ✅
4. [ ] **Verify data persisted** (selections retained) ✅
5. [ ] Continue forward → **Changes propagate** ✅

**Test Non-Clickable:**
- [ ] Click Step 5 (future) → **Nothing happens** ✅
- [ ] Click Step 4 (current) → **Nothing happens** ✅

---

## Mobile Testing (20 minutes)

### iPhone SE (375px) - Critical

**Open on iPhone SE:**

**Step 2:**
- [ ] **Household buttons**: 3 columns (not 5 cramped) ✅
- [ ] **Bill presets**: Fit width ✅

**Step 4:**
- [ ] **Hero price**: text-2xl (not too large) ✅
- [ ] **Payment cards**: Stacked (not side-by-side) ✅
- [ ] **Loan terms**: 2 columns (not 4) ✅
- [ ] **Financial summary**: Stacked ✅
- [ ] **Bottom nav**: Safe area padding ✅
- [ ] **No horizontal scroll** ✅

**Step 7:**
- [ ] **PDF modal**: Fits screen ✅
- [ ] **Download button**: Accessible ✅

---

## PDF Validation (15 minutes)

### Test All PDF Types

**Solar PV PDF:**
- [ ] Header: "GhawdeX" single style (not split) ✅
- [ ] Footer: 3 lines (company, contact, website) ✅
- [ ] Footer: No overlap with terms ✅
- [ ] Footer: Last line visible (not cut off) ✅

**Battery-Only PDF:**
- [ ] Purple theme ✅
- [ ] "Battery Storage Proposal" title ✅
- [ ] Footer renders correctly ✅

**Edge Cases:**
- [ ] Minimal content (3 kWp) → Footer visible ✅
- [ ] Maximum content (20 kWp + battery + loan) → Footer visible ✅

---

## Integration Verification (10 minutes)

### Supabase
```bash
# Check recent lead
SELECT * FROM leads ORDER BY created_at DESC LIMIT 1;
```
- [ ] All fields populated ✅
- [ ] zoho_lead_id present ✅

### Zoho CRM
- [ ] Login: https://crm.zoho.eu
- [ ] Search lead by email
- [ ] **Verify**: System Size, Battery, Total, Deposit fields ✅

### Telegram
- [ ] **Everything channel**: Step notifications ✅
- [ ] **Team channel**: Lead notification ✅
- [ ] **Admin channel**: (No notification for normal lead) ✅

---

## Browser Compatibility (Quick Check)

Test on:
- [ ] Chrome (macOS) ✅
- [ ] Safari (macOS) ✅
- [ ] Mobile Safari (iPhone) ✅

Each browser:
- [ ] Complete full wizard
- [ ] PDF downloads
- [ ] No JavaScript errors in console

---

## Regression: Today's Fixes (10 minutes)

### Autocomplete Zoom
- [ ] Type city → Click → **Map zooms** ✅
- [ ] Type city → Press Enter → **Map zooms** ✅
- [ ] Console: "🔍 Event fired: gmp-select" ✅

### Step 2 Defaults
- [ ] Fresh load → Household=4+, Bill=€180-250 ✅

### Deposit Calculation
- [ ] €2,800 total → Deposit=€1,400 (50%) ✅
- [ ] €1,200 total → Deposit=€799 (minimum) ✅

### Mobile Grids
- [ ] iPhone SE: All grids responsive, no scroll ✅

---

## Quick Test Script (Copy/Paste)

Open browser console on https://get.ghawdex.pro and run:

```javascript
// Test wizard state
console.log('Wizard State:', window.wizardState);

// Test localStorage
console.log('Session:', localStorage.getItem('wizard-session'));

// Check for errors
console.log('Errors:', performance.getEntriesByType('resource').filter(r => r.responseStatus >= 400));
```

---

## Issue Reporting

If you find issues, note:
- **What**: Brief description
- **Where**: Step number or component
- **Browser/Device**: e.g., "iPhone SE / Safari"
- **Expected vs Actual**: What should happen vs what happens

---

## Status Dashboard

**Production Health:**
- ✅ Site: UP (200 OK, 1.1s load)
- ✅ Railway: Deployed (production)
- 🔄 Supabase: (Test manually)
- 🔄 Integrations: (Test manually)

**Manual Testing Required:**
Use the detailed plan in `.claude/plans/cozy-mixing-canyon.md` for comprehensive testing.

---

**Next Steps:**
1. Open https://get.ghawdex.pro on mobile and desktop
2. Run through wizard flows above
3. Check PDFs, integrations, responsive design
4. Report any issues found

**Estimated time: 30-45 minutes for quick validation**
