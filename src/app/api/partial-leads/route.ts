import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Simple Supabase fetch helper
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

// NOTE: This API now uses wizard_sessions table instead of partial_leads table
// Social login recovery data is stored alongside regular wizard session data.

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if wizard session already exists for this email (in_progress only)
    const existingResponse = await supabaseFetch(
      `/wizard_sessions?email=eq.${encodeURIComponent(body.email)}&status=eq.in_progress&select=id,session_token,current_step`
    );

    let sessionId: string | null = null;

    if (existingResponse.ok) {
      const existing = await existingResponse.json();
      if (existing && existing.length > 0) {
        // Update existing wizard session with social login data
        sessionId = existing[0].id;
      }
    }

    if (sessionId) {
      // Update existing wizard session with social login info
      const updateResponse = await supabaseFetch(
        `/wizard_sessions?id=eq.${sessionId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            full_name: body.name || null,
            email: body.email,
            social_provider: body.social_provider || null,
            current_step: body.last_step || 5,
            highest_step_reached: Math.max(body.last_step || 5, 5),
            // Store additional wizard state in device_info as a fallback
            // (main wizard state is managed separately)
            address: body.wizard_state?.address || null,
            household_size: body.wizard_state?.householdSize || null,
            monthly_bill: body.wizard_state?.monthlyBill || null,
            selected_system: body.wizard_state?.selectedSystem || null,
            with_battery: body.wizard_state?.withBattery || false,
            battery_size_kwh: body.wizard_state?.batterySize || null,
            payment_method: body.wizard_state?.paymentMethod || null,
          }),
        }
      );

      if (!updateResponse.ok) {
        console.error('Failed to update wizard session:', await updateResponse.text());
        return NextResponse.json(
          { error: 'Failed to update wizard session' },
          { status: 500 }
        );
      }

      const updated = await updateResponse.json();
      return NextResponse.json({
        success: true,
        partial_lead: updated[0] || null,
        action: 'updated',
      });
    } else {
      // Create new wizard session with social login data
      const createResponse = await supabaseFetch('/wizard_sessions', {
        method: 'POST',
        body: JSON.stringify({
          email: body.email,
          full_name: body.name || null,
          social_provider: body.social_provider || null,
          current_step: body.last_step || 5,
          highest_step_reached: Math.max(body.last_step || 5, 5),
          status: 'in_progress',
          // Store wizard state fields
          address: body.wizard_state?.address || null,
          coordinates: body.wizard_state?.coordinates || null,
          household_size: body.wizard_state?.householdSize || null,
          monthly_bill: body.wizard_state?.monthlyBill || null,
          selected_system: body.wizard_state?.selectedSystem || null,
          with_battery: body.wizard_state?.withBattery || false,
          battery_size_kwh: body.wizard_state?.batterySize || null,
          payment_method: body.wizard_state?.paymentMethod || null,
        }),
      });

      if (!createResponse.ok) {
        console.error('Failed to create wizard session:', await createResponse.text());
        return NextResponse.json(
          { error: 'Failed to create wizard session' },
          { status: 500 }
        );
      }

      const created = await createResponse.json();
      return NextResponse.json({
        success: true,
        partial_lead: created[0] || null,
        action: 'created',
      });
    }
  } catch (error) {
    console.error('Partial lead (wizard session) error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH endpoint to mark wizard session as converted
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.email && !body.id) {
      return NextResponse.json(
        { error: 'Email or ID is required' },
        { status: 400 }
      );
    }

    const filter = body.id
      ? `id=eq.${body.id}`
      : `email=eq.${encodeURIComponent(body.email)}&status=eq.in_progress`;

    const updateResponse = await supabaseFetch(
      `/wizard_sessions?${filter}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'converted_to_lead',
          converted_lead_id: body.lead_id || null,
        }),
      }
    );

    if (!updateResponse.ok) {
      console.error('Failed to mark wizard session as converted:', await updateResponse.text());
      return NextResponse.json(
        { error: 'Failed to update wizard session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Wizard session conversion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch abandoned sessions with social login (for reminder cron job)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'pending-reminders') {
      // Get abandoned wizard sessions that have social login data (email + social_provider)
      // These are users who logged in with social but didn't complete
      const response = await supabaseFetch(
        `/wizard_sessions?status=eq.abandoned&social_provider=not.is.null&email=not.is.null&select=*&order=updated_at.desc&limit=50`
      );

      if (!response.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch wizard sessions' },
          { status: 500 }
        );
      }

      const sessions = await response.json();

      // Transform to match old partial_leads format for compatibility
      const partialLeads = sessions.map((s: Record<string, unknown>) => ({
        id: s.id,
        email: s.email,
        name: s.full_name,
        social_provider: s.social_provider,
        last_step: s.highest_step_reached,
        created_at: s.created_at,
        updated_at: s.updated_at,
      }));

      return NextResponse.json({
        success: true,
        partial_leads: partialLeads,
        count: partialLeads.length,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Wizard sessions fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
