'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';
import { WizardState, SystemPackage, SolarPotential } from '@/lib/types';

const initialState: WizardState = {
  step: 1,
  address: '',
  coordinates: null,
  roofArea: null,
  maxPanels: null,
  annualSunshine: null,
  solarPotential: null,
  monthlyBill: null,
  consumptionKwh: null,
  selectedSystem: null,
  withBattery: false,
  batterySize: null,
  grantPath: true,
  paymentMethod: null,
  loanTerm: null,
  fullName: '',
  email: '',
  phone: '',
  notes: '',
  totalPrice: null,
  monthlyPayment: null,
  annualSavings: null,
  paybackYears: null,
};

type WizardAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SET_ADDRESS'; payload: { address: string; coordinates: { lat: number; lng: number } | null } }
  | { type: 'SET_SOLAR_DATA'; payload: { roofArea: number; maxPanels: number; annualSunshine: number; solarPotential: SolarPotential | null } }
  | { type: 'SET_CONSUMPTION'; payload: { monthlyBill: number; consumptionKwh: number } }
  | { type: 'SET_SYSTEM'; payload: { system: SystemPackage; withBattery: boolean; batterySize: number | null; grantPath: boolean } }
  | { type: 'SET_FINANCING'; payload: { paymentMethod: 'cash' | 'loan'; loanTerm: number | null } }
  | { type: 'SET_CONTACT'; payload: { fullName: string; email: string; phone: string; notes: string } }
  | { type: 'SET_CALCULATIONS'; payload: { totalPrice: number; monthlyPayment: number | null; annualSavings: number; paybackYears: number } }
  | { type: 'RESET' };

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.payload };
    case 'NEXT_STEP':
      return { ...state, step: state.step + 1 };
    case 'PREV_STEP':
      return { ...state, step: Math.max(1, state.step - 1) };
    case 'SET_ADDRESS':
      return { ...state, ...action.payload };
    case 'SET_SOLAR_DATA':
      return { ...state, ...action.payload };
    case 'SET_CONSUMPTION':
      return { ...state, ...action.payload };
    case 'SET_SYSTEM':
      return {
        ...state,
        selectedSystem: action.payload.system,
        withBattery: action.payload.withBattery,
        batterySize: action.payload.batterySize,
        grantPath: action.payload.grantPath,
      };
    case 'SET_FINANCING':
      return { ...state, ...action.payload };
    case 'SET_CONTACT':
      return { ...state, ...action.payload };
    case 'SET_CALCULATIONS':
      return { ...state, ...action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface WizardContextType {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

const WizardContext = createContext<WizardContextType | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  return (
    <WizardContext.Provider value={{ state, dispatch }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
}
