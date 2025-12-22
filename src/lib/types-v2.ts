// Types for GhawdeX Sales Portal V2 - Revolution Wizard
// New 6-step flow: Region → Calculator → Safety → Contact → System → Location

import { Location, GrantType, SystemPackage, BatteryOption, SolarPotential } from './types';

// Extras from backoffice
export interface ExtrasSelection {
  salvaVita: boolean;      // RCD - €150 (local Maltese term)
  ovr: boolean;            // Surge protection - €150
  dbUpgrade: boolean;      // Full DB upgrade - €399 (bundle includes both)
  emergencyBackup: boolean; // €350 - whole house backup
}

export const EXTRAS_PRICING = {
  salvaVita: 150,
  ovr: 150,
  dbUpgrade: 399,      // Bundle price (includes Salva Vita + OVR + upgrade)
  emergencyBackup: 350,
} as const;

// Calculate extras total
export function calculateExtrasTotal(extras: ExtrasSelection): number {
  let total = 0;

  if (extras.dbUpgrade) {
    // Bundle includes everything
    total += EXTRAS_PRICING.dbUpgrade;
  } else {
    if (extras.salvaVita) total += EXTRAS_PRICING.salvaVita;
    if (extras.ovr) total += EXTRAS_PRICING.ovr;
  }

  if (extras.emergencyBackup) total += EXTRAS_PRICING.emergencyBackup;

  return total;
}

// V2 Wizard State - New streamlined flow
export interface WizardStateV2 {
  step: number;
  totalSteps: number;

  // Step 1: Region Selection
  location: Location;
  isBatteryOnly: boolean;  // Toggle for existing solar customers

  // Step 2: Instant Calculator
  monthlyBill: number | null;
  estimatedSavings: number | null;
  estimatedSystemSize: number | null;
  recommendedPackage: string | null;  // Package ID

  // Step 3: Safety & Extras
  extras: ExtrasSelection;
  hasOldFusebox: boolean | null;  // Drives DB upgrade recommendation

  // Step 4: Contact (Lead created here!)
  fullName: string;
  email: string;
  phone: string;
  leadId: string | null;
  zohoLeadId: string | null;
  isPrefilledLead: boolean;

  // Step 5: System Configuration
  selectedSystem: SystemPackage | null;
  withBattery: boolean;
  batterySize: number | null;
  grantType: GrantType;

  // Step 6: Location & Summary
  address: string;
  coordinates: { lat: number; lng: number } | null;
  googleMapsLink: string | null;
  roofArea: number | null;
  maxPanels: number | null;
  solarPotential: SolarPotential | null;

  // Calculated values
  totalPrice: number | null;
  grantAmount: number | null;
  extrasTotal: number | null;
  depositAmount: number | null;
  monthlyPayment: number | null;
  annualSavings: number | null;
  paybackYears: number | null;

  // Payment
  paymentMethod: 'cash' | 'loan' | null;
  loanTerm: number | null;

  // Social login
  socialProvider: 'google' | 'facebook' | null;
  isSocialLogin: boolean;

  // Notes
  notes: string;
}

// Initial state
export const initialWizardStateV2: WizardStateV2 = {
  step: 1,
  totalSteps: 6,

  // Step 1
  location: 'malta',
  isBatteryOnly: false,

  // Step 2
  monthlyBill: null,
  estimatedSavings: null,
  estimatedSystemSize: null,
  recommendedPackage: null,

  // Step 3
  extras: {
    salvaVita: false,
    ovr: false,
    dbUpgrade: false,
    emergencyBackup: true,  // Default ON - 95% adoption
  },
  hasOldFusebox: null,

  // Step 4
  fullName: '',
  email: '',
  phone: '',
  leadId: null,
  zohoLeadId: null,
  isPrefilledLead: false,

  // Step 5
  selectedSystem: null,
  withBattery: true,
  batterySize: null,
  grantType: 'pv_battery',

  // Step 6
  address: '',
  coordinates: null,
  googleMapsLink: null,
  roofArea: null,
  maxPanels: null,
  solarPotential: null,

  // Calculated
  totalPrice: null,
  grantAmount: null,
  extrasTotal: null,
  depositAmount: null,
  monthlyPayment: null,
  annualSavings: null,
  paybackYears: null,

  // Payment
  paymentMethod: null,
  loanTerm: null,

  // Social
  socialProvider: null,
  isSocialLogin: false,

  // Notes
  notes: '',
};

// Action types for reducer
export type WizardActionV2 =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SET_REGION'; payload: { location: Location; isBatteryOnly: boolean } }
  | { type: 'SET_CALCULATOR'; payload: { monthlyBill: number; estimatedSavings: number; estimatedSystemSize: number; recommendedPackage: string } }
  | { type: 'SET_EXTRAS'; payload: { extras: ExtrasSelection; hasOldFusebox: boolean | null } }
  | { type: 'SET_CONTACT'; payload: { fullName: string; email: string; phone: string } }
  | { type: 'SET_LEAD_ID'; payload: { leadId: string } }
  | { type: 'SET_SYSTEM'; payload: { system: SystemPackage | null; withBattery: boolean; batterySize: number | null; grantType: GrantType } }
  | { type: 'SET_LOCATION'; payload: { address: string; coordinates: { lat: number; lng: number } | null; googleMapsLink: string | null } }
  | { type: 'SET_SOLAR_DATA'; payload: { roofArea: number; maxPanels: number; solarPotential: SolarPotential | null } }
  | { type: 'SET_CALCULATIONS'; payload: { totalPrice: number; grantAmount: number; extrasTotal: number; depositAmount: number; monthlyPayment: number | null; annualSavings: number; paybackYears: number } }
  | { type: 'SET_FINANCING'; payload: { paymentMethod: 'cash' | 'loan'; loanTerm: number | null } }
  | { type: 'SET_SOCIAL_LOGIN'; payload: { fullName: string; email: string; socialProvider: 'google' | 'facebook' } }
  | { type: 'SET_PREFILL'; payload: { fullName: string; email: string; phone: string; zohoLeadId: string } }
  | { type: 'RESET' };

// Step labels for progress bar
export const WIZARD_V2_STEPS = [
  { number: 1, label: 'Region', shortLabel: 'Island' },
  { number: 2, label: 'Calculator', shortLabel: 'Bill' },
  { number: 3, label: 'Safety', shortLabel: 'Safety' },
  { number: 4, label: 'Contact', shortLabel: 'You' },
  { number: 5, label: 'System', shortLabel: 'System' },
  { number: 6, label: 'Location', shortLabel: 'Address' },
] as const;

// Grant data by location
export const GRANT_DATA_V2 = {
  malta: {
    name: 'Malta',
    solarGrant: 3000,
    solarPercent: 50,
    batteryGrant: 7200,
    batteryPercent: 80,
    totalGrant: 10200,
  },
  gozo: {
    name: 'Gozo',
    solarGrant: 3000,
    solarPercent: 50,
    batteryGrant: 8550,
    batteryPercent: 95,
    totalGrant: 11550,
  },
} as const;
