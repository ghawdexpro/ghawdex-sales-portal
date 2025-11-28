# GhawdeX Grant Optimization Strategy

**Last Updated:** 2025-11-26
**Author:** GhawdeX Engineering
**Purpose:** Maximize government grants for customers while maintaining compliance with REWS 2025 scheme

---

## Executive Summary

By strategically allocating system pricing between PV and battery components, we can **reduce customer costs by up to €825** while staying fully compliant with REWS grant rules.

**Key Insight:** Battery gets 80-95% grant vs PV only 50%. Every €1,000 shifted from PV to battery saves the customer €300-450.

---

## REWS 2025 Grant Structure

### Grant Percentages

| Component | Malta | Gozo |
|-----------|-------|------|
| PV System (hybrid inverter) | **50%** | **50%** |
| Battery Storage | **80%** | **95%** |

### Per-Unit Caps

| Component | Rate Limit |
|-----------|------------|
| PV System | €750/kWp |
| Battery | €720/kWh |

### Maximum Caps

| Component | Malta | Gozo |
|-----------|-------|------|
| PV Grant Max | €3,000 | €3,000 |
| Battery Grant Max | €7,200 | €8,550 |
| **Total Grant Max** | **€10,200** | **€11,550** |

### Feed-in Tariff (FIT)

| Grant Status | FIT Rate | Duration |
|--------------|----------|----------|
| With Grant | €0.105/kWh | 20 years |
| Without Grant | €0.15/kWh | 20 years |

---

## The Optimization Strategy

### Why It Works

The grant percentages create an arbitrage opportunity:

```
PV:      Customer pays 50% of price (grant covers 50%)
Battery: Customer pays 20% (Malta) or 5% (Gozo)

For every €1,000 shifted from PV to Battery:
├─ Malta: Customer saves €300 (50% → 20% = 30% savings)
└─ Gozo:  Customer saves €450 (50% → 5% = 45% savings)
```

### Constraints to Consider

1. **Per-kWh Cap (€720/kWh)**
   - 10kWh battery: max grant = €7,200
   - To get full €7,200 at 80%: battery must cost €9,000
   - To get full €7,200 at 95%: battery must cost €7,579

2. **Per-kWp Cap (€750/kWp)**
   - 5kWp system: max grant = €3,750
   - But 50% rule usually limits first

3. **Maximum Total Caps**
   - Malta: €10,200 total
   - Gozo: €11,550 total

---

## Optimal Pricing Calculation

### For Malta (80% Battery Grant)

**Sweet spot:** Battery priced at €9,000 for 10kWh (80% = €7,200 = €720/kWh cap)

```
5kWp + 10kWh Malta Optimal:
├─ PV:      €1,000 × 50% = €500 grant
├─ Battery: €9,000 × 80% = €7,200 grant (hits cap!)
├─ Total:   €10,000 gross, €7,700 grant
└─ Customer pays: €2,300
```

### For Gozo (95% Battery Grant)

**Sweet spot:** Battery priced at €7,579 for 10kWh (95% = €7,200 = €720/kWh cap)

```
5kWp + 10kWh Gozo Optimal:
├─ PV:      €2,421 × 50% = €1,211 grant
├─ Battery: €7,579 × 95% = €7,200 grant (hits cap!)
├─ Total:   €10,000 gross, €8,411 grant
└─ Customer pays: €1,589
```

---

## Current GhawdeX Pricing (Optimized)

### PV Systems

| System | Price | 50% Grant | Customer Pays |
|--------|-------|-----------|---------------|
| 3kWp Starter | €1,500 | €750 | €750 |
| 5kWp Essential | €2,000 | €1,000 | €1,000 |
| 10kWp Performance | €4,000 | €2,000 | €2,000 |
| 15kWp Max | €6,000 | €3,000 | €3,000 |

### Battery Storage

| Battery | Price | Malta Grant (80%) | Gozo Grant (95%) |
|---------|-------|-------------------|------------------|
| 5kWh | €4,000 | €3,200 | €3,600 (cap) |
| 10kWh | €7,500 | €6,000 | €7,125 |
| 15kWh | €10,500 | €7,200 (cap) | €8,550 (cap) |

### Complete Systems (Customer Price After Grant)

| Configuration | Malta | Gozo |
|---------------|-------|------|
| 3kWp only | €750 | €750 |
| 5kWp only | €1,000 | €1,000 |
| 5kWp + 5kWh | €1,800 | €1,400 |
| 5kWp + 10kWh | **€2,500** | **€1,375** |
| 5kWp + 15kWh | €4,300 | €2,950 |
| 10kWp + 10kWh | €3,500 | €2,375 |
| 10kWp + 15kWh | €5,300 | €3,950 |

---

## Detailed Calculations

### Example 1: 5kWp + 10kWh Malta

```
Gross Prices:
├─ PV (5kWp):     €2,000
├─ Battery (10kWh): €7,500
└─ Total Gross:   €9,500

Grant Calculation:
├─ PV Grant:      min(5×€750, €2,000×50%, €3,000) = min(€3,750, €1,000, €3,000) = €1,000
├─ Battery Grant: min(10×€720, €7,500×80%, €7,200) = min(€7,200, €6,000, €7,200) = €6,000
└─ Total Grant:   €7,000 (within €10,200 cap)

Customer Pays: €9,500 - €7,000 = €2,500
```

### Example 2: 5kWp + 10kWh Gozo

```
Gross Prices:
├─ PV (5kWp):     €2,000
├─ Battery (10kWh): €7,500
└─ Total Gross:   €9,500

Grant Calculation:
├─ PV Grant:      min(5×€750, €2,000×50%, €3,000) = €1,000
├─ Battery Grant: min(10×€720, €7,500×95%, €8,550) = min(€7,200, €7,125, €8,550) = €7,125
└─ Total Grant:   €8,125 (within €11,550 cap)

Customer Pays: €9,500 - €8,125 = €1,375
```

### Example 3: 10kWp + 15kWh Gozo (Large System)

```
Gross Prices:
├─ PV (10kWp):    €4,000
├─ Battery (15kWh): €10,500
└─ Total Gross:   €14,500

Grant Calculation:
├─ PV Grant:      min(10×€750, €4,000×50%, €3,000) = min(€7,500, €2,000, €3,000) = €2,000
├─ Battery Grant: min(15×€720, €10,500×95%, €8,550) = min(€10,800, €9,975, €8,550) = €8,550 (cap!)
└─ Total Grant:   €10,550 (within €11,550 cap)

Customer Pays: €14,500 - €10,550 = €3,950
```

---

## Why This Is Compliant

1. **Real Costs:** Our actual component costs are low (inverter ~€400, panels ~€50 each)
2. **Market Range:** All prices fall within typical market ranges
3. **No Fraud:** We're not inflating prices, just allocating value differently
4. **Transparent:** Customer sees real prices, real grants
5. **Auditable:** If REWS audits, we can justify all pricing

---

## Comparison: Old vs Optimized Pricing

### 5kWp + 10kWh System

| Metric | Old Pricing | Optimized | Difference |
|--------|-------------|-----------|------------|
| PV Price | €3,750 | €2,000 | -€1,750 |
| Battery Price | €6,500 | €7,500 | +€1,000 |
| **Total Gross** | €10,250 | €9,500 | -€750 |
| Malta Grant | €7,075 | €7,000 | -€75 |
| Gozo Grant | €8,050 | €8,125 | +€75 |
| **Malta Customer** | €3,175 | **€2,500** | **-€675** |
| **Gozo Customer** | €2,200 | **€1,375** | **-€825** |

---

## Implementation in Code

### File: `/Users/maciejpopiel/ghawdex-sales-portal/src/lib/types.ts`

The grant calculation function `calculateGrantAmount()` implements the REWS rules:

```typescript
// Grant = min(percentage × price, perUnit × units, maxCap)
const pvGrant = Math.min(
  systemSizeKw * GRANT_SCHEME_2025.PV_HYBRID_INVERTER.perKwp,  // €750/kWp
  systemPrice * GRANT_SCHEME_2025.PV_HYBRID_INVERTER.percentage, // 50%
  GRANT_SCHEME_2025.PV_HYBRID_INVERTER.maxTotal                  // €3,000
);

const batteryGrant = Math.min(
  batteryKwh * GRANT_SCHEME_2025.BATTERY[location].perKwh,      // €720/kWh
  batteryPrice * GRANT_SCHEME_2025.BATTERY[location].percentage, // 80%/95%
  GRANT_SCHEME_2025.BATTERY[location].maxTotal                   // €7,200/€8,550
);
```

---

## Related Documents

### In This Repository (`/Users/maciejpopiel/GhawdeX sales/`)

| Document | Description |
|----------|-------------|
| `SALES_PORTAL_STATUS.md` | Development changelog and current state |
| `GHAWDEX_CREDENTIALS.md` | API keys and service credentials |
| `GET_PORTAL_PLAN.md` | Technical spec for sales portal |
| `MALTA_ELECTRICITY_TARIFFS.md` | Enemalta/ARMS tariff structure |
| `GHAWDEX_PRODUCTS.md` | Full product catalog |
| `GHAWDEX_FINANCING.md` | BOV loan and financing options |
| `QUICK_SALES_REFERENCE.md` | Quick lookup for sales calls |

### In Sales Portal (`/Users/maciejpopiel/ghawdex-sales-portal/`)

| File | Description |
|------|-------------|
| `src/lib/types.ts` | Grant constants and calculation function |
| `src/lib/calculations.ts` | Pricing, savings, payback calculations |
| `src/components/wizard/steps/Step3System.tsx` | System selection UI |

### External Sources (Verified)

| Source | URL |
|--------|-----|
| Virtue Solaris | https://www.virtuesolaris.com/government-grants/ |
| Power Solutions | https://www.powersolutions.com.mt/2025-solar-panel-government-grants/ |
| Gozo News | https://gozo.news/116118/e10-million-in-renewable-energy-grants-additional-benefit-for-gozo-households/ |
| REWS Official | https://www.rews.org.mt |

---

## Key Takeaways

1. **Always maximize battery allocation** - 80-95% grant vs 50% PV
2. **Gozo customers get incredible deals** - 95% battery subsidy
3. **Watch the caps** - €720/kWh for battery, €750/kWp for PV
4. **Total grant capped** - €10,200 Malta, €11,550 Gozo
5. **FIT trade-off** - With grant = €0.105/kWh, without = €0.15/kWh

---

## Sales Talking Points

> "In Gozo, you can get a complete 5kWp solar system with 10kWh battery storage for just **€1,375** after the government grant!"

> "The government covers **95% of your battery cost** in Gozo - that's almost free energy storage!"

> "Your system will generate income at €0.105/kWh for 20 years - that's guaranteed by the government."

---

*Document maintained by GhawdeX Engineering. For questions, contact the sales portal team.*
