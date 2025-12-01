# REWS Grant Rules Quick Reference

**Purpose:** Definitive reference for all REWS 2025 grant rules, caps, and eligibility.
**Last Updated:** 2025-12-01
**Use:** Quick lookup during sales conversations and system calculations.

---

## Grant Eligibility Rules

### Previous Grant Exclusion (CRITICAL)

| Previous Grant Type | Can Get PV Grant? | Can Get Battery Grant? |
|---------------------|-------------------|------------------------|
| PV grant since 2010 | **NO - NEVER** | YES |
| Battery grant (6 years) | YES | NO |
| No previous grant | YES | YES |

**Key Rule:**
> "Applicants who have received a grant for a similar system **since 2010** shall not be eligible for another grant issued in terms of this scheme."

- PV grant recipients are **permanently excluded** from future PV grants
- Battery grants have **6-year cooling off** period
- Different grant types are independent (PV grant doesn't block battery grant)

### Basic Eligibility Requirements

- Residential property in Malta or Gozo
- Legal owner or tenant (with landlord consent)
- Active Enemalta grid connection
- Maltese ID or valid residence permit
- Battery minimum: 2.5 kWh capacity
- Must use REWS-registered installer

---

## The Three-Way Cap System

Every grant is calculated as the **MINIMUM** of three values:

```
Grant = min(
    Per-Unit Rate × Units,      ← Cap 1: €/kWp or €/kWh
    Percentage × Price,         ← Cap 2: 50% or 80%/95%
    Maximum Total               ← Cap 3: Absolute € limit
)
```

### Why This Matters

- Cheap systems hit the **percentage cap** first
- Expensive systems hit the **per-unit cap** first
- Large systems hit the **maximum cap**

---

## All Grant Rates (REWS 2025)

### PV System Grants

| Option | Description | Per-Unit Cap | Percentage | Max Total |
|--------|-------------|--------------|------------|-----------|
| A | PV + Standard Inverter | €625/kWp | 50% | €2,500 |
| B | PV + Hybrid Inverter | €750/kWp | 50% | €3,000 |

**Malta and Gozo: Same rates for PV**

### Battery Storage Grants

| Location | Per-Unit Cap | Percentage | Max Total |
|----------|--------------|------------|-----------|
| Malta | €720/kWh | 80% | €7,200 |
| **Gozo** | €720/kWh | **95%** | **€8,550** |

### Hybrid Inverter Retrofit (Option C only)

| Component | Per-Unit Cap | Percentage | Max Total |
|-----------|--------------|------------|-----------|
| Hybrid Inverter | €450/kWp | 80% | €1,800 |

### Total Grant Caps (PV + Battery combined)

| Location | Maximum Total Grant |
|----------|---------------------|
| Malta | €10,200 |
| Gozo | €11,550 |

---

## Option C vs Option D Clarification

### Option C: Hybrid Inverter + Battery (Retrofit)

- For customers with OLD PV system needing inverter upgrade
- **Two separate grants:** Inverter (80%) + Battery (80%/95%)
- Must have PV connected to grid for 6+ years
- Invoiced as separate line items

### Option D: Battery Only (GhawdeX Default)

- For standalone battery OR retrofit with compatible inverter
- **One grant:** Battery system (80%/95%)
- Inverter INCLUDED in battery system price
- Invoiced as ONE line item
- **Gozo gets 95% on entire system**

### GhawdeX Approach

We use **Option D** for all battery sales:
- Battery price includes inverter/hardware
- Single line item on invoice: "Battery Storage System"
- Simpler application process
- Gozo customers get 95% on full price

---

## Per-Unit Cap Calculations

### When Per-Unit Cap Applies

The per-unit cap kicks in when price per unit exceeds:

| Component | Malta Threshold | Gozo Threshold |
|-----------|-----------------|----------------|
| PV (hybrid) | €1,500/kWp | €1,500/kWp |
| Battery | €900/kWh | €758/kWh |

**Formula:** Threshold = Per-Unit Cap ÷ Grant Percentage

### Examples

**Battery priced BELOW threshold (percentage caps first):**
```
10kWh at €7,500 = €750/kWh (below €900 Malta threshold)
├─ Per-kWh:    10 × €720 = €7,200
├─ Percentage: €7,500 × 80% = €6,000  ← LIMITING
└─ Grant = €6,000
```

**Battery priced ABOVE threshold (per-unit caps first):**
```
10kWh at €10,000 = €1,000/kWh (above €900 Malta threshold)
├─ Per-kWh:    10 × €720 = €7,200  ← LIMITING
├─ Percentage: €10,000 × 80% = €8,000
└─ Grant = €7,200
```

---

## Sweet Spot Pricing

To maximize customer grant, price should equal the threshold:

### Optimal Price Points

| Component | Malta Optimal | Gozo Optimal |
|-----------|---------------|--------------|
| PV per kWp | €1,500/kWp | €1,500/kWp |
| Battery per kWh | €900/kWh | €758/kWh |

### GhawdeX Actual Pricing

| Battery | Price | €/kWh | Optimized For |
|---------|-------|-------|---------------|
| 5 kWh | €4,000 | €800/kWh | Malta (below €900) |
| 10 kWh | €7,500 | €750/kWh | Both (optimal) |
| 15 kWh | €10,500 | €700/kWh | Both (below threshold) |

---

## Grant Calculation Examples

### Example 1: 5kWh Battery Malta

```
Price: €4,000 (€800/kWh)

Cap 1 - Per kWh:    5 × €720 = €3,600
Cap 2 - Percentage: €4,000 × 80% = €3,200  ← LOWEST
Cap 3 - Maximum:    €7,200

Grant = €3,200
Customer pays: €4,000 - €3,200 = €800
```

### Example 2: 10kWh Battery Malta

```
Price: €7,500 (€750/kWh)

Cap 1 - Per kWh:    10 × €720 = €7,200
Cap 2 - Percentage: €7,500 × 80% = €6,000  ← LOWEST
Cap 3 - Maximum:    €7,200

Grant = €6,000
Customer pays: €7,500 - €6,000 = €1,500
```

### Example 3: 10kWh Battery Gozo

```
Price: €7,500 (€750/kWh)

Cap 1 - Per kWh:    10 × €720 = €7,200
Cap 2 - Percentage: €7,500 × 95% = €7,125  ← LOWEST
Cap 3 - Maximum:    €8,550

Grant = €7,125
Customer pays: €7,500 - €7,125 = €375
```

### Example 4: 15kWh Battery Malta (hits max cap)

```
Price: €10,500 (€700/kWh)

Cap 1 - Per kWh:    15 × €720 = €10,800
Cap 2 - Percentage: €10,500 × 80% = €8,400
Cap 3 - Maximum:    €7,200  ← LOWEST

Grant = €7,200
Customer pays: €10,500 - €7,200 = €3,300
```

### Example 5: 15kWh Battery Gozo (hits max cap)

```
Price: €10,500 (€700/kWh)

Cap 1 - Per kWh:    15 × €720 = €10,800
Cap 2 - Percentage: €10,500 × 95% = €9,975
Cap 3 - Maximum:    €8,550  ← LOWEST

Grant = €8,550
Customer pays: €10,500 - €8,550 = €1,950
```

### Example 6: 5kWp PV + 10kWh Battery Malta

```
PV Price: €2,000 | Battery Price: €7,500 | Total: €9,500

PV Grant:
├─ Per kWp:    5 × €750 = €3,750
├─ Percentage: €2,000 × 50% = €1,000  ← LOWEST
└─ PV Grant = €1,000

Battery Grant:
├─ Per kWh:    10 × €720 = €7,200
├─ Percentage: €7,500 × 80% = €6,000  ← LOWEST
└─ Battery Grant = €6,000

Total Grant = €1,000 + €6,000 = €7,000 (under €10,200 cap)
Customer pays: €9,500 - €7,000 = €2,500
```

---

## Feed-in Tariff (FIT) Rates

| Grant Status | FIT Rate | Duration |
|--------------|----------|----------|
| With Grant | €0.105/kWh | 20 years |
| Without Grant | €0.15/kWh | 20 years |

**Note:** Battery-only grants do NOT affect FIT rates (no solar production to sell).

---

## Quick Decision Tree

```
Customer wants solar?
├─ Had PV grant since 2010? → NO PV GRANT (can still get battery)
└─ No previous PV grant? → Eligible for Option A or B

Customer wants battery?
├─ Has existing PV with old inverter? → Option C or D
├─ Has existing PV with hybrid inverter? → Option D
├─ No existing PV? → Option D
└─ In Gozo? → 95% grant on battery!

Customer in Gozo?
├─ Battery: 95% (up to €8,550)
├─ PV: 50% (same as Malta)
└─ Total max: €11,550
```

---

## Common Sales Scenarios

### Scenario 1: "I got solar panels 10 years ago"

```
PV Grant:      ❌ Not eligible (grant since 2010)
Battery Grant: ✅ Eligible - Option D
Recommendation: Add 10kWh battery for €1,500 (Malta) or €375 (Gozo)
```

### Scenario 2: "I have solar but old inverter"

```
Option C: New hybrid inverter + battery (separate grants)
Option D: Battery system with inverter included (one grant)
Recommendation: Option D - simpler, same effective grant
```

### Scenario 3: "I'm in Gozo and want battery only"

```
Grant: 95% of battery price
10kWh battery: €7,500 - €7,125 = €375 customer pays
Talking point: "Government covers 95% - just €375 for €7,500 system!"
```

### Scenario 4: "Can I add more panels to my existing system?"

```
If had PV grant since 2010: No grant for additional panels
Can still install: Yes, just pay full price
FIT: Existing FIT rate continues for original capacity
New capacity: May need new FIT application
```

---

## Code Implementation Reference

### Files

| File | Function |
|------|----------|
| `/src/lib/types.ts` | `calculateGrantAmount()` - Main grant calculation |
| `/src/lib/types.ts` | `GRANT_SCHEME_2025` - All constants |
| `/src/lib/calculations.ts` | `calculateTotalPriceWithGrant()` - Price after grant |

### Constants Location

```typescript
// /src/lib/types.ts lines 176-219
export const GRANT_SCHEME_2025 = {
  PV_HYBRID_INVERTER: {
    percentage: 0.5,
    maxTotal: 3000,
    perKwp: 750,
  },
  BATTERY: {
    malta: { percentage: 0.8, maxTotal: 7200, perKwh: 720 },
    gozo: { percentage: 0.95, maxTotal: 8550, perKwh: 720 },
  },
  MAX_TOTAL: {
    malta: 10200,
    gozo: 11550,
  },
};
```

---

## Official Sources

| Source | URL |
|--------|-----|
| REWS Official | https://www.rews.org.mt |
| Clean Energy EU Islands | https://clean-energy-islands.ec.europa.eu/countries/malta/ |
| Virtue Solaris | https://www.virtuesolaris.com/government-grants/ |
| Power Solutions | https://www.powersolutions.com.mt/2025-solar-panel-government-grants/ |

---

## Related Documents

| Document | Purpose |
|----------|---------|
| `BATTERY_ONLY_GRANT_COMPLETE_GUIDE.md` | Full battery-only documentation |
| `GRANT_OPTIMIZATION_STRATEGY.md` | Pricing strategy details |
| `MALTA_ELECTRICITY_TARIFFS.md` | Enemalta tariff bands |
| `AVATAR_KNOWLEDGE_BASE.md` | Sales conversation reference |

---

*Quick reference maintained by GhawdeX Engineering*
