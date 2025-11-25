// Types for GhawdeX Sales Portal

export interface WizardState {
  step: number;
  // Step 1: Address
  address: string;
  coordinates: { lat: number; lng: number } | null;

  // Step 2: Roof Analysis
  roofArea: number | null;
  maxPanels: number | null;
  annualSunshine: number | null;
  solarPotential: SolarPotential | null;

  // Step 3: Consumption
  monthlyBill: number | null;
  consumptionKwh: number | null;

  // Step 4: System Selection
  selectedSystem: SystemPackage | null;
  withBattery: boolean;
  batterySize: number | null;
  grantPath: boolean;

  // Step 5: Financing
  paymentMethod: 'cash' | 'loan' | null;
  loanTerm: number | null;

  // Step 6: Contact
  fullName: string;
  email: string;
  phone: string;
  notes: string;

  // Calculated values
  totalPrice: number | null;
  monthlyPayment: number | null;
  annualSavings: number | null;
  paybackYears: number | null;
}

export interface SolarPotential {
  maxArrayPanelsCount: number;
  maxArrayAreaMeters2: number;
  maxSunshineHoursPerYear: number;
  carbonOffsetFactorKgPerMwh: number;
  panelCapacityWatts: number;
  panelHeightMeters: number;
  panelWidthMeters: number;
  yearlyEnergyDcKwh: number;
}

export interface SystemPackage {
  id: string;
  name: string;
  panels: number;
  panelWattage: number;
  systemSizeKw: number;
  inverterModel: string;
  annualProductionKwh: number;
  priceWithGrant: number;
  priceWithoutGrant: number;
  grantAmount: number;
}

export interface BatteryOption {
  id: string;
  name: string;
  capacityKwh: number;
  price: number;
}

export interface FinancingOption {
  term: number; // months
  interestRate: number;
  monthlyPayment: number;
  totalCost: number;
}

export interface Lead {
  id?: string;
  created_at?: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  coordinates: { lat: number; lng: number } | null;
  monthly_bill: number | null;
  consumption_kwh: number | null;
  roof_area: number | null;
  selected_system: string | null;
  system_size_kw: number | null;
  with_battery: boolean;
  battery_size_kwh: number | null;
  grant_path: boolean;
  payment_method: string | null;
  loan_term: number | null;
  total_price: number | null;
  monthly_payment: number | null;
  annual_savings: number | null;
  notes: string | null;
  status: 'new' | 'contacted' | 'quoted' | 'signed' | 'installed' | 'lost';
  source: string;
}

// Malta-specific constants
export const MALTA_CONSTANTS = {
  // Electricity rates
  ELECTRICITY_RATE_WITH_GRANT: 0.105, // €/kWh with government grant
  ELECTRICITY_RATE_NO_GRANT: 0.15, // €/kWh without grant

  // Feed-in tariff
  FEED_IN_TARIFF: 0.055, // €/kWh

  // Grant limits
  MAX_GRANT_AMOUNT: 2400, // €
  GRANT_PER_KWP: 300, // € per kWp (up to 8 kWp)

  // System assumptions
  SELF_CONSUMPTION_RATIO: 0.7, // 70% self-consumption
  SYSTEM_DEGRADATION: 0.005, // 0.5% per year
  SYSTEM_LIFETIME_YEARS: 25,

  // Sun hours (Malta average)
  PEAK_SUN_HOURS: 5.5, // hours per day
  ANNUAL_SUN_HOURS: 2000, // approximate

  // BOV Loan terms
  BOV_INTEREST_RATE: 0.0475, // 4.75% APR
  BOV_MAX_TERM_MONTHS: 120, // 10 years
};

// System packages based on GhawdeX products
export const SYSTEM_PACKAGES: SystemPackage[] = [
  {
    id: 'starter-3kw',
    name: 'Starter',
    panels: 6,
    panelWattage: 500,
    systemSizeKw: 3,
    inverterModel: 'Huawei SUN2000-3KTL-L1',
    annualProductionKwh: 4500,
    priceWithGrant: 4050,
    priceWithoutGrant: 4950,
    grantAmount: 900,
  },
  {
    id: 'essential-5kw',
    name: 'Essential',
    panels: 10,
    panelWattage: 500,
    systemSizeKw: 5,
    inverterModel: 'Huawei SUN2000-5KTL-L1',
    annualProductionKwh: 7500,
    priceWithGrant: 5550,
    priceWithoutGrant: 7050,
    grantAmount: 1500,
  },
  {
    id: 'comfort-6kw',
    name: 'Comfort',
    panels: 12,
    panelWattage: 500,
    systemSizeKw: 6,
    inverterModel: 'Huawei SUN2000-6KTL-L1',
    annualProductionKwh: 9000,
    priceWithGrant: 6300,
    priceWithoutGrant: 8100,
    grantAmount: 1800,
  },
  {
    id: 'premium-8kw',
    name: 'Premium',
    panels: 16,
    panelWattage: 500,
    systemSizeKw: 8,
    inverterModel: 'Huawei SUN2000-8KTL-L1',
    annualProductionKwh: 12000,
    priceWithGrant: 7800,
    priceWithoutGrant: 10200,
    grantAmount: 2400,
  },
  {
    id: 'max-10kw',
    name: 'Max',
    panels: 20,
    panelWattage: 500,
    systemSizeKw: 10,
    inverterModel: 'Huawei SUN2000-10KTL-M1',
    annualProductionKwh: 15000,
    priceWithGrant: 9100,
    priceWithoutGrant: 11500,
    grantAmount: 2400, // capped at 2400
  },
];

export const BATTERY_OPTIONS: BatteryOption[] = [
  { id: 'luna-5', name: 'Huawei LUNA2000-5-S0', capacityKwh: 5, price: 3500 },
  { id: 'luna-10', name: 'Huawei LUNA2000-10-S0', capacityKwh: 10, price: 6500 },
  { id: 'luna-15', name: 'Huawei LUNA2000-15-S0', capacityKwh: 15, price: 9500 },
];
