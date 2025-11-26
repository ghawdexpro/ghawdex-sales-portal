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

  // Step 2: Consumption
  householdSize: number | null;
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
  household_size: number | null;
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

// Malta Electricity Tariff Bands (Residential) - Annual kWh thresholds
// Source: Enemalta/ARMS 2024
export const RESIDENTIAL_TARIFF_BANDS = [
  { maxKwh: 2000, rate: 0.1047 },   // Band 1: 0-2,000 kWh
  { maxKwh: 6000, rate: 0.1298 },   // Band 2: 2,001-6,000 kWh
  { maxKwh: 10000, rate: 0.1607 },  // Band 3: 6,001-10,000 kWh
  { maxKwh: 20000, rate: 0.3420 },  // Band 4: 10,001-20,000 kWh
  { maxKwh: Infinity, rate: 0.6076 }, // Band 5: 20,001+ kWh
];

// Eco-reduction allowances per person per year
export const ECO_REDUCTION = {
  ALLOWANCE_PER_PERSON: 1750, // kWh per person per year
  FIRST_TIER_KWH: 1000, // First 1,000 kWh per person
  FIRST_TIER_DISCOUNT: 0.25, // 25% discount
  SECOND_TIER_KWH: 750, // Next 750 kWh per person
  SECOND_TIER_DISCOUNT: 0.15, // 15% discount
  SINGLE_PERSON_THRESHOLD: 2000, // Single person gets 25% if under 2,000 kWh
  SINGLE_PERSON_DISCOUNT: 0.25, // 25% discount for single person
};

// Fixed charges
export const FIXED_CHARGES = {
  SERVICE_CHARGE_SINGLE_PHASE: 65, // € per year
  SERVICE_CHARGE_THREE_PHASE: 195, // € per year
  MONTHLY_SERVICE_ESTIMATE: 5.42, // €65/12 for single phase
};

// Malta-specific constants
export const MALTA_CONSTANTS = {
  // Legacy flat rates (for reference/fallback)
  ELECTRICITY_RATE_WITH_GRANT: 0.105, // €/kWh average with government grant
  ELECTRICITY_RATE_NO_GRANT: 0.15, // €/kWh average without grant

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
    panels: 7,
    panelWattage: 450,
    systemSizeKw: 3,
    inverterModel: 'Huawei SUN2000-3KTL-L1',
    annualProductionKwh: 5400,
    priceWithGrant: 2250,
    priceWithoutGrant: 2250,
    grantAmount: 1500,
  },
  {
    id: 'essential-5kw',
    name: 'Essential',
    panels: 10,
    panelWattage: 450,
    systemSizeKw: 5,
    inverterModel: 'Huawei SUN2000-5KTL-L1',
    annualProductionKwh: 9000,
    priceWithGrant: 3750,
    priceWithoutGrant: 3750,
    grantAmount: 2500,
  },
  {
    id: 'performance-10kw',
    name: 'Performance',
    panels: 22,
    panelWattage: 450,
    systemSizeKw: 10,
    inverterModel: 'Huawei SUN2000-10KTL-M1',
    annualProductionKwh: 18000,
    priceWithGrant: 7500,
    priceWithoutGrant: 7500,
    grantAmount: 5000,
  },
  {
    id: 'max-15kw',
    name: 'Max',
    panels: 33,
    panelWattage: 450,
    systemSizeKw: 15,
    inverterModel: 'Huawei SUN2000-15KTL-M5',
    annualProductionKwh: 27000,
    priceWithGrant: 11250,
    priceWithoutGrant: 11250,
    grantAmount: 7500,
  },
];

export const BATTERY_OPTIONS: BatteryOption[] = [
  { id: 'luna-5', name: 'Huawei LUNA2000-5-S0', capacityKwh: 5, price: 3500 },
  { id: 'luna-10', name: 'Huawei LUNA2000-10-S0', capacityKwh: 10, price: 6500 },
  { id: 'luna-15', name: 'Huawei LUNA2000-15-S0', capacityKwh: 15, price: 9500 },
];
