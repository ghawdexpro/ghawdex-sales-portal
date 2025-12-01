import { NextRequest, NextResponse } from 'next/server';
import { createLead, updateLead, getLeadByZohoId } from '@/lib/supabase';
import { createOrUpdateZohoLead } from '@/lib/zoho';
import { Lead } from '@/lib/types';

// Calculate lead priority score (0-100)
function calculateLeadPriority(lead: Partial<Lead>): { score: number; level: 'high' | 'medium' | 'low' } {
  let score = 0;

  // System size scoring (max 30 points)
  if (lead.system_size_kw) {
    if (lead.system_size_kw >= 15) score += 30;
    else if (lead.system_size_kw >= 10) score += 25;
    else if (lead.system_size_kw >= 5) score += 15;
    else score += 10;
  }

  // Total price scoring (max 25 points)
  if (lead.total_price) {
    if (lead.total_price >= 15000) score += 25;
    else if (lead.total_price >= 10000) score += 20;
    else if (lead.total_price >= 5000) score += 10;
    else score += 5;
  }

  // Battery included (15 points)
  if (lead.with_battery && lead.battery_size_kwh && lead.battery_size_kwh > 0) {
    score += 15;
  }

  // Grant path (10 points - easier to close)
  if (lead.grant_path) {
    score += 10;
  }

  // Loan financing (10 points - committed buyer)
  if (lead.payment_method === 'loan') {
    score += 10;
  }

  // Has monthly bill data (5 points - engaged user)
  if (lead.monthly_bill && lead.monthly_bill > 0) {
    score += 5;
  }

  // Has address (5 points - serious inquiry)
  if (lead.address && lead.address.length > 5) {
    score += 5;
  }

  const level = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
  return { score, level };
}

// Generate Zoho prefill link for sales team
function generateZohoPrefillLink(lead: Partial<Lead>, zohoLeadId: string): string {
  const baseUrl = 'https://get.ghawdex.pro';
  const params = new URLSearchParams();

  if (lead.name) params.set('name', lead.name);
  if (lead.email) params.set('email', lead.email);
  if (lead.phone) params.set('phone', lead.phone);
  params.set('zoho_id', zohoLeadId);

  return `${baseUrl}/?${params.toString()}`;
}

// Telegram notification helper
interface TelegramOptions {
  isQuoteCompletion?: boolean;
  priority?: { score: number; level: 'high' | 'medium' | 'low' };
  prefillLink?: string;
}

async function sendTelegramNotification(lead: Lead, options: TelegramOptions = {}) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!botToken || !chatId) {
    console.log('Telegram not configured, skipping notification');
    return;
  }

  const { isQuoteCompletion, priority, prefillLink } = options;

  // Priority emoji and label
  const priorityEmoji = priority?.level === 'high' ? '🔥' : priority?.level === 'medium' ? '⭐' : '📋';
  const priorityLabel = priority ? `${priorityEmoji} *Priority:* ${priority.level.toUpperCase()} (${priority.score}/100)` : '';

  // Prefill link section
  const linkSection = prefillLink ? `\n\n🔗 *Quick Quote Link:*\n\`${prefillLink}\`` : '';

  // Different message for quote completions (prefilled users from CRM)
  const message = isQuoteCompletion
    ? `✅ *Quote Completed - Needs Callback!*
${priorityLabel}

👤 *Name:* ${lead.name}
📧 *Email:* ${lead.email}
📱 *Phone:* ${lead.phone}

📍 *Address:* ${lead.address}

🔆 *System:* ${lead.system_size_kw || 'TBD'} kWp
🔋 *Battery:* ${lead.with_battery ? `${lead.battery_size_kwh} kWh` : 'No'}
🎫 *Grant Path:* ${lead.grant_path ? 'Yes' : 'No'}
💳 *Payment:* ${lead.payment_method === 'loan' ? `Loan (${lead.loan_term ? lead.loan_term/12 : '?'} years)` : 'Cash'}

💰 *Total Price:* €${lead.total_price?.toLocaleString() || 'TBD'}
📊 *Annual Savings:* €${lead.annual_savings?.toLocaleString() || 'TBD'}

⚡ *Action:* Customer completed quote from CRM link - ready for callback!
🔗 Source: Zoho CRM`
    : `🌞 *New Solar Lead!*
${priorityLabel}

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
📊 *Annual Savings:* €${lead.annual_savings?.toLocaleString() || 'TBD'}${linkSection}

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

    // Check if this is a prefilled user (from Zoho CRM link)
    const isPrefilledUser = !!body.zoho_lead_id;
    let existingLead: Lead | null = null;

    // For prefilled users, find existing lead in Supabase
    if (isPrefilledUser) {
      existingLead = await getLeadByZohoId(body.zoho_lead_id);
    }

    // Handle Supabase: UPDATE existing or CREATE new
    let supabaseResult: PromiseSettledResult<Lead | null>;
    if (existingLead && existingLead.id) {
      // Update existing lead with quote data
      supabaseResult = await Promise.resolve(
        updateLead(existingLead.id, {
          address: leadData.address,
          coordinates: leadData.coordinates,
          household_size: leadData.household_size,
          monthly_bill: leadData.monthly_bill,
          consumption_kwh: leadData.consumption_kwh,
          roof_area: leadData.roof_area,
          selected_system: leadData.selected_system,
          system_size_kw: leadData.system_size_kw,
          with_battery: leadData.with_battery,
          battery_size_kwh: leadData.battery_size_kwh,
          grant_path: leadData.grant_path,
          payment_method: leadData.payment_method,
          loan_term: leadData.loan_term,
          total_price: leadData.total_price,
          monthly_payment: leadData.monthly_payment,
          annual_savings: leadData.annual_savings,
          status: 'quoted',
        })
      ).then(value => ({ status: 'fulfilled' as const, value }))
       .catch(reason => ({ status: 'rejected' as const, reason }));
    } else {
      // Create new lead
      supabaseResult = await Promise.resolve(createLead(leadData))
        .then(value => ({ status: 'fulfilled' as const, value }))
        .catch(reason => ({ status: 'rejected' as const, reason }));
    }

    // Update Zoho CRM (createOrUpdateZohoLead handles both create/update)
    const zohoResult = await Promise.resolve(
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
      })
    ).then(value => ({ status: 'fulfilled' as const, value }))
     .catch(reason => ({ status: 'rejected' as const, reason }));

    // Log results
    if (supabaseResult.status === 'rejected') {
      console.error('Supabase lead operation failed:', supabaseResult.reason);
    }
    if (zohoResult.status === 'rejected') {
      console.error('Zoho CRM lead operation failed:', zohoResult.reason);
    }

    // Get the Supabase lead if successful
    const lead = supabaseResult.status === 'fulfilled' ? supabaseResult.value : null;
    const zohoLeadId = zohoResult.status === 'fulfilled' ? zohoResult.value : null;

    // If both failed, return error
    if (!lead && !zohoLeadId) {
      return NextResponse.json(
        { error: 'Failed to process lead in both systems' },
        { status: 500 }
      );
    }

    // Send notifications asynchronously (don't block response)
    // Send Telegram even if only Zoho succeeded (use leadData as fallback)
    const notificationLead = lead || {
      ...leadData,
      id: undefined,
      created_at: undefined,
    } as Lead;

    // Calculate priority score
    const priority = calculateLeadPriority(notificationLead);

    // Generate prefill link for new leads (not for quote completions)
    const finalZohoId = zohoLeadId || leadData.zoho_lead_id;
    const prefillLink = !isPrefilledUser && finalZohoId
      ? generateZohoPrefillLink(notificationLead, finalZohoId)
      : undefined;

    // Always send Telegram if at least one system succeeded
    if (lead || zohoLeadId) {
      Promise.all([
        sendTelegramNotification(notificationLead, {
          isQuoteCompletion: isPrefilledUser,
          priority,
          prefillLink,
        }),
        lead ? triggerN8nWebhook(lead) : Promise.resolve(),
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
