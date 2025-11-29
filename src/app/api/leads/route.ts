import { NextRequest, NextResponse } from 'next/server';
import { createLead, updateLead } from '@/lib/supabase';
import { createOrUpdateZohoLead } from '@/lib/zoho';
import { Lead } from '@/lib/types';

// Telegram notification helper
async function sendTelegramNotification(lead: Lead) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!botToken || !chatId) {
    console.log('Telegram not configured, skipping notification');
    return;
  }

  const message = `🌞 *New Solar Lead!*

👤 *Name:* ${lead.name}
📧 *Email:* ${lead.email}
📱 *Phone:* ${lead.phone}

📍 *Address:* ${lead.address}
👥 *Household:* ${lead.household_size || 'N/A'} people
💡 *Monthly Bill:* €${lead.monthly_bill || 'N/A'}
⚡ *Consumption:* ${lead.consumption_kwh || 'N/A'} kWh/month

🔆 *System:* ${lead.system_size_kw || 'TBD'} kWp
🔋 *Battery:* ${lead.with_battery ? `${lead.battery_size_kwh} kWh` : 'No'}
🎫 *Grant Path:* ${lead.grant_path ? 'Yes' : 'No'}

💰 *Total Price:* €${lead.total_price?.toLocaleString() || 'TBD'}
📊 *Annual Savings:* €${lead.annual_savings?.toLocaleString() || 'TBD'}

🔗 Source: get.ghawdex.pro`;

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

// n8n webhook trigger
async function triggerN8nWebhook(lead: Lead) {
  const n8nUrl = process.env.N8N_API_URL;
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET;

  if (!n8nUrl) {
    console.log('n8n not configured, skipping webhook');
    return;
  }

  try {
    await fetch(`${n8nUrl}/webhook/new-lead`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': webhookSecret || '',
      },
      body: JSON.stringify({
        source: 'sales-portal',
        timestamp: new Date().toISOString(),
        lead,
      }),
    });
  } catch (error) {
    console.error('Failed to trigger n8n webhook:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.email || !body.phone) {
      return NextResponse.json(
        { error: 'Name, email, and phone are required' },
        { status: 400 }
      );
    }

    // Prepare lead data
    const leadData: Omit<Lead, 'id' | 'created_at'> = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      address: body.address || '',
      coordinates: body.coordinates || null,
      household_size: body.household_size || null,
      monthly_bill: body.monthly_bill || null,
      consumption_kwh: body.consumption_kwh || null,
      roof_area: body.roof_area || null,
      selected_system: body.selected_system || null,
      system_size_kw: body.system_size_kw || null,
      with_battery: body.with_battery || false,
      battery_size_kwh: body.battery_size_kwh || null,
      grant_path: body.grant_path !== undefined ? body.grant_path : true,
      payment_method: body.payment_method || null,
      loan_term: body.loan_term || null,
      total_price: body.total_price || null,
      monthly_payment: body.monthly_payment || null,
      annual_savings: body.annual_savings || null,
      notes: body.notes || null,
      zoho_lead_id: body.zoho_lead_id || null,
      status: 'new',
      source: body.source || 'sales-portal',
    };

    // Create lead in both Supabase and Zoho CRM independently
    // Using Promise.allSettled so one failure doesn't block the other
    const [supabaseResult, zohoResult] = await Promise.allSettled([
      createLead(leadData),
      createOrUpdateZohoLead({
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
        source: leadData.source,
        zoho_lead_id: leadData.zoho_lead_id,
      }),
    ]);

    // Log results
    if (supabaseResult.status === 'rejected') {
      console.error('Supabase lead creation failed:', supabaseResult.reason);
    }
    if (zohoResult.status === 'rejected') {
      console.error('Zoho CRM lead creation failed:', zohoResult.reason);
    }

    // Get the Supabase lead if successful
    const lead = supabaseResult.status === 'fulfilled' ? supabaseResult.value : null;
    const zohoLeadId = zohoResult.status === 'fulfilled' ? zohoResult.value : null;

    // If both failed, return error
    if (!lead && !zohoLeadId) {
      return NextResponse.json(
        { error: 'Failed to create lead in both systems' },
        { status: 500 }
      );
    }

    // Send notifications asynchronously (don't block response)
    if (lead) {
      Promise.all([
        sendTelegramNotification(lead),
        triggerN8nWebhook(lead),
      ]).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      lead: lead ? {
        id: lead.id,
        created_at: lead.created_at,
      } : null,
      zoho_lead_id: zohoLeadId,
      supabase_success: supabaseResult.status === 'fulfilled',
      zoho_success: zohoResult.status === 'fulfilled',
    });
  } catch (error) {
    console.error('Lead creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    const lead = await updateLead(id, updates);

    if (!lead) {
      return NextResponse.json(
        { error: 'Failed to update lead' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      lead,
    });
  } catch (error) {
    console.error('Lead update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
