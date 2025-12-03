import { Lead } from './types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Simple fetch-based Supabase client (no dependencies needed)
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

export async function createLead(lead: Omit<Lead, 'id' | 'created_at'>): Promise<Lead | null> {
  try {
    const response = await supabaseFetch('/leads', {
      method: 'POST',
      body: JSON.stringify(lead),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to create lead:', error);
      return null;
    }

    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error('Error creating lead:', error);
    return null;
  }
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead | null> {
  try {
    const response = await supabaseFetch(`/leads?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to update lead:', error);
      return null;
    }

    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error('Error updating lead:', error);
    return null;
  }
}

export async function getLead(id: string): Promise<Lead | null> {
  try {
    const response = await supabaseFetch(`/leads?id=eq.${id}`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error('Error fetching lead:', error);
    return null;
  }
}

export async function getLeadByZohoId(zohoLeadId: string): Promise<Lead | null> {
  try {
    const response = await supabaseFetch(`/leads?zoho_lead_id=eq.${zohoLeadId}`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error('Error fetching lead by Zoho ID:', error);
    return null;
  }
}

/**
 * Normalize phone number for consistent matching
 * Handles Malta phone formats: +356 7912 3456, 356-79123456, 79123456, etc.
 */
function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  let normalized = phone.replace(/\D/g, '');

  // If starts with 356, keep it; otherwise add 356 for Malta numbers
  if (!normalized.startsWith('356') && normalized.length === 8) {
    normalized = '356' + normalized;
  }

  return normalized;
}

/**
 * Search for existing lead in Supabase by multiple criteria
 * Priority: zoho_lead_id > email > phone > name
 * Returns the most recently created matching lead
 */
export async function findExistingLead(criteria: {
  zoho_lead_id?: string | null;
  email?: string;
  phone?: string;
  name?: string;
}): Promise<Lead | null> {
  try {
    // 1. First try zoho_lead_id (most reliable)
    if (criteria.zoho_lead_id) {
      const response = await supabaseFetch(
        `/leads?zoho_lead_id=eq.${encodeURIComponent(criteria.zoho_lead_id)}&order=created_at.desc&limit=1`
      );
      if (response.ok) {
        const data = await response.json();
        if (data[0]) {
          console.log('Found existing lead by zoho_lead_id:', criteria.zoho_lead_id);
          return data[0];
        }
      }
    }

    // 2. Try email
    if (criteria.email) {
      const response = await supabaseFetch(
        `/leads?email=eq.${encodeURIComponent(criteria.email)}&order=created_at.desc&limit=1`
      );
      if (response.ok) {
        const data = await response.json();
        if (data[0]) {
          console.log('Found existing lead by email:', criteria.email);
          return data[0];
        }
      }
    }

    // 3. Try phone (normalized)
    if (criteria.phone) {
      const normalizedPhone = normalizePhone(criteria.phone);

      // Try normalized phone first
      let response = await supabaseFetch(
        `/leads?phone=eq.${encodeURIComponent(normalizedPhone)}&order=created_at.desc&limit=1`
      );
      if (response.ok) {
        const data = await response.json();
        if (data[0]) {
          console.log('Found existing lead by normalized phone:', normalizedPhone);
          return data[0];
        }
      }

      // Also try original phone format
      if (normalizedPhone !== criteria.phone) {
        response = await supabaseFetch(
          `/leads?phone=eq.${encodeURIComponent(criteria.phone)}&order=created_at.desc&limit=1`
        );
        if (response.ok) {
          const data = await response.json();
          if (data[0]) {
            console.log('Found existing lead by original phone:', criteria.phone);
            return data[0];
          }
        }
      }

      // Try phone with ilike for partial matches (handles formatting differences)
      const phoneDigits = criteria.phone.replace(/\D/g, '');
      if (phoneDigits.length >= 8) {
        const last8Digits = phoneDigits.slice(-8);
        response = await supabaseFetch(
          `/leads?phone=ilike.*${last8Digits}&order=created_at.desc&limit=1`
        );
        if (response.ok) {
          const data = await response.json();
          if (data[0]) {
            console.log('Found existing lead by phone pattern:', last8Digits);
            return data[0];
          }
        }
      }
    }

    // 4. Try name (least reliable, use only as last resort)
    if (criteria.name && criteria.name.trim().length > 2) {
      const response = await supabaseFetch(
        `/leads?name=ilike.${encodeURIComponent(criteria.name.trim())}&order=created_at.desc&limit=1`
      );
      if (response.ok) {
        const data = await response.json();
        if (data[0]) {
          console.log('Found existing lead by name:', criteria.name);
          return data[0];
        }
      }
    }

    console.log('No existing lead found in Supabase');
    return null;
  } catch (error) {
    console.error('Error finding existing lead:', error);
    return null;
  }
}
