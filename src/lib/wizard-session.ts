// Wizard Session Persistence
// Saves wizard progress to capture partial leads

import { WizardState } from './types';
import type { WizardSession, DeviceInfo, WizardSessionStatus } from './types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// LocalStorage key for session token
const SESSION_TOKEN_KEY = 'ghawdex_wizard_session_token';

// Supabase fetch helper
async function supabaseFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${SUPABASE_URL}/rest/v1${endpoint}`;

  return fetch(url, {
    ...options,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers,
    },
  });
}

// Generate a UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Get device info for analytics
export function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      userAgent: '',
      screenWidth: 0,
      screenHeight: 0,
      language: '',
      platform: '',
      isMobile: false,
    };
  }

  const userAgent = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  return {
    userAgent,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    language: navigator.language,
    platform: navigator.platform,
    isMobile,
  };
}

// Get UTM parameters from URL
export function getUTMParams(): { utm_source: string | null; utm_medium: string | null; utm_campaign: string | null } {
  if (typeof window === 'undefined') {
    return { utm_source: null, utm_medium: null, utm_campaign: null };
  }

  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
  };
}

// Get or create session token from localStorage
export function getSessionToken(): string {
  if (typeof window === 'undefined') {
    return generateUUID();
  }

  let token = localStorage.getItem(SESSION_TOKEN_KEY);
  if (!token) {
    token = generateUUID();
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  }
  return token;
}

// Clear session token (on wizard completion)
export function clearSessionToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_TOKEN_KEY);
  }
}

// Convert WizardState to WizardSession data for saving
export function wizardStateToSessionData(state: WizardState): Partial<WizardSession> {
  return {
    current_step: state.step,
    address: state.address || null,
    coordinates: state.coordinates,
    google_maps_link: state.googleMapsLink || null,
    location: state.location || null,
    roof_area: state.roofArea,
    max_panels: state.maxPanels,
    annual_sunshine: state.annualSunshine,
    solar_potential: state.solarPotential,
    solar_data_is_fallback: state.solarDataIsFallback,
    household_size: state.householdSize,
    monthly_bill: state.monthlyBill,
    consumption_kwh: state.consumptionKwh,
    selected_system: state.selectedSystem?.id || null,
    system_size_kw: state.selectedSystem?.systemSizeKw || null,
    with_battery: state.withBattery,
    battery_size_kwh: state.batterySize,
    grant_type: state.grantType || null,
    payment_method: state.paymentMethod,
    loan_term: state.loanTerm,
    total_price: state.totalPrice,
    monthly_payment: state.monthlyPayment,
    annual_savings: state.annualSavings,
    payback_years: state.paybackYears,
    full_name: state.fullName || null,
    email: state.email || null,
    phone: state.phone || null,
    notes: state.notes || null,
    zoho_lead_id: state.zohoLeadId,
    is_prefilled_lead: state.isPrefilledLead,
  };
}

// Create a new wizard session
export async function createWizardSession(
  sessionToken: string,
  initialData?: Partial<WizardSession>
): Promise<WizardSession | null> {
  try {
    const deviceInfo = getDeviceInfo();
    const utmParams = getUTMParams();

    const sessionData = {
      session_token: sessionToken,
      status: 'in_progress' as WizardSessionStatus,
      current_step: 1,
      highest_step_reached: 1,
      device_info: deviceInfo,
      referrer: typeof document !== 'undefined' ? document.referrer : null,
      ...utmParams,
      step_timestamps: { 1: new Date().toISOString() },
      ...initialData,
    };

    const response = await supabaseFetch('/wizard_sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to create wizard session:', error);
      return null;
    }

    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error('Error creating wizard session:', error);
    return null;
  }
}

// Get existing wizard session by token
export async function getWizardSessionByToken(sessionToken: string): Promise<WizardSession | null> {
  try {
    const response = await supabaseFetch(
      `/wizard_sessions?session_token=eq.${sessionToken}&select=*`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error('Error fetching wizard session:', error);
    return null;
  }
}

// Update wizard session
export async function updateWizardSession(
  sessionId: string,
  updates: Partial<WizardSession>
): Promise<WizardSession | null> {
  try {
    // Add step timestamp if step changed
    if (updates.current_step) {
      const stepTimestamps = updates.step_timestamps || {};
      if (!stepTimestamps[updates.current_step]) {
        updates.step_timestamps = {
          ...stepTimestamps,
          [updates.current_step]: new Date().toISOString(),
        };
      }
    }

    const response = await supabaseFetch(`/wizard_sessions?id=eq.${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to update wizard session:', error);
      return null;
    }

    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error('Error updating wizard session:', error);
    return null;
  }
}

// Mark session as completed (reached Step 6 summary)
export async function markSessionCompleted(sessionId: string): Promise<boolean> {
  try {
    const result = await updateWizardSession(sessionId, {
      status: 'completed',
      current_step: 6,
    });
    return result !== null;
  } catch (error) {
    console.error('Error marking session completed:', error);
    return false;
  }
}

// Mark session as converted to lead
export async function markSessionConvertedToLead(
  sessionId: string,
  leadId: string
): Promise<boolean> {
  try {
    const result = await updateWizardSession(sessionId, {
      status: 'converted_to_lead',
      converted_lead_id: leadId,
    });

    // Clear the session token since it's now a lead
    clearSessionToken();

    return result !== null;
  } catch (error) {
    console.error('Error marking session converted:', error);
    return false;
  }
}

// Get or create session (main entry point for wizard)
export async function getOrCreateWizardSession(
  prefillData?: { zohoLeadId?: string; fullName?: string; email?: string; phone?: string }
): Promise<{ session: WizardSession | null; isNew: boolean }> {
  const sessionToken = getSessionToken();

  // Check for existing session
  const existingSession = await getWizardSessionByToken(sessionToken);

  if (existingSession) {
    // If session was abandoned but user came back, reactivate it
    if (existingSession.status === 'abandoned') {
      await updateWizardSession(existingSession.id!, { status: 'in_progress' });
    }
    return { session: existingSession, isNew: false };
  }

  // Create new session
  const initialData: Partial<WizardSession> = {};

  if (prefillData?.zohoLeadId) {
    initialData.zoho_lead_id = prefillData.zohoLeadId;
    initialData.is_prefilled_lead = true;
  }
  if (prefillData?.fullName) initialData.full_name = prefillData.fullName;
  if (prefillData?.email) initialData.email = prefillData.email;
  if (prefillData?.phone) initialData.phone = prefillData.phone;

  const newSession = await createWizardSession(sessionToken, initialData);
  return { session: newSession, isNew: true };
}

// Debounced save function for frequent updates
let saveTimeout: NodeJS.Timeout | null = null;
let pendingUpdates: Partial<WizardSession> = {};
let currentSessionId: string | null = null;

export function debouncedSaveSession(
  sessionId: string,
  updates: Partial<WizardSession>,
  debounceMs: number = 1000
): void {
  // Merge updates
  currentSessionId = sessionId;
  pendingUpdates = { ...pendingUpdates, ...updates };

  // Clear existing timeout
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  // Set new timeout
  saveTimeout = setTimeout(async () => {
    if (currentSessionId && Object.keys(pendingUpdates).length > 0) {
      await updateWizardSession(currentSessionId, pendingUpdates);
      pendingUpdates = {};
    }
  }, debounceMs);
}

// Force save immediately (e.g., before page unload)
export async function flushPendingSave(): Promise<void> {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }

  if (currentSessionId && Object.keys(pendingUpdates).length > 0) {
    await updateWizardSession(currentSessionId, pendingUpdates);
    pendingUpdates = {};
  }
}

// Analytics: Get session stats (server-side only)
export async function getWizardSessionStats(): Promise<{
  total_sessions: number;
  in_progress: number;
  abandoned: number;
  completed: number;
  converted_to_lead: number;
  conversion_rate: number;
  avg_highest_step: number;
  sessions_today: number;
  sessions_this_week: number;
} | null> {
  try {
    const response = await supabaseFetch('/rpc/get_wizard_session_stats', {
      method: 'POST',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error('Error fetching wizard session stats:', error);
    return null;
  }
}

// Analytics: Get drop-off analysis (server-side only)
export async function getWizardDropoffAnalysis(): Promise<Array<{
  step_number: number;
  reached_count: number;
  abandoned_at_step: number;
  dropoff_rate: number;
}> | null> {
  try {
    const response = await supabaseFetch('/rpc/get_wizard_dropoff_analysis', {
      method: 'POST',
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching drop-off analysis:', error);
    return null;
  }
}

// Mark abandoned sessions (called by cron)
export async function markAbandonedSessions(minutesThreshold: number = 30): Promise<number> {
  try {
    const response = await supabaseFetch('/rpc/mark_abandoned_wizard_sessions', {
      method: 'POST',
      body: JSON.stringify({ minutes_threshold: minutesThreshold }),
    });

    if (!response.ok) {
      return 0;
    }

    const result = await response.json();
    return result || 0;
  } catch (error) {
    console.error('Error marking abandoned sessions:', error);
    return 0;
  }
}

// Get abandoned sessions with data (for follow-up)
export async function getAbandonedSessions(options?: {
  minStep?: number;
  limit?: number;
  hasAddress?: boolean;
}): Promise<WizardSession[]> {
  try {
    let query = '/wizard_sessions?status=eq.abandoned&order=created_at.desc';

    if (options?.minStep) {
      query += `&highest_step_reached=gte.${options.minStep}`;
    }

    if (options?.hasAddress) {
      query += '&address=not.is.null';
    }

    if (options?.limit) {
      query += `&limit=${options.limit}`;
    }

    const response = await supabaseFetch(query);

    if (!response.ok) {
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching abandoned sessions:', error);
    return [];
  }
}
