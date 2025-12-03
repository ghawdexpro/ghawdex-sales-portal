import { NextRequest, NextResponse } from 'next/server';
import { createLead, updateLead, findExistingLead } from '@/lib/supabase';
import { createOrUpdateZohoLead, findExistingZohoLead } from '@/lib/zoho';
import { Lead } from '@/lib/types';
import {
  getWizardSessionByToken,
  markSessionConvertedToLead,
} from '@/lib/wizard-session';

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

  // Google Maps link section
  const mapLink = lead.google_maps_link ? `\n🗺️ *Map:* [Open in Google Maps](${lead.google_maps_link})` : '';

  // Different message for quote completions (prefilled users from CRM)
  const message = isQuoteCompletion
    ? `✅ *Quote Completed - Needs Callback!*
${priorityLabel}

👤 *Name:* ${lead.name}
📧 *Email:* ${lead.email}
📱 *Phone:* ${lead.phone}

📍 *Address:* ${lead.address}${mapLink}

🔆 *System:* ${lead.system_size_kw || 'TBD'} kWp
🔋 *Battery:* ${lead.with_battery ? `${lead.battery_size_kwh} kWh` : 'No'}
🎫 *Grant:* ${lead.grant_type || 'pv_only'} (€${lead.grant_amount?.toLocaleString() || '0'})
💳 *Payment:* ${lead.payment_method === 'loan' ? `Loan (${lead.loan_term ? lead.loan_term/12 : '?'} years)` : 'Cash'}

💰 *Total Price:* €${lead.total_price?.toLocaleString() || 'TBD'}
📊 *Annual Savings:* €${lead.annual_savings?.toLocaleString() || 'TBD'}
📄 *Proposal:* ${lead.proposal_file_url ? 'PDF attached' : 'Not generated'}

⚡ *Action:* Customer completed quote from CRM link - ready for callback!
🔗 Source: Zoho CRM`
    : `🌞 *New Solar Lead!*
${priorityLabel}

👤 *Name:* ${lead.name}
📧 *Email:* ${lead.email}
📱 *Phone:* ${lead.phone}

📍 *Address:* ${lead.address}${mapLink}
👥 *Household:* ${lead.household_size || 'N/A'} people
💡 *Monthly Bill:* €${lead.monthly_bill || 'N/A'}
⚡ *Consumption:* ${lead.consumption_kwh || 'N/A'} kWh/month

🔆 *System:* ${lead.system_size_kw || 'TBD'} kWp
🔋 *Battery:* ${lead.with_battery ? `${lead.battery_size_kwh} kWh` : 'No'}
🎫 *Grant:* ${lead.grant_type || 'pv_only'} (€${lead.grant_amount?.toLocaleString() || '0'})

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

/**
 * Detect if this is a "hot lead" - came from Facebook/external source AND completed wizard
 * Hot leads are high priority because they:
 * 1. Clicked on an ad (showed initial interest)
 * 2. Received our email with wizard link
 * 3. Completed the full quote wizard (high intent)
 */
function isHotLead(lead: Partial<Lead>, source?: string, existingLead?: Lead | null): boolean {
  const leadSource = source?.toLowerCase() || lead.source?.toLowerCase() || '';

  // Check if lead came from Facebook or other external ad sources
  const isFromExternalSource =
    leadSource.includes('facebook') ||
    leadSource.includes('fb') ||
    leadSource.includes('instagram') ||
    leadSource.includes('ig') ||
    leadSource.includes('meta') ||
    leadSource.includes('google_ads') ||
    leadSource.includes('ad_') ||
    existingLead !== null; // If we found an existing lead, they came back to complete

  // Check if wizard was completed (has system selection and price)
  const hasCompletedWizard =
    lead.address &&
    lead.address.length > 5 &&
    lead.system_size_kw &&
    lead.system_size_kw > 0 &&
    lead.total_price &&
    lead.total_price > 0;

  return isFromExternalSource && !!hasCompletedWizard;
}

/**
 * Send priority notification for hot leads (Facebook/ad leads that complete wizard)
 * Sends to both admin and team channels
 */
async function sendHotLeadNotification(lead: Lead) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  const teamChatId = process.env.TELEGRAM_TEAM_CHAT_ID;

  if (!botToken || !adminChatId) {
    console.log('Telegram not configured for hot lead notification');
    return;
  }

  const message = `🔥🔥🔥 *HOT LEAD - PRIORITY!* 🔥🔥🔥

⚡ *Lead Completed Full Quote Wizard!*

👤 *Name:* ${lead.name}
📧 *Email:* ${lead.email}
📱 *Phone:* ${lead.phone}

📍 *Address:* ${lead.address}
🔆 *System:* ${lead.system_size_kw} kWp
🔋 *Battery:* ${lead.with_battery ? `${lead.battery_size_kwh} kWh` : 'No'}
🎫 *Grant:* ${lead.grant_type || 'pv_only'} (€${lead.grant_amount?.toLocaleString() || '0'})
💳 *Payment:* ${lead.payment_method === 'loan' ? `Loan (${lead.loan_term ? lead.loan_term/12 : '?'} years)` : 'Cash'}

💰 *Total Price:* €${lead.total_price?.toLocaleString()}
📊 *Annual Savings:* €${lead.annual_savings?.toLocaleString() || 'TBD'}

🎯 *This customer:*
✅ Showed interest (clicked ad/received email)
✅ Came to our wizard
✅ Completed full quote

📞 *ACTION REQUIRED:* Call within 15 minutes!

🔗 Source: ${lead.source || 'Sales Portal'}`;

  try {
    // Send to admin
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: adminChatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    // Also send to team channel if configured
    if (teamChatId) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: teamChatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      });
    }

    console.log('Hot lead notification sent successfully');
  } catch (error) {
    console.error('Failed to send hot lead notification:', error);
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
      google_maps_link: body.google_maps_link || null,
      household_size: body.household_size || null,
      monthly_bill: body.monthly_bill || null,
      consumption_kwh: body.consumption_kwh || null,
      roof_area: body.roof_area || null,
      selected_system: body.selected_system || null,
      system_size_kw: body.system_size_kw || null,
      with_battery: body.with_battery || false,
      battery_size_kwh: body.battery_size_kwh || null,
      grant_path: body.grant_path !== undefined ? body.grant_path : true,
      grant_type: body.grant_type || 'pv_only',
      grant_amount: body.grant_amount || null,
      payment_method: body.payment_method || null,
      loan_term: body.loan_term || null,
      total_price: body.total_price || null,
      monthly_payment: body.monthly_payment || null,
      annual_savings: body.annual_savings || null,
      notes: body.notes || null,
      zoho_lead_id: body.zoho_lead_id || null,
      status: 'new',
      source: body.source || 'sales-portal',
      bill_file_url: body.bill_file_url || null,
      proposal_file_url: body.proposal_file_url || null,
      social_provider: body.social_provider || null,
      // Equipment details
      panel_brand: body.panel_brand || null,
      panel_model: body.panel_model || null,
      panel_count: body.panel_count || null,
      panel_wattage: body.panel_wattage || null,
      inverter_brand: body.inverter_brand || null,
      inverter_model: body.inverter_model || null,
      battery_brand: body.battery_brand || null,
      battery_model: body.battery_model || null,
    };

    // Check if this is a prefilled user (from Zoho CRM link)
    const isPrefilledUser = !!body.zoho_lead_id;
    let existingLead: Lead | null = null;
    let foundZohoLeadId: string | null = body.zoho_lead_id || null;

    // Enhanced lead matching: search by zoho_id, email, phone, or name
    // This prevents duplicates when a Facebook lead fills out the wizard
    console.log('Searching for existing lead by multiple criteria...');

    // First, try to find in Supabase
    existingLead = await findExistingLead({
      zoho_lead_id: body.zoho_lead_id,
      email: body.email,
      phone: body.phone,
      name: body.name,
    });

    // If not found by zoho_id but found by other criteria, get the zoho_lead_id from existing lead
    if (existingLead && existingLead.zoho_lead_id && !foundZohoLeadId) {
      foundZohoLeadId = existingLead.zoho_lead_id;
      console.log('Found existing Supabase lead, using its zoho_lead_id:', foundZohoLeadId);
    }

    // If still no zoho_lead_id, search in Zoho CRM
    if (!foundZohoLeadId) {
      const zohoSearchResult = await findExistingZohoLead({
        zoho_lead_id: body.zoho_lead_id,
        email: body.email,
        phone: body.phone,
        name: body.name,
      });

      if (zohoSearchResult) {
        foundZohoLeadId = zohoSearchResult.id;
        console.log(`Found existing Zoho ${zohoSearchResult.type}:`, foundZohoLeadId);
      }
    }

    // Update leadData with found zoho_lead_id for proper CRM sync
    if (foundZohoLeadId && !leadData.zoho_lead_id) {
      leadData.zoho_lead_id = foundZohoLeadId;
    }

    // Determine if this is a returning lead (found existing record)
    const isReturningLead = existingLead !== null || isPrefilledUser;

    // Handle Supabase: UPDATE existing or CREATE new
    let supabaseResult: PromiseSettledResult<Lead | null>;
    if (existingLead && existingLead.id) {
      // Update existing lead with quote data
      supabaseResult = await Promise.resolve(
        updateLead(existingLead.id, {
          address: leadData.address,
          coordinates: leadData.coordinates,
          google_maps_link: leadData.google_maps_link,
          household_size: leadData.household_size,
          monthly_bill: leadData.monthly_bill,
          consumption_kwh: leadData.consumption_kwh,
          roof_area: leadData.roof_area,
          selected_system: leadData.selected_system,
          system_size_kw: leadData.system_size_kw,
          with_battery: leadData.with_battery,
          battery_size_kwh: leadData.battery_size_kwh,
          grant_path: leadData.grant_path,
          grant_type: leadData.grant_type,
          grant_amount: leadData.grant_amount,
          payment_method: leadData.payment_method,
          loan_term: leadData.loan_term,
          total_price: leadData.total_price,
          monthly_payment: leadData.monthly_payment,
          annual_savings: leadData.annual_savings,
          proposal_file_url: leadData.proposal_file_url,
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

    // Detect if this is a hot lead (came from Facebook/ad + completed wizard)
    const hotLead = isHotLead(leadData, body.source, existingLead);
    if (hotLead) {
      console.log('🔥 Hot lead detected! Will set Lead_Status to Hot - Qualified');
    }

    // Update Zoho CRM (createOrUpdateZohoLead handles both create/update)
    // Pass isHotLead option to set Lead_Status for high-intent leads
    const zohoResult = await Promise.resolve(
      createOrUpdateZohoLead({
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        address: leadData.address,
        google_maps_link: leadData.google_maps_link,
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
        grant_type: leadData.grant_type,
        grant_amount: leadData.grant_amount,
        proposal_file_url: leadData.proposal_file_url,
        // Equipment details
        panel_brand: leadData.panel_brand,
        panel_model: leadData.panel_model,
        panel_count: leadData.panel_count,
        panel_wattage: leadData.panel_wattage,
        inverter_brand: leadData.inverter_brand,
        inverter_model: leadData.inverter_model,
        battery_brand: leadData.battery_brand,
        battery_model: leadData.battery_model,
      }, { isHotLead: hotLead })
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
      // For hot leads, send priority notification instead of regular notification
      if (hotLead) {
        Promise.all([
          sendHotLeadNotification(notificationLead),
          lead ? triggerN8nWebhook(lead) : Promise.resolve(),
        ]).catch(console.error);
      } else {
        Promise.all([
          sendTelegramNotification(notificationLead, {
            isQuoteCompletion: isPrefilledUser || isReturningLead,
            priority,
            prefillLink,
          }),
          lead ? triggerN8nWebhook(lead) : Promise.resolve(),
        ]).catch(console.error);
      }
    }

// Link wizard session to lead (if session token provided)
    if (body.session_token && lead?.id) {
      try {
        const session = await getWizardSessionByToken(body.session_token);
        if (session?.id) {
          await markSessionConvertedToLead(session.id, lead.id);
        }
      } catch (error) {
        // Non-blocking - session linking failure shouldn't fail lead creation
        console.error('Failed to link wizard session to lead:', error);
      }
    }

    // Mark wizard session as converted by email (for social login users)
    if (leadData.email && lead?.id) {
      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}/rest/v1/wizard_sessions?email=eq.${encodeURIComponent(leadData.email)}&status=eq.in_progress`, {
        method: 'PATCH',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'converted_to_lead',
          converted_lead_id: lead.id,
        }),
      }).catch(err => console.error('Failed to mark wizard session as converted:', err));
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
      is_hot_lead: hotLead,
      is_returning_lead: isReturningLead,
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
    const { id, email, ...updates } = body;

    if (!id && !email) {
      return NextResponse.json(
        { error: 'Lead ID or email is required' },
        { status: 400 }
      );
    }

    let leadId = id;

    // If no ID provided, look up by email
    if (!leadId && email) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const lookupResponse = await fetch(
        `${supabaseUrl}/rest/v1/leads?email=eq.${encodeURIComponent(email)}&order=created_at.desc&limit=1`,
        {
          headers: {
            'apikey': supabaseKey || '',
            'Authorization': `Bearer ${supabaseKey || ''}`,
          },
        }
      );

      if (lookupResponse.ok) {
        const leads = await lookupResponse.json();
        if (leads.length > 0) {
          leadId = leads[0].id;
        }
      }

      if (!leadId) {
        return NextResponse.json(
          { error: 'Lead not found for email' },
          { status: 404 }
        );
      }
    }

    const lead = await updateLead(leadId, updates);

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
