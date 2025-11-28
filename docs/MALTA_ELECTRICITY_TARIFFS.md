# Malta Electricity Tariff System (Enemalta/ARMS)

## Overview

Malta uses a **progressive tiered tariff system** - the more you consume, the higher the rate per kWh. There are two main tariff categories for households:

1. **Residential** - Primary residence with registered occupants (cheaper)
2. **Domestic** - Secondary homes, holiday homes, unregistered properties (more expensive)

---

## Residential Tariff Rates (Primary Residence)

For properties where occupants are officially registered on the ARMS bill.

### Consumption Bands (Annual)

| Band | Annual kWh | Rate (€/kWh) | Rate (cents) |
|------|------------|--------------|--------------|
| 1 | 0 - 2,000 | €0.1047 | 10.47c |
| 2 | 2,001 - 6,000 | €0.1298 | 12.98c |
| 3 | 6,001 - 10,000 | €0.1607 | 16.07c |
| 4 | 10,001 - 20,000 | €0.3420 | 34.20c |
| 5 | 20,001+ | €0.6076 | 60.76c |

*All rates inclusive of 5% VAT*

### Two-Month Billing Period Allocation

ARMS bills every 2 months. Annual bands are pro-rated:

| Band | 2-Month Allocation | Rate |
|------|-------------------|------|
| 1 | ~333 kWh | 10.47c |
| 2 | ~667 kWh | 12.98c |
| 3 | ~667 kWh | 16.07c |
| 4 | ~1,667 kWh | 34.20c |
| 5 | Remainder | 60.76c |

---

## Domestic Tariff Rates (Secondary Residence)

For properties without registered occupants (holiday homes, secondary properties).

### Consumption Bands (Annual)

| Band | Annual kWh | Rate (€/kWh) | Rate (cents) |
|------|------------|--------------|--------------|
| 1 | 0 - 2,000 | €0.1365 | 13.65c |
| 2 | 2,001 - 6,000 | €0.1673 | 16.73c |
| 3 | 6,001 - 10,000 | €0.2023 | 20.23c |
| 4 | 10,001 - 20,000 | €0.4180 | 41.80c |
| 5 | 20,001+ | €0.6860 | 68.60c |

*All rates inclusive of 5% VAT*

---

## Rate Comparison: Residential vs Domestic

| Band | Residential | Domestic | Difference |
|------|-------------|----------|------------|
| 1 | 10.47c | 13.65c | +30% |
| 2 | 12.98c | 16.73c | +29% |
| 3 | 16.07c | 20.23c | +26% |
| 4 | 34.20c | 41.80c | +22% |
| 5 | 60.76c | 68.60c | +13% |

**Key takeaway:** Domestic rates are ~25-30% higher than residential rates.

---

## Eco-Reduction Rebate (Residential Only)

Residential customers receive an eco-reduction discount based on household size.

### Single Person Household
- **25% discount** on ALL consumption
- Only if annual consumption < 2,000 kWh

### Multi-Person Household
Based on 1,750 kWh allowance per person per year:
- **25% discount** on first 1,000 kWh per person
- **15% discount** on next 750 kWh per person

### Example: 3-Person Household
- Allowance: 3 × 1,750 = 5,250 kWh/year
- 25% off first 3,000 kWh (3 × 1,000)
- 15% off next 2,250 kWh (3 × 750)

---

## Fixed Charges

### Service Charge (Annual)
| Connection Type | Charge |
|-----------------|--------|
| Single Phase | €65.00 |
| Three Phase | €195.00 |

### Installation Charge (One-time)
| Connection Type | Charge |
|-----------------|--------|
| Single Phase | €300 |
| Three Phase | €900 |

### Maximum Demand Tariff
For three-phase connections exceeding 60A per phase:
- **€21.05/year per kW** of maximum demand

---

## Bill Calculation Example

### Scenario: Residential household, 2 persons, 6,000 kWh/year

**Step 1: Calculate base consumption cost**
| Band | kWh | Rate | Cost |
|------|-----|------|------|
| 1 | 2,000 | €0.1047 | €209.40 |
| 2 | 4,000 | €0.1298 | €519.20 |
| **Total** | 6,000 | | **€728.60** |

**Step 2: Apply Eco-Reduction (2 persons)**
- Allowance: 2 × 1,750 = 3,500 kWh
- 25% off first 2,000 kWh: €209.40 × 0.25 = €52.35
- 15% off next 1,500 kWh: (1,500 × €0.1298) × 0.15 = €29.21
- **Total eco-reduction: €81.56**

**Step 3: Final annual cost**
- Base: €728.60
- Eco-reduction: -€81.56
- Service charge: €65.00
- **Annual total: €712.04**
- **Monthly average: €59.34**

---

## Current Portal Problem

Our current `estimateConsumption()` function uses a **flat rate**:

```typescript
// Current (WRONG) approach
const rate = hasGrant ? 0.105 : 0.15;  // Single flat rate
const kWh = (bill - 10) / rate;
```

**Issues:**
1. Doesn't account for tiered pricing
2. Uses wrong rates (not matching actual ARMS tariffs)
3. Ignores eco-reduction rebates
4. Same calculation regardless of household size

---

## Proposed Solution

### Option A: Simplified Tiered Calculation

Use weighted average rate based on typical consumption patterns:

| Annual Consumption | Weighted Avg Rate |
|-------------------|-------------------|
| 0 - 2,000 kWh | €0.105 |
| 2,001 - 6,000 kWh | €0.115 |
| 6,001 - 10,000 kWh | €0.125 |
| 10,001+ kWh | €0.20 |

### Option B: Full Tiered Calculation

Implement reverse calculation that:
1. Takes monthly bill amount
2. Subtracts fixed charges (service charge portion)
3. Iteratively calculates kWh across tiers
4. Accounts for eco-reduction based on household size

### Option C: Ask for kWh Directly

Instead of asking for bill amount:
- Ask user for their actual kWh consumption (shown on ARMS bill)
- Or provide bill + household size to calculate accurately

---

## Recommended Approach for Sales Portal

**Ask two questions:**
1. Monthly electricity bill (€)
2. Number of people in household

Then use tiered reverse calculation:

```typescript
function estimateConsumption(
  monthlyBill: number,
  householdSize: number
): number {
  // Implementation would reverse-engineer kWh from bill
  // accounting for tiers and eco-reduction
}
```

---

## Sources

- [Enemalta Residential Property Services](https://www.enemalta.com.mt/13797-2/)
- [Enemalta Domestic Property Services](https://www.enemalta.com.mt/domestic-property-services/)
- [ARMS Portal - Tariff Prices](https://arms.com.mt/en/information/water-and-electricity/tariff-prices)
- [AQS - Understanding Your Electricity Bill](https://aqsmed.com/pv-schemes-in-malta/understanding-your-electricity-bill/)
- [REWS - Electricity Information](https://www.rews.org.mt/consumer-information/electricity/)

---

*Document created: November 2024*
*Rates as of 2024 - verify with official ARMS/Enemalta sources*
