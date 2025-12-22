'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';
import {
  WizardStateV2,
  WizardActionV2,
  initialWizardStateV2,
  calculateExtrasTotal,
} from '@/lib/types-v2';

function wizardReducerV2(state: WizardStateV2, action: WizardActionV2): WizardStateV2 {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.payload };

    case 'NEXT_STEP':
      return { ...state, step: Math.min(state.step + 1, state.totalSteps) };

    case 'PREV_STEP':
      return { ...state, step: Math.max(1, state.step - 1) };

    case 'SET_REGION':
      return {
        ...state,
        location: action.payload.location,
        isBatteryOnly: action.payload.isBatteryOnly,
        // Update grant type based on battery-only toggle
        grantType: action.payload.isBatteryOnly ? 'battery_only' : 'pv_battery',
      };

    case 'SET_CALCULATOR':
      return {
        ...state,
        monthlyBill: action.payload.monthlyBill,
        estimatedSavings: action.payload.estimatedSavings,
        estimatedSystemSize: action.payload.estimatedSystemSize,
        recommendedPackage: action.payload.recommendedPackage,
      };

    case 'SET_EXTRAS':
      const extras = action.payload.extras;
      return {
        ...state,
        extras,
        hasOldFusebox: action.payload.hasOldFusebox,
        extrasTotal: calculateExtrasTotal(extras),
      };

    case 'SET_CONTACT':
      return {
        ...state,
        fullName: action.payload.fullName,
        email: action.payload.email,
        phone: action.payload.phone,
      };

    case 'SET_LEAD_ID':
      return {
        ...state,
        leadId: action.payload.leadId,
      };

    case 'SET_SYSTEM':
      return {
        ...state,
        selectedSystem: action.payload.system,
        withBattery: action.payload.withBattery,
        batterySize: action.payload.batterySize,
        grantType: action.payload.grantType,
      };

    case 'SET_LOCATION':
      return {
        ...state,
        address: action.payload.address,
        coordinates: action.payload.coordinates,
        googleMapsLink: action.payload.googleMapsLink,
      };

    case 'SET_SOLAR_DATA':
      return {
        ...state,
        roofArea: action.payload.roofArea,
        maxPanels: action.payload.maxPanels,
        solarPotential: action.payload.solarPotential,
      };

    case 'SET_CALCULATIONS':
      return {
        ...state,
        totalPrice: action.payload.totalPrice,
        grantAmount: action.payload.grantAmount,
        extrasTotal: action.payload.extrasTotal,
        depositAmount: action.payload.depositAmount,
        monthlyPayment: action.payload.monthlyPayment,
        annualSavings: action.payload.annualSavings,
        paybackYears: action.payload.paybackYears,
      };

    case 'SET_FINANCING':
      return {
        ...state,
        paymentMethod: action.payload.paymentMethod,
        loanTerm: action.payload.loanTerm,
      };

    case 'SET_SOCIAL_LOGIN':
      return {
        ...state,
        fullName: action.payload.fullName,
        email: action.payload.email,
        socialProvider: action.payload.socialProvider,
        isSocialLogin: true,
      };

    case 'SET_PREFILL':
      return {
        ...state,
        fullName: action.payload.fullName,
        email: action.payload.email,
        phone: action.payload.phone,
        zohoLeadId: action.payload.zohoLeadId,
        isPrefilledLead: true,
      };

    case 'RESET':
      return initialWizardStateV2;

    default:
      return state;
  }
}

interface WizardContextV2Type {
  state: WizardStateV2;
  dispatch: React.Dispatch<WizardActionV2>;
}

const WizardContextV2 = createContext<WizardContextV2Type | null>(null);

export function WizardProviderV2({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wizardReducerV2, initialWizardStateV2);

  return (
    <WizardContextV2.Provider value={{ state, dispatch }}>
      {children}
    </WizardContextV2.Provider>
  );
}

export function useWizardV2() {
  const context = useContext(WizardContextV2);
  if (!context) {
    throw new Error('useWizardV2 must be used within a WizardProviderV2');
  }
  return context;
}
