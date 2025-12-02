import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createLead, getLeadByZohoId } from '@/lib/supabase';
import { createOrUpdateZohoLead } from '@/lib/zoho';

// Cron endpoint to auto-save completed avatar sessions to CRM
// Catches sessions where AI forgot to call save_to_crm tool
// Should be called every 1-2 hours

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CollectedData {
  address?: string;
  coordinates?: { lat: number; lng: number };
  household_size?: number;
  monthly_bill?: number;
  consumption_kwh?: number;
  selected_system?: { id: string; systemSizeKw: number };
  selected_battery?: { capacityKwh: number };
  with_battery?: boolean;
  grant_type?: string;
  payment_method?: string;
  loan_term?: number;
  total_price?: number;
  monthly_payment?: number;
  annual_savings?: number;
}

interface AvatarSession {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  zoho_lead_id: string | null;
  collected_data: CollectedData;
  current_phase: string;
  updated_at: string;
}

async function sendTelegramNotification(session: AvatarSession, leadId: string | null, zohoId: string | null) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!botToken || !chatId) return;

  const data = session.collected_data || {};
  const message = `🤖 *Avatar Session Auto-Saved*

👤 *Name:* ${session.customer_name || 'Unknown'}
📧 *Email:* ${session.customer_email || 'N/A'}
📱 *Phone:* ${session.customer_phone || 'N/A'}

🔆 *System:* ${data.selected_system?.systemSizeKw || 'TBD'} kWp
🔋 *Battery:* ${data.with_battery ? `${data.selected_battery?.capacityKwh || '?'} kWh` : 'No'}
💰 *Total Price:* €${data.total_price?.toLocaleString() || 'TBD'}

📋 *Session Phase:* ${session.current_phase}
✅ *Saved:* Supabase ${leadId ? '✓' : '✗'} | Zoho ${zohoId ? '✓' : '✗'}

💡 This session was auto-saved because AI didn't call save_to_crm`;

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
  }
}

async function saveSessionToCRM(session: AvatarSession): Promise<{ leadId: string | null; zohoId: string | null }> {
  const data = session.collected_data || {};

  // Skip if no meaningful data collected
  if (!session.customer_email && !session.customer_phone) {
    return { leadId: null, zohoId: null };
  }

  // Check if lead already exists (by zoho_lead_id or email)
  if (session.zoho_lead_id) {
    const existingLead = await getLeadByZohoId(session.zoho_lead_id);
    if (existingLead) {
      // Lead already saved, skip
      return { leadId: existingLead.id || null, zohoId: session.zoho_lead_id };
    }
  }

  const leadData = {
    name: session.customer_name || 'Avatar Customer',
    email: session.customer_email || '',
    phone: session.customer_phone || '',
    address: data.address || '',
    coordinates: data.coordinates || null,
    household_size: data.household_size || null,
    monthly_bill: data.monthly_bill || null,
    consumption_kwh: data.consumption_kwh || null,
    roof_area: null,
    selected_system: data.selected_system?.id || null,
    system_size_kw: data.selected_system?.systemSizeKw || null,
    with_battery: data.with_battery || false,
    battery_size_kwh: data.selected_battery?.capacityKwh || null,
    grant_path: data.grant_type !== 'none',
    payment_method: data.payment_method || null,
    loan_term: data.loan_term || null,
    total_price: data.total_price || null,
    monthly_payment: data.monthly_payment || null,
    annual_savings: data.annual_savings || null,
    notes: `Auto-saved from avatar session ${session.id}. Phase: ${session.current_phase}`,
    zoho_lead_id: session.zoho_lead_id,
    status: 'new' as const,
    source: 'avatar-chat-auto',
    bill_file_url: null,
    social_provider: null,
  };

  let leadId: string | null = null;
  let zohoId: string | null = null;

  // Save to Supabase
  try {
    const lead = await createLead(leadData);
    leadId = lead?.id || null;
  } catch (error) {
    console.error('Failed to save to Supabase:', error);
  }

  // Save to Zoho CRM
  try {
    zohoId = await createOrUpdateZohoLead({
      name: leadData.name,
      email: leadData.email,
      phone: leadData.phone,
      address: leadData.address,
      system_size_kw: leadData.system_size_kw,
      total_price: leadData.total_price,
      annual_savings: leadData.annual_savings,
      payment_method: leadData.payment_method,
      loan_term: leadData.loan_term,
      with_battery: leadData.with_battery,
      battery_size_kwh: leadData.battery_size_kwh,
      monthly_bill: leadData.monthly_bill,
      source: 'avatar-chat-auto',
      zoho_lead_id: leadData.zoho_lead_id,
    });
  } catch (error) {
    console.error('Failed to save to Zoho:', error);
  }

  return { leadId, zohoId };
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find completed sessions from last 24h that might not be saved
    // Look for sessions with collected_data but check if lead exists
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: sessions, error } = await supabaseAdmin
      .from('avatar_sessions')
      .select('id, customer_name, customer_phone, customer_email, zoho_lead_id, collected_data, current_phase, updated_at')
      .in('status', ['completed', 'active']) // Check both - some 'active' might be stuck
      .gt('updated_at', twentyFourHoursAgo)
      .not('collected_data', 'is', null)
      .limit(20);

    if (error) {
      console.error('Failed to fetch sessions:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No sessions to process',
        processed: 0,
      });
    }

    let savedCount = 0;
    const results: Array<{ sessionId: string; saved: boolean; leadId: string | null; zohoId: string | null }> = [];

    for (const session of sessions) {
      // Skip sessions without email AND phone
      if (!session.customer_email && !session.customer_phone) {
        continue;
      }

      // Skip sessions that are just starting (greeting/location phase with no real data)
      const data = session.collected_data as CollectedData || {};
      const hasSubstantialData = data.selected_system || data.total_price || data.address;
      if (!hasSubstantialData) {
        continue;
      }

      const { leadId, zohoId } = await saveSessionToCRM(session as AvatarSession);

      if (leadId || zohoId) {
        savedCount++;
        await sendTelegramNotification(session as AvatarSession, leadId, zohoId);

        // Mark session as processed by updating status
        await supabaseAdmin
          .from('avatar_sessions')
          .update({ status: 'completed' })
          .eq('id', session.id);
      }

      results.push({
        sessionId: session.id,
        saved: !!(leadId || zohoId),
        leadId,
        zohoId,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${sessions.length} sessions, saved ${savedCount} to CRM`,
      processed: sessions.length,
      saved: savedCount,
      results,
    });
  } catch (error) {
    console.error('Avatar auto-save cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = GET;
