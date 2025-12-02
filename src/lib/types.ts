// Types for GhawdeX Sales Portal

export type Location = 'malta' | 'gozo';
export type GrantType = 'none' | 'pv_only' | 'pv_battery' | 'battery_only';
export type WizardSessionStatus = 'in_progress' | 'abandoned' | 'completed' | 'converted_to_lead';

export interface WizardState {
  step: number;
  // Step 1: Address
  address: string;
  coordinates: { lat: number; lng: number } | null;
  location: Location;

  // Step 2: Roof Analysis
  roofArea: number | null;
  maxPanels: number | null;
  annualSunshine: number | null;
  solarPotential: SolarPotential | null;
  solarDataIsFallback: boolean;

  // Step 2: Consumption
  householdSize: number | null;
  monthlyBill: number | null;
  consumptionKwh: number | null;
  billFileUrl: string | null; // Optional uploaded electricity bill

  // Step 4: System Selection
  selectedSystem: SystemPackage | null;
  withBattery: boolean;
  batterySize: number | null;
  grantType: GrantType;
  grantPath: boolean; // Legacy - kept for compatibility

  // Step 5: Financing
  paymentMethod: 'cash' | 'loan' | null;
  loanTerm: number | null;

  // Step 6: Contact
  fullName: string;
  email: string;
  phone: string;
  notes: string;

  // CRM Pre-fill (from Zoho link)
  zohoLeadId: string | null;
  isPrefilledLead: boolean;

  // Social login
  socialProvider: 'google' | 'facebook' | null;
  isSocialLogin: boolean;

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
  priceWithGrant: number;      // PV-only price (higher, original pricing)
  priceWithoutGrant: number;   // PV-only price (higher, original pricing)
  priceWithBattery: number;    // PV+Battery bundle price (lower, discounted)
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
  name: string;
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
  zoho_lead_id: string | null;
  status: 'new' | 'contacted' | 'quoted' | 'signed' | 'installed' | 'lost';
  source: string;
  bill_file_url: string | null;
  social_provider: string | null;
}

// Partial lead for abandoned/incomplete leads (social login recovery)
export interface PartialLead {
  id?: string;
  created_at?: string;
  updated_at?: string;
  email: string;
  name: string | null;
  social_provider: 'google' | 'facebook' | null;
  last_step: number;
  phone: string | null;
  wizard_state: Partial<WizardState> | null;
  reminder_count: number;
  last_reminder_at: string | null;
  next_reminder_at: string | null;
  converted_to_lead: boolean;
  converted_at: string | null;
  lead_id: string | null;
}

export interface WizardSession {
  id?: string;
  created_at?: string;
  updated_at?: string;
  last_activity_at?: string;
  session_token: string;
  status: WizardSessionStatus;
  current_step: number;
  highest_step_reached: number;

  // Step 1: Location
  address: string | null;
  coordinates: { lat: number; lng: number } | null;
  location: Location | null;

  // Step 1→2: Solar analysis
  roof_area: number | null;
  max_panels: number | null;
  annual_sunshine: number | null;
  solar_potential: SolarPotential | null;
  solar_data_is_fallback: boolean;

  // Step 2: Consumption
  household_size: number | null;
  monthly_bill: number | null;
  consumption_kwh: number | null;

  // Step 3: System selection
  selected_system: string | null;
  system_size_kw: number | null;
  with_battery: boolean;
  battery_size_kwh: number | null;
  grant_type: GrantType | null;

  // Step 4: Financing
  payment_method: 'cash' | 'loan' | null;
  loan_term: number | null;
  total_price: number | null;
  monthly_payment: number | null;
  annual_savings: number | null;
  payback_years: number | null;

  // Step 5: Contact
  full_name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;

  // Pre-fill from Zoho
  zoho_lead_id: string | null;
  is_prefilled_lead: boolean;

  // Conversion tracking
  converted_lead_id: string | null;

  // Analytics
  device_info: DeviceInfo | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  step_timestamps: Record<number, string>;
  total_duration_seconds: number;
}

export interface DeviceInfo {
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  language: string;
  platform: string;
  isMobile: boolean;
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

  // Grant limits (legacy)
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

// Grant Scheme 2025 - Official REWS rates
export const GRANT_SCHEME_2025 = {
  // Feed-in Tariff rates
  FIT_WITH_GRANT: 0.105, // €/kWh for 20 years
  FIT_WITHOUT_GRANT: 0.15, // €/kWh for 20 years

  // PV System Grants
  PV_STANDARD_INVERTER: {
    percentage: 0.5, // 50% of eligible costs
    maxTotal: 2500, // € max per system
    perKwp: 625, // € per kWp
  },
  PV_HYBRID_INVERTER: {
    percentage: 0.5, // 50% of eligible costs
    maxTotal: 3000, // € max per system
    perKwp: 750, // € per kWp
  },

  // Battery Storage Grants
  BATTERY: {
    malta: {
      percentage: 0.8, // 80% of battery costs
      maxTotal: 7200, // € max
      perKwh: 720, // € per kWh
    },
    gozo: {
      percentage: 0.95, // 95% of battery costs (Gozo bonus)
      maxTotal: 8550, // € max (higher cap for Gozo)
      perKwh: 720, // € per kWh
    },
  },

  // Hybrid Inverter for Battery
  HYBRID_INVERTER_FOR_BATTERY: {
    percentage: 0.8, // 80% of hybrid inverter costs
    maxTotal: 1800, // € max
    perKwp: 450, // € per kWp
  },

  // Maximum Total Grants
  MAX_TOTAL: {
    malta: 10200, // € maximum total grant
    gozo: 11550, // € maximum total grant (Gozo gets more)
  },
};

// Helper function to detect location from coordinates
export function detectLocation(lat: number): Location {
  // Gozo is north of Malta, roughly above latitude 36.0
  // Gozo: approximately 36.04 - 36.08
  // Malta: approximately 35.80 - 35.99
  return lat >= 36.0 ? 'gozo' : 'malta';
}

// Helper function to calculate grant amount
// Now includes actual costs to apply percentage caps correctly
export function calculateGrantAmount(
  systemSizeKw: number,
  batteryKwh: number | null,
  grantType: GrantType,
  location: Location,
  systemPrice?: number,
  batteryPrice?: number
): number {
  if (grantType === 'none') return 0;

  let totalGrant = 0;
  const maxTotal = GRANT_SCHEME_2025.MAX_TOTAL[location];

  if (grantType === 'pv_only') {
    // PV with hybrid inverter (most common)
    // Grant is 50% of eligible costs, capped at €750/kWp and €3,000 total
    const kwhBasedGrant = systemSizeKw * GRANT_SCHEME_2025.PV_HYBRID_INVERTER.perKwp;
    const percentageBasedGrant = systemPrice
      ? systemPrice * GRANT_SCHEME_2025.PV_HYBRID_INVERTER.percentage
      : kwhBasedGrant;

    const pvGrant = Math.min(
      kwhBasedGrant,
      percentageBasedGrant,
      GRANT_SCHEME_2025.PV_HYBRID_INVERTER.maxTotal
    );
    totalGrant = pvGrant;
  } else if (grantType === 'pv_battery') {
    // PV + Battery grant
    // PV: 50% of eligible costs, capped at €750/kWp and €3,000 total
    const pvKwhBasedGrant = systemSizeKw * GRANT_SCHEME_2025.PV_HYBRID_INVERTER.perKwp;
    const pvPercentageBasedGrant = systemPrice
      ? systemPrice * GRANT_SCHEME_2025.PV_HYBRID_INVERTER.percentage
      : pvKwhBasedGrant;

    const pvGrant = Math.min(
      pvKwhBasedGrant,
      pvPercentageBasedGrant,
      GRANT_SCHEME_2025.PV_HYBRID_INVERTER.maxTotal
    );

    // Battery: 80% (Malta) or 95% (Gozo) of battery costs
    let batteryGrant = 0;
    if (batteryKwh && batteryKwh > 0) {
      const batteryKwhBasedGrant = batteryKwh * GRANT_SCHEME_2025.BATTERY[location].perKwh;
      const batteryPercentageBasedGrant = batteryPrice
        ? batteryPrice * GRANT_SCHEME_2025.BATTERY[location].percentage
        : batteryKwhBasedGrant;

      batteryGrant = Math.min(
        batteryKwhBasedGrant,
        batteryPercentageBasedGrant,
        GRANT_SCHEME_2025.BATTERY[location].maxTotal
      );
    }

    // Note: HYBRID_INVERTER_FOR_BATTERY grant is for upgrading EXISTING systems only
    // For new PV+battery installations, the hybrid inverter is already included in PV_HYBRID_INVERTER rates
    totalGrant = pvGrant + batteryGrant;
  } else if (grantType === 'battery_only') {
    // Battery-only grant (for customers who already have solar or want standalone battery)
    // Battery: 80% (Malta) or 95% (Gozo) of battery costs
    // Note: Battery price includes all necessary hardware (inverter, integration, etc.)
    // so we only apply the battery grant, not a separate inverter grant
    let batteryGrant = 0;
    if (batteryKwh && batteryKwh > 0) {
      const batteryKwhBasedGrant = batteryKwh * GRANT_SCHEME_2025.BATTERY[location].perKwh;
      const batteryPercentageBasedGrant = batteryPrice
        ? batteryPrice * GRANT_SCHEME_2025.BATTERY[location].percentage
        : batteryKwhBasedGrant;

      batteryGrant = Math.min(
        batteryKwhBasedGrant,
        batteryPercentageBasedGrant,
        GRANT_SCHEME_2025.BATTERY[location].maxTotal
      );
    }

    totalGrant = batteryGrant;
  }

  return Math.min(totalGrant, maxTotal);
}

// Helper function to get FIT rate based on grant type
export function getFitRate(grantType: GrantType): number {
  return grantType === 'none'
    ? GRANT_SCHEME_2025.FIT_WITHOUT_GRANT
    : GRANT_SCHEME_2025.FIT_WITH_GRANT;
}

// Standard System Packages (4 fixed options - custom quotes for anything else)
// Prices aligned with backoffice: 3.5k, 5.5k, 9.5k, 13.5k
export const SYSTEM_PACKAGES: SystemPackage[] = [
  {
    id: 'starter-3kw',
    name: 'Starter',
    panels: 7,
    panelWattage: 430,
    systemSizeKw: 3,
    inverterModel: 'Huawei SUN2000-3KTL-L1',
    annualProductionKwh: 4500,
    priceWithGrant: 3500,       // Standard price
    priceWithoutGrant: 3500,
    priceWithBattery: 2000,     // PV+Battery bundle price
    grantAmount: 2250,          // 50% of €3500 capped at €750/kWp = €2250
  },
  {
    id: 'essential-5kw',
    name: 'Essential',
    panels: 11,
    panelWattage: 455,
    systemSizeKw: 5,
    inverterModel: 'Huawei SUN2000-5KTL-L1',
    annualProductionKwh: 7500,
    priceWithGrant: 5500,       // Standard price
    priceWithoutGrant: 5500,
    priceWithBattery: 3000,     // PV+Battery bundle price
    grantAmount: 2750,          // 50% of €5500 capped at €3000 max = €2750
  },
  {
    id: 'performance-10kw',
    name: 'Performance',
    panels: 22,
    panelWattage: 455,
    systemSizeKw: 10,
    inverterModel: 'Huawei SUN2000-10KTL-M1',
    annualProductionKwh: 15000,
    priceWithGrant: 9500,       // Standard price
    priceWithoutGrant: 9500,
    priceWithBattery: 5000,     // PV+Battery bundle price
    grantAmount: 3000,          // Max grant €3000
  },
  {
    id: 'max-15kw',
    name: 'Max',
    panels: 33,
    panelWattage: 455,
    systemSizeKw: 15,
    inverterModel: 'Huawei SUN2000-15KTL-M5',
    annualProductionKwh: 22500,
    priceWithGrant: 13500,      // Standard price
    priceWithoutGrant: 13500,
    priceWithBattery: 7500,     // PV+Battery bundle price
    grantAmount: 3000,          // Max grant €3000
  },
];

// Battery pricing optimized to maximize 80% (Malta) / 95% (Gozo) grant
export const BATTERY_OPTIONS: BatteryOption[] = [
  { id: 'luna-5', name: 'Huawei LUNA2000-5-S0', capacityKwh: 5, price: 4000 },
  { id: 'luna-10', name: 'Huawei LUNA2000-10-S0', capacityKwh: 10, price: 7500 },
  { id: 'luna-15', name: 'Huawei LUNA2000-15-S0', capacityKwh: 15, price: 10500 },
];
