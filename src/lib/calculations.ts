import {
  MALTA_CONSTANTS,
  RESIDENTIAL_TARIFF_BANDS,
  ECO_REDUCTION,
  FIXED_CHARGES,
  GRANT_SCHEME_2025,
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

// Recommend system based on consumption
export function recommendSystem(
  monthlyConsumptionKwh: number,
  maxPanels: number | null,
  systems: SystemPackage[]
): SystemPackage {
  const annualConsumption = monthlyConsumptionKwh * 12;

  // Find system that covers ~100% of consumption
  const sortedSystems = [...systems].sort((a, b) => a.systemSizeKw - b.systemSizeKw);

  for (const system of sortedSystems) {
    // Check if fits on roof
    if (maxPanels !== null && system.panels > maxPanels) {
      continue;
    }

    // Check if production covers consumption
    if (system.annualProductionKwh >= annualConsumption * 0.9) {
      return system;
    }
  }

  // Return largest system that fits
  if (maxPanels !== null) {
    const fittingSystems = sortedSystems.filter(s => s.panels <= maxPanels);
    if (fittingSystems.length > 0) {
      return fittingSystems[fittingSystems.length - 1];
    }
  }

  // Default to largest
  return sortedSystems[sortedSystems.length - 1];
}

// Calculate total system price (legacy - kept for compatibility)
export function calculateTotalPrice(
  system: SystemPackage,
  battery: BatteryOption | null,
  hasGrant: boolean
): number {
  const systemPrice = hasGrant ? system.priceWithGrant : system.priceWithoutGrant;
  const batteryPrice = battery?.price || 0;

  return systemPrice + batteryPrice;
}

// Calculate total price with new grant types
export function calculateTotalPriceWithGrant(
  system: SystemPackage,
  battery: BatteryOption | null,
  grantType: GrantType,
  location: Location
): { totalPrice: number; grantAmount: number; grossPrice: number } {
  // Base system price (without any grant)
  const systemGrossPrice = system.priceWithoutGrant;
  const batteryGrossPrice = battery?.price || 0;
  const grossPrice = systemGrossPrice + batteryGrossPrice;

  // Calculate grant based on type and location
  const grantAmount = calculateGrantAmount(
    system.systemSizeKw,
    battery?.capacityKwh || null,
    grantType,
    location
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
