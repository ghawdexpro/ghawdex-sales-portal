import {
  MALTA_CONSTANTS,
  RESIDENTIAL_TARIFF_BANDS,
  ECO_REDUCTION,
  FIXED_CHARGES,
  EMERGENCY_BACKUP_COST,
  SystemPackage,
  BatteryOption,
  FinancingOption,
  GrantType,
  Location,
  calculateGrantAmount,
  getFitRate,
} from './types';

/**
 * Calculate electricity bill from annual kWh consumption using tiered rates
 * This is the FORWARD calculation: kWh -> Bill
 */
export function calculateBillFromConsumption(
  annualKwh: number,
  householdSize: number
): { grossBill: number; ecoReduction: number; netBill: number } {
  let grossBill = 0;
  let remainingKwh = annualKwh;
  let prevMax = 0;

  // Calculate gross bill using tiered rates
  for (const band of RESIDENTIAL_TARIFF_BANDS) {
    const bandKwh = Math.min(remainingKwh, band.maxKwh - prevMax);
    if (bandKwh <= 0) break;
    grossBill += bandKwh * band.rate;
    remainingKwh -= bandKwh;
    prevMax = band.maxKwh;
  }

  // Calculate eco-reduction
  let ecoReduction = 0;
  if (householdSize === 1) {
    // Single person: 25% off all consumption if under 2,000 kWh
    if (annualKwh <= ECO_REDUCTION.SINGLE_PERSON_THRESHOLD) {
      ecoReduction = grossBill * ECO_REDUCTION.SINGLE_PERSON_DISCOUNT;
    }
  } else if (householdSize > 1) {
    // Multi-person household
    const totalAllowance = householdSize * ECO_REDUCTION.ALLOWANCE_PER_PERSON;
    const eligibleKwh = Math.min(annualKwh, totalAllowance);

    // First tier: 25% off first 1,000 kWh per person
    const firstTierKwh = Math.min(eligibleKwh, householdSize * ECO_REDUCTION.FIRST_TIER_KWH);
    const firstTierCost = calculateCostForKwh(firstTierKwh);
    ecoReduction += firstTierCost * ECO_REDUCTION.FIRST_TIER_DISCOUNT;

    // Second tier: 15% off next 750 kWh per person
    const secondTierKwh = Math.min(
      Math.max(0, eligibleKwh - firstTierKwh),
      householdSize * ECO_REDUCTION.SECOND_TIER_KWH
    );
    if (secondTierKwh > 0) {
      const secondTierCost = calculateCostForKwh(firstTierKwh + secondTierKwh) - firstTierCost;
      ecoReduction += secondTierCost * ECO_REDUCTION.SECOND_TIER_DISCOUNT;
    }
  }

  const netBill = grossBill - ecoReduction + FIXED_CHARGES.SERVICE_CHARGE_SINGLE_PHASE;

  return {
    grossBill: Math.round(grossBill * 100) / 100,
    ecoReduction: Math.round(ecoReduction * 100) / 100,
    netBill: Math.round(netBill * 100) / 100,
  };
}

/**
 * Helper: Calculate cost for a given kWh using tiered rates
 */
function calculateCostForKwh(kwh: number): number {
  let cost = 0;
  let remaining = kwh;
  let prevMax = 0;

  for (const band of RESIDENTIAL_TARIFF_BANDS) {
    const bandKwh = Math.min(remaining, band.maxKwh - prevMax);
    if (bandKwh <= 0) break;
    cost += bandKwh * band.rate;
    remaining -= bandKwh;
    prevMax = band.maxKwh;
  }

  return cost;
}

/**
 * Estimate annual consumption from monthly bill using reverse tiered calculation
 * This is the REVERSE calculation: Bill -> kWh
 */
export function estimateConsumption(
  monthlyBill: number,
  householdSize: number
): number {
  const annualBill = monthlyBill * 12;

  // Subtract annual service charge
  const energyBill = Math.max(annualBill - FIXED_CHARGES.SERVICE_CHARGE_SINGLE_PHASE, 0);

  // Binary search to find the kWh that produces this bill
  let low = 0;
  let high = 50000; // Max reasonable household consumption
  let bestKwh = 0;

  for (let i = 0; i < 50; i++) { // 50 iterations for precision
    const mid = (low + high) / 2;
    const { netBill } = calculateBillFromConsumption(mid, householdSize);
    const calculatedEnergyBill = netBill - FIXED_CHARGES.SERVICE_CHARGE_SINGLE_PHASE;

    if (Math.abs(calculatedEnergyBill - energyBill) < 1) {
      bestKwh = mid;
      break;
    }

    if (calculatedEnergyBill < energyBill) {
      low = mid;
    } else {
      high = mid;
    }
    bestKwh = mid;
  }

  // Return monthly consumption
  return Math.round(bestKwh / 12);
}

/**
 * Get effective electricity rate for a given consumption level
 * Useful for savings calculations
 */
export function getEffectiveRate(annualKwh: number, householdSize: number): number {
  const { netBill } = calculateBillFromConsumption(annualKwh, householdSize);
  const energyCost = netBill - FIXED_CHARGES.SERVICE_CHARGE_SINGLE_PHASE;
  return annualKwh > 0 ? energyCost / annualKwh : RESIDENTIAL_TARIFF_BANDS[0].rate;
}

/**
 * Calculate battery storage savings based on Malta's tiered electricity rates
 *
 * Battery savings come from:
 * 1. Storing solar/cheap electricity during the day
 * 2. Using stored energy at night instead of drawing from grid
 * 3. Avoiding higher tariff tiers by reducing apparent grid consumption
 *
 * Key assumptions:
 * - Battery cycles ~300 times per year (realistic for Malta climate)
 * - Round-trip efficiency: 90%
 * - Usable capacity: 95% of nominal
 * - Savings are calculated at the MARGINAL rate (highest tier the customer is in)
 */
export function calculateBatterySavings(
  batteryKwh: number,
  monthlyConsumptionKwh: number | null,
  _householdSize: number | null  // Reserved for future eco-reduction calculations
): { annualSavings: number; explanation: string; marginalRate: number } {
  // Battery performance constants
  const CYCLES_PER_YEAR = 300; // Conservative estimate for Malta
  const ROUND_TRIP_EFFICIENCY = 0.90;
  const USABLE_CAPACITY_RATIO = 0.95;

  // Calculate annual kWh offset by battery
  const annualBatteryOffset = batteryKwh * USABLE_CAPACITY_RATIO * ROUND_TRIP_EFFICIENCY * CYCLES_PER_YEAR;

  // Determine the marginal rate based on consumption
  let marginalRate: number;
  let explanation: string;

  if (monthlyConsumptionKwh && monthlyConsumptionKwh > 0) {
    const annualConsumption = monthlyConsumptionKwh * 12;

    // Find which tariff band the customer's consumption falls into
    // The marginal rate is the rate they pay for their LAST kWh
    if (annualConsumption <= 2000) {
      marginalRate = RESIDENTIAL_TARIFF_BANDS[0].rate; // €0.1047
      explanation = 'Band 1 (0-2,000 kWh)';
    } else if (annualConsumption <= 6000) {
      marginalRate = RESIDENTIAL_TARIFF_BANDS[1].rate; // €0.1298
      explanation = 'Band 2 (2,001-6,000 kWh)';
    } else if (annualConsumption <= 10000) {
      marginalRate = RESIDENTIAL_TARIFF_BANDS[2].rate; // €0.1607
      explanation = 'Band 3 (6,001-10,000 kWh)';
    } else if (annualConsumption <= 20000) {
      marginalRate = RESIDENTIAL_TARIFF_BANDS[3].rate; // €0.3420
      explanation = 'Band 4 (10,001-20,000 kWh) - HIGH SAVINGS';
    } else {
      marginalRate = RESIDENTIAL_TARIFF_BANDS[4].rate; // €0.6076
      explanation = 'Band 5 (20,001+ kWh) - MAXIMUM SAVINGS';
    }
  } else {
    // For battery-only customers without consumption data,
    // assume they're high consumers (otherwise why buy battery-only?)
    // Use Band 3-4 average as conservative estimate
    marginalRate = (RESIDENTIAL_TARIFF_BANDS[2].rate + RESIDENTIAL_TARIFF_BANDS[3].rate) / 2; // ~€0.25
    explanation = 'Est. Band 3-4 (high consumption household)';
  }

  // Calculate annual savings
  // The battery reduces grid consumption by annualBatteryOffset kWh
  // Each kWh saved avoids paying the marginal rate
  const annualSavings = Math.round(annualBatteryOffset * marginalRate);

  return { annualSavings, explanation, marginalRate };
}

/**
 * Get detailed battery savings breakdown for display
 */
export function getBatterySavingsBreakdown(
  batteryKwh: number,
  monthlyConsumptionKwh: number | null
): {
  annualOffset: number;
  savingsPerTier: { tier: string; rate: number; savings: number }[];
  totalSavings: number;
} {
  const CYCLES_PER_YEAR = 300;
  const ROUND_TRIP_EFFICIENCY = 0.90;
  const USABLE_CAPACITY_RATIO = 0.95;

  const annualOffset = Math.round(batteryKwh * USABLE_CAPACITY_RATIO * ROUND_TRIP_EFFICIENCY * CYCLES_PER_YEAR);

  const savingsPerTier = [
    { tier: 'Band 1 (0-2k kWh)', rate: 0.1047, savings: Math.round(annualOffset * 0.1047) },
    { tier: 'Band 2 (2-6k kWh)', rate: 0.1298, savings: Math.round(annualOffset * 0.1298) },
    { tier: 'Band 3 (6-10k kWh)', rate: 0.1607, savings: Math.round(annualOffset * 0.1607) },
    { tier: 'Band 4 (10-20k kWh)', rate: 0.3420, savings: Math.round(annualOffset * 0.3420) },
    { tier: 'Band 5 (20k+ kWh)', rate: 0.6076, savings: Math.round(annualOffset * 0.6076) },
  ];

  // Calculate total based on actual consumption tier
  const { annualSavings } = calculateBatterySavings(batteryKwh, monthlyConsumptionKwh, null);

  return { annualOffset, savingsPerTier, totalSavings: annualSavings };
}

// Calculate annual savings (legacy - kept for compatibility)
export function calculateAnnualSavings(
  annualProductionKwh: number,
  hasGrant: boolean
): number {
  const rate = hasGrant
    ? MALTA_CONSTANTS.ELECTRICITY_RATE_WITH_GRANT
    : MALTA_CONSTANTS.ELECTRICITY_RATE_NO_GRANT;

  const selfConsumed = annualProductionKwh * MALTA_CONSTANTS.SELF_CONSUMPTION_RATIO;
  const exported = annualProductionKwh * (1 - MALTA_CONSTANTS.SELF_CONSUMPTION_RATIO);

  const savingsFromSelfConsumption = selfConsumed * rate;
  const feedInRevenue = exported * MALTA_CONSTANTS.FEED_IN_TARIFF;

  return Math.round(savingsFromSelfConsumption + feedInRevenue);
}

// Calculate annual savings with new grant types
export function calculateAnnualSavingsWithGrant(
  annualProductionKwh: number,
  grantType: GrantType
): number {
  const fitRate = getFitRate(grantType);

  const selfConsumed = annualProductionKwh * MALTA_CONSTANTS.SELF_CONSUMPTION_RATIO;
  const exported = annualProductionKwh * (1 - MALTA_CONSTANTS.SELF_CONSUMPTION_RATIO);

  const savingsFromSelfConsumption = selfConsumed * fitRate;
  const feedInRevenue = exported * MALTA_CONSTANTS.FEED_IN_TARIFF;

  return Math.round(savingsFromSelfConsumption + feedInRevenue);
}

// Calculate payback period
export function calculatePaybackYears(
  totalCost: number,
  annualSavings: number
): number {
  if (annualSavings <= 0) return 99;
  return Math.round((totalCost / annualSavings) * 10) / 10;
}

// Calculate 25-year total savings
export function calculate25YearSavings(annualSavings: number): number {
  let total = 0;
  let yearSavings = annualSavings;

  for (let year = 1; year <= 25; year++) {
    total += yearSavings;
    // Account for system degradation
    yearSavings *= (1 - MALTA_CONSTANTS.SYSTEM_DEGRADATION);
  }

  return Math.round(total);
}

// Calculate loan monthly payment (PMT formula)
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  const monthlyRate = annualRate / 12;

  if (monthlyRate === 0) {
    return principal / termMonths;
  }

  const payment = principal *
    (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);

  return Math.round(payment * 100) / 100;
}

// Get financing options for BOV loan
export function getFinancingOptions(totalPrice: number): FinancingOption[] {
  const terms = [36, 60, 84, 120]; // 3, 5, 7, 10 years

  return terms.map(term => {
    const monthlyPayment = calculateMonthlyPayment(
      totalPrice,
      MALTA_CONSTANTS.BOV_INTEREST_RATE,
      term
    );

    return {
      term,
      interestRate: MALTA_CONSTANTS.BOV_INTEREST_RATE,
      monthlyPayment,
      totalCost: Math.round(monthlyPayment * term),
    };
  });
}

// Recommend system based on consumption only
export function recommendSystem(
  monthlyConsumptionKwh: number,
  systems: SystemPackage[]
): SystemPackage {
  const annualConsumption = monthlyConsumptionKwh * 12;

  // Find smallest system that covers ~90% of consumption
  const sortedSystems = [...systems].sort((a, b) => a.systemSizeKw - b.systemSizeKw);

  for (const system of sortedSystems) {
    if (system.annualProductionKwh >= annualConsumption * 0.9) {
      return system;
    }
  }

  // If no system covers consumption, return largest
  return sortedSystems[sortedSystems.length - 1];
}

// Calculate total system price (legacy - kept for compatibility)
export function calculateTotalPrice(
  system: SystemPackage,
  battery: BatteryOption | null,
  hasGrant: boolean
): number {
  // Use discounted price for PV+Battery bundles, original price for PV-only
  const systemPrice = battery ? system.priceWithBattery : (hasGrant ? system.priceWithGrant : system.priceWithoutGrant);
  const batteryPrice = battery?.price || 0;

  return systemPrice + batteryPrice;
}

// Calculate total price with new grant types
export function calculateTotalPriceWithGrant(
  system: SystemPackage | null,
  battery: BatteryOption | null,
  grantType: GrantType,
  location: Location
): { totalPrice: number; grantAmount: number; grossPrice: number } {
  // Handle battery-only case (no solar system)
  // Battery price includes hardware + Emergency Backup Circuit for whole-house protection
  if (grantType === 'battery_only' || !system) {
    const batteryGrossPrice = battery?.price || 0;

    // Calculate grant on battery only (backup circuit NOT eligible for grant)
    const grantAmount = calculateGrantAmount(
      0, // No PV
      battery?.capacityKwh || null,
      grantType === 'battery_only' ? grantType : 'none',
      location,
      0,
      batteryGrossPrice
    );

    // Add Emergency Backup Circuit cost (NOT covered by grant)
    // This provides automatic whole-house backup during power outages
    const backupCost = grantType === 'battery_only' ? EMERGENCY_BACKUP_COST : 0;

    const batteryAfterGrant = Math.max(0, batteryGrossPrice - grantAmount);
    const totalPrice = batteryAfterGrant + backupCost;
    const grossPrice = batteryGrossPrice + backupCost; // Total gross includes backup

    return { totalPrice, grantAmount, grossPrice };
  }

  // Use discounted price for PV+Battery bundles, original price for PV-only
  const systemGrossPrice = battery ? system.priceWithBattery : system.priceWithoutGrant;
  const batteryGrossPrice = battery?.price || 0;
  const grossPrice = systemGrossPrice + batteryGrossPrice;

  // Calculate grant based on type, location, and actual costs
  // Pass actual prices to apply percentage caps correctly
  const grantAmount = calculateGrantAmount(
    system.systemSizeKw,
    battery?.capacityKwh || null,
    grantType,
    location,
    systemGrossPrice,
    batteryGrossPrice
  );

  const totalPrice = Math.max(0, grossPrice - grantAmount);

  return { totalPrice, grantAmount, grossPrice };
}

// Calculate CO2 offset
export function calculateCO2Offset(annualProductionKwh: number): number {
  // Malta grid emission factor: ~0.5 kg CO2/kWh
  const emissionFactor = 0.5;
  return Math.round(annualProductionKwh * emissionFactor / 1000 * 10) / 10; // tonnes
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-MT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format number
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-MT').format(num);
}

/**
 * Calculate deposit amount with €799 minimum (capped at total price)
 * Enforces 30% deposit OR €799 minimum, whichever is higher, but never exceeds total price
 * Used for all purchases: PV systems, batteries, bundles
 *
 * @param totalPrice Total price after grant deduction
 * @returns Deposit amount (30% or €799, whichever is higher, capped at total price)
 *
 * @example
 * calculateDeposit(1000) // Returns 799 (30% = €300, minimum is €799)
 * calculateDeposit(3000) // Returns 900 (30% = €900 > €799)
 * calculateDeposit(550)  // Returns 550 (would be €799, but capped at total price)
 */
export function calculateDeposit(totalPrice: number): number {
  if (totalPrice <= 0) return 0;

  const thirtyPercent = totalPrice * 0.30;
  const desiredDeposit = Math.max(thirtyPercent, 799);

  // Cap deposit at total price (important for Gozo with 95% grant)
  return Math.min(desiredDeposit, totalPrice);
}
