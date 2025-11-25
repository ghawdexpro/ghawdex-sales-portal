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
