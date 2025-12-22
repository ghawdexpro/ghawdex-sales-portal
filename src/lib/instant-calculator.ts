// Instant Calculator for V2 Wizard
// Converts monthly bill to instant savings estimate

import { SYSTEM_PACKAGES, BATTERY_OPTIONS, Location } from './types';
import { GRANT_DATA_V2 } from './types-v2';

// Quick estimation constants
const AVERAGE_RATE = 0.15;  // €/kWh average
const SELF_CONSUMPTION = 0.70;  // 70% self-consumption
const FEED_IN_TARIFF = 0.055;  // €/kWh export rate
const SUN_HOURS_ANNUAL = 2000;  // Malta average

export interface InstantCalculation {
  monthlyBill: number;
  annualBill: number;
  estimatedConsumptionKwh: number;
  recommendedSystemKw: number;
  recommendedPackageId: string;
  recommendedPackageName: string;
  annualProduction: number;
  annualSavings: number;
  monthlySavings: number;
  percentageSaved: number;
  paybackYears: number;
  // Pricing
  grossPrice: number;
  grantAmount: number;
  netPrice: number;
  // Location-specific
  location: Location;
  batteryGrant: number;
  batteryPercent: number;
}

/**
 * Instant calculation from monthly bill
 * Used on Step 2 to show immediate value
 */
export function calculateInstant(
  monthlyBill: number,
  location: Location = 'malta',
  withBattery: boolean = true
): InstantCalculation {
  const annualBill = monthlyBill * 12;

  // Estimate consumption from bill
  const estimatedConsumptionKwh = Math.round(annualBill / AVERAGE_RATE);

  // Recommend system size (cover ~90% of consumption)
  const targetProduction = estimatedConsumptionKwh * 0.9;
  const recommendedSystemKw = Math.ceil(targetProduction / SUN_HOURS_ANNUAL);

  // Find best matching package
  const sortedPackages = [...SYSTEM_PACKAGES].sort((a, b) => a.systemSizeKw - b.systemSizeKw);
  let recommendedPackage = sortedPackages[0];

  for (const pkg of sortedPackages) {
    if (pkg.systemSizeKw >= recommendedSystemKw) {
      recommendedPackage = pkg;
      break;
    }
    recommendedPackage = pkg;  // Use largest if none match
  }

  // Calculate production and savings
  const annualProduction = recommendedPackage.annualProductionKwh;
  const selfConsumed = annualProduction * SELF_CONSUMPTION;
  const exported = annualProduction * (1 - SELF_CONSUMPTION);

  const savingsFromSelfConsumption = selfConsumed * AVERAGE_RATE;
  const feedInRevenue = exported * FEED_IN_TARIFF;
  const annualSavings = Math.round(savingsFromSelfConsumption + feedInRevenue);
  const monthlySavings = Math.round(annualSavings / 12);

  const percentageSaved = Math.min(95, Math.round((annualSavings / annualBill) * 100));

  // Pricing with grants
  const grantData = GRANT_DATA_V2[location];

  // Get battery for calculation (10kWh default)
  const defaultBattery = BATTERY_OPTIONS.find(b => b.capacityKwh === 10) || BATTERY_OPTIONS[1];

  let grossPrice: number;
  let grantAmount: number;

  if (withBattery) {
    grossPrice = recommendedPackage.priceWithBattery + defaultBattery.price;
    grantAmount = Math.min(
      grantData.solarGrant + grantData.batteryGrant,
      grantData.totalGrant
    );
  } else {
    grossPrice = recommendedPackage.priceWithGrant;
    grantAmount = grantData.solarGrant;
  }

  const netPrice = Math.max(0, grossPrice - grantAmount);
  const paybackYears = annualSavings > 0 ? Math.round((netPrice / annualSavings) * 10) / 10 : 99;

  return {
    monthlyBill,
    annualBill,
    estimatedConsumptionKwh,
    recommendedSystemKw: recommendedPackage.systemSizeKw,
    recommendedPackageId: recommendedPackage.id,
    recommendedPackageName: recommendedPackage.name,
    annualProduction,
    annualSavings,
    monthlySavings,
    percentageSaved,
    paybackYears,
    grossPrice,
    grantAmount,
    netPrice,
    location,
    batteryGrant: grantData.batteryGrant,
    batteryPercent: grantData.batteryPercent,
  };
}

/**
 * Format savings as "€X,XXX/year" or "€XXX/month"
 */
export function formatSavings(amount: number, period: 'year' | 'month' = 'year'): string {
  return `€${amount.toLocaleString('en-MT')}/${period}`;
}

/**
 * Get quick headline based on savings
 */
export function getSavingsHeadline(calculation: InstantCalculation): string {
  const { monthlySavings, percentageSaved, location } = calculation;

  if (percentageSaved >= 80) {
    return location === 'gozo'
      ? `Save €${monthlySavings}/month - Gozo 95% Battery Grant!`
      : `Save €${monthlySavings}/month - Slash Your Bills by ${percentageSaved}%!`;
  }

  if (percentageSaved >= 60) {
    return `€${monthlySavings} Monthly Savings - ${percentageSaved}% Reduction!`;
  }

  return `Save €${monthlySavings}/month on Electricity`;
}

/**
 * Battery-only calculation for existing solar customers
 */
export function calculateBatteryOnly(
  location: Location = 'malta',
  batteryKwh: number = 10
): {
  grossPrice: number;
  grantAmount: number;
  netPrice: number;
  grantPercent: number;
  annualSavings: number;
} {
  const grantData = GRANT_DATA_V2[location];
  const battery = BATTERY_OPTIONS.find(b => b.capacityKwh === batteryKwh) || BATTERY_OPTIONS[1];

  const grossPrice = battery.price + 350;  // +Emergency backup
  const grantPercent = grantData.batteryPercent;
  const grantAmount = Math.min(
    Math.round(battery.price * (grantPercent / 100)),
    grantData.batteryGrant
  );
  const netPrice = Math.max(0, grossPrice - grantAmount);

  // Battery savings estimate (300 cycles/year, 90% efficiency)
  const annualSavings = Math.round(batteryKwh * 0.95 * 0.90 * 300 * 0.20);

  return {
    grossPrice,
    grantAmount,
    netPrice,
    grantPercent,
    annualSavings,
  };
}
