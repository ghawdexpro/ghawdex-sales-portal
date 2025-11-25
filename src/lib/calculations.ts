import { MALTA_CONSTANTS, SystemPackage, BatteryOption, FinancingOption } from './types';

// Estimate monthly consumption from electricity bill
export function estimateConsumption(monthlyBill: number, hasGrant: boolean): number {
  const rate = hasGrant
    ? MALTA_CONSTANTS.ELECTRICITY_RATE_WITH_GRANT
    : MALTA_CONSTANTS.ELECTRICITY_RATE_NO_GRANT;

  // Remove standing charge estimate (roughly €10/month)
  const energyCharge = Math.max(monthlyBill - 10, 0);
  return Math.round(energyCharge / rate);
}

// Calculate annual savings
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

// Calculate total system price
export function calculateTotalPrice(
  system: SystemPackage,
  battery: BatteryOption | null,
  hasGrant: boolean
): number {
  const systemPrice = hasGrant ? system.priceWithGrant : system.priceWithoutGrant;
  const batteryPrice = battery?.price || 0;

  return systemPrice + batteryPrice;
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
