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

// Calculate next reminder time (24 hours for first, 72 hours for second)
function calculateNextReminderAt(reminderCount: number): string | null {
  if (reminderCount >= 2) return null; // Max 2 reminders

  const hoursFromNow = reminderCount === 0 ? 24 : 72;
  const nextReminder = new Date();
  nextReminder.setHours(nextReminder.getHours() + hoursFromNow);
  return nextReminder.toISOString();
}

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

    // Check if partial lead already exists for this email
    const existingResponse = await supabaseFetch(
      `/partial_leads?email=eq.${encodeURIComponent(body.email)}&converted_to_lead=eq.false&select=id,reminder_count`
    );

    let partialLeadId: string | null = null;
    let reminderCount = 0;

    if (existingResponse.ok) {
      const existing = await existingResponse.json();
      if (existing && existing.length > 0) {
        // Update existing partial lead
        partialLeadId = existing[0].id;
        reminderCount = existing[0].reminder_count || 0;
      }
    }

    const nextReminderAt = calculateNextReminderAt(reminderCount);

    if (partialLeadId) {
      // Update existing partial lead
      const updateResponse = await supabaseFetch(
        `/partial_leads?id=eq.${partialLeadId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            name: body.name || null,
            social_provider: body.social_provider || null,
            last_step: body.last_step || 1,
            phone: body.phone || null,
            wizard_state: body.wizard_state || null,
            next_reminder_at: nextReminderAt,
          }),
        }
      );

      if (!updateResponse.ok) {
        console.error('Failed to update partial lead:', await updateResponse.text());
        return NextResponse.json(
          { error: 'Failed to update partial lead' },
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
      // Create new partial lead
      const createResponse = await supabaseFetch('/partial_leads', {
        method: 'POST',
        body: JSON.stringify({
          email: body.email,
          name: body.name || null,
          social_provider: body.social_provider || null,
          last_step: body.last_step || 1,
          phone: body.phone || null,
          wizard_state: body.wizard_state || null,
          reminder_count: 0,
          next_reminder_at: nextReminderAt,
        }),
      });

      if (!createResponse.ok) {
        console.error('Failed to create partial lead:', await createResponse.text());
        return NextResponse.json(
          { error: 'Failed to create partial lead' },
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
    console.error('Partial lead error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH endpoint to mark partial lead as converted
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
      : `email=eq.${encodeURIComponent(body.email)}`;

    const updateResponse = await supabaseFetch(
      `/partial_leads?${filter}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          converted_to_lead: true,
          converted_at: new Date().toISOString(),
          lead_id: body.lead_id || null,
        }),
      }
    );

    if (!updateResponse.ok) {
      console.error('Failed to mark partial lead as converted:', await updateResponse.text());
      return NextResponse.json(
        { error: 'Failed to update partial lead' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Partial lead conversion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch partial leads needing reminders (for cron job)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'pending-reminders') {
      // Get partial leads that need reminders
      const now = new Date().toISOString();
      const response = await supabaseFetch(
        `/partial_leads?converted_to_lead=eq.false&next_reminder_at=lt.${now}&reminder_count=lt.2&select=*`
      );

      if (!response.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch partial leads' },
          { status: 500 }
        );
      }

      const partialLeads = await response.json();
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
    console.error('Partial leads fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
