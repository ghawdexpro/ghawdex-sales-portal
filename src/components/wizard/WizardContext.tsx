'use client';

import { createContext, useContext, useReducer, useEffect, useRef, useCallback, ReactNode } from 'react';
import { WizardState, SystemPackage, SolarPotential, Location, GrantType, WizardSession } from '@/lib/types';
import {
  getSessionToken,
  wizardStateToSessionData,
  flushPendingSave,
} from '@/lib/wizard-session';

const initialState: WizardState = {
  step: 1,
  address: '',
  coordinates: null,
  location: 'malta',
  roofArea: null,
  maxPanels: null,
  annualSunshine: null,
  solarPotential: null,
  solarDataIsFallback: false,
  householdSize: null,
  monthlyBill: null,
  consumptionKwh: null,
  billFileUrl: null,
  selectedSystem: null,
  withBattery: false,
  batterySize: null,
  grantType: 'pv_only',
  grantPath: true, // Legacy
  paymentMethod: null,
  loanTerm: null,
  fullName: '',
  email: '',
  phone: '',
  notes: '',
  zohoLeadId: null,
  isPrefilledLead: false,
  socialProvider: null,
  isSocialLogin: false,
  totalPrice: null,
  monthlyPayment: null,
  annualSavings: null,
  paybackYears: null,
};

type WizardAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SET_ADDRESS'; payload: { address: string; coordinates: { lat: number; lng: number } | null; location: Location } }
  | { type: 'SET_SOLAR_DATA'; payload: { roofArea: number; maxPanels: number; annualSunshine: number; solarPotential: SolarPotential | null; isFallback?: boolean } }
  | { type: 'SET_CONSUMPTION'; payload: { householdSize: number; monthlyBill: number; consumptionKwh: number } }
  | { type: 'SET_BILL_FILE'; payload: { billFileUrl: string | null } }
  | { type: 'SET_SYSTEM'; payload: { system: SystemPackage | null; withBattery: boolean; batterySize: number | null; grantType: GrantType } }
  | { type: 'SET_FINANCING'; payload: { paymentMethod: 'cash' | 'loan'; loanTerm: number | null } }
  | { type: 'SET_CONTACT'; payload: { fullName: string; email: string; phone: string; notes: string } }
  | { type: 'SET_SOCIAL_LOGIN'; payload: { fullName: string; email: string; socialProvider: 'google' | 'facebook' } }
  | { type: 'SET_CALCULATIONS'; payload: { totalPrice: number; monthlyPayment: number | null; annualSavings: number; paybackYears: number } }
  | { type: 'SET_PREFILL'; payload: { fullName: string; email: string; phone: string; zohoLeadId: string } }
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
      return { ...state, ...action.payload, solarDataIsFallback: action.payload.isFallback || false };
    case 'SET_CONSUMPTION':
      return { ...state, ...action.payload };
    case 'SET_BILL_FILE':
      return { ...state, billFileUrl: action.payload.billFileUrl };
    case 'SET_SYSTEM':
      return {
        ...state,
        selectedSystem: action.payload.system,
        withBattery: action.payload.withBattery,
        batterySize: action.payload.batterySize,
        grantType: action.payload.grantType,
        grantPath: action.payload.grantType !== 'none', // Legacy compatibility
      };
    case 'SET_FINANCING':
      return { ...state, ...action.payload };
    case 'SET_CONTACT':
      return { ...state, ...action.payload };
    case 'SET_SOCIAL_LOGIN':
      return {
        ...state,
        fullName: action.payload.fullName,
        email: action.payload.email,
        socialProvider: action.payload.socialProvider,
        isSocialLogin: true,
      };
    case 'SET_CALCULATIONS':
      return { ...state, ...action.payload };
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
      return initialState;
    default:
      return state;
  }
}

interface WizardContextType {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  sessionId: string | null;
  sessionToken: string | null;
}

const WizardContext = createContext<WizardContextType | null>(null);

// Debounce timeout in milliseconds
const SAVE_DEBOUNCE_MS = 1000;

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wizardReducer, initialState);
  const sessionIdRef = useRef<string | null>(null);
  const sessionTokenRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Partial<WizardSession>>({});
  const isInitializedRef = useRef(false);

  // Initialize session on mount
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const initSession = async () => {
      try {
        const token = getSessionToken();
        sessionTokenRef.current = token;

        // Try to get existing session or create new one
        const response = await fetch('/api/wizard-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_token: token }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.session) {
            sessionIdRef.current = data.session.id;

            // If resuming an existing session with progress, we could restore state here
            // For now, we just track the session ID
          }
        }
      } catch (error) {
        console.error('Failed to initialize wizard session:', error);
      }
    };

    initSession();
  }, []);

  // Save session data with debouncing
  const saveSession = useCallback(async (updates: Partial<WizardSession>) => {
    if (!sessionIdRef.current) return;

    // Merge with pending updates
    pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(async () => {
      if (!sessionIdRef.current || Object.keys(pendingUpdatesRef.current).length === 0) {
        return;
      }

      try {
        await fetch('/api/wizard-sessions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionIdRef.current,
            ...pendingUpdatesRef.current,
          }),
        });
        pendingUpdatesRef.current = {};
      } catch (error) {
        console.error('Failed to save wizard session:', error);
      }
    }, SAVE_DEBOUNCE_MS);
  }, []);

  // Auto-save on state changes
  useEffect(() => {
    // Don't save on initial render or if no session
    if (!sessionIdRef.current) return;

    const sessionData = wizardStateToSessionData(state);
    saveSession(sessionData);
  }, [state, saveSession]);

  // Flush pending saves before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Synchronously try to save (may not always work on unload)
      if (sessionIdRef.current && Object.keys(pendingUpdatesRef.current).length > 0) {
        const data = JSON.stringify({
          session_id: sessionIdRef.current,
          ...pendingUpdatesRef.current,
        });

        // Use sendBeacon for reliable delivery on page unload
        navigator.sendBeacon('/api/wizard-sessions', data);
      }

      flushPendingSave();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <WizardContext.Provider value={{
      state,
      dispatch,
      sessionId: sessionIdRef.current,
      sessionToken: sessionTokenRef.current,
    }}>
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
