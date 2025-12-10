import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createLead, updateLead, findExistingLead } from '@/lib/supabase';
import { createOrUpdateZohoLead, findExistingZohoLead } from '@/lib/zoho';
import { Lead } from '@/lib/types';
import {
  getWizardSessionByToken,
  markSessionConvertedToLead,
} from '@/lib/wizard-session';
import {
  notifyNewLead,
  notifyAll,
  notifyEvent,
  formatCurrency,
  zohoLeadButton,
  createKeyboard,
  buttonRow,
  mapsButton,
} from '@/lib/telegram';
import { sendLeadConfirmationEmail, isEmailConfigured } from '@/lib/email';
import { sendLeadConfirmationSms, isSmsConfigured } from '@/lib/sms';

// Generate HMAC token for lead signing URL (same algorithm as backoffice)
function generateLeadSigningToken(leadId: string): string | null {
  const secret = process.env.PORTAL_CONTRACT_SECRET || process.env.CRON_SECRET;
  if (!secret) {
    console.error('PORTAL_CONTRACT_SECRET or CRON_SECRET not configured - fallback URLs disabled');
    return null;
  }
  const timestamp = Date.now().toString();
  const payload = `${leadId}:${timestamp}`;
  const hmac = crypto.createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
    .substring(0, 16);
  const encodedPayload = Buffer.from(payload).toString('base64url');
  return `${encodedPayload}.${hmac}`;
}

// Build fallback signing URL for lead
function buildFallbackSigningUrl(leadId: string): string | null {
  const backofficeUrl = process.env.BACKOFFICE_URL || 'https://bo.ghawdex.pro';
  const token = generateLeadSigningToken(leadId);
  if (!token) return null;
  return `${backofficeUrl}/sign/lead/${leadId}?t=${token}`;
}

// Sleep utility for retry delays
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

// 3-tier Telegram notification helpers using new module

interface NotificationOptions {
  isQuoteCompletion?: boolean;
  isHotLead?: boolean;
  priority?: { score: number; level: 'high' | 'medium' | 'low' };
  prefillLink?: string;
}

/**
 * Send lead notification via 3-tier system
 * - Regular leads: everything + team
 * - Hot leads: all tiers (admin + team + everything)
 * - Quote completions (CRM): all tiers
 */
async function sendLeadNotification(lead: Lead, options: NotificationOptions = {}) {
  const { isQuoteCompletion, isHotLead, priority, prefillLink } = options;

  // Build inline keyboard buttons
  const buttons = [];
  if (lead.zoho_lead_id) {
    buttons.push(zohoLeadButton(lead.zoho_lead_id));
  }
  if (lead.address) {
    buttons.push(mapsButton(lead.address));
  }
  const keyboard = buttons.length > 0 ? createKeyboard([buttonRow(...buttons)]) : undefined;

  // For hot leads or quote completions, send to ALL tiers with special formatting
  if (isHotLead || isQuoteCompletion) {
    const priorityEmoji = priority?.level === 'high' ? '🔥' : priority?.level === 'medium' ? '⭐' : '📋';
    const priorityLabel = priority ? `${priorityEmoji} *Priority:* ${priority.level.toUpperCase()} (${priority.score}/100)` : '';

    const message = isHotLead
      ? `🔥🔥🔥 *HOT LEAD - PRIORITY!* 🔥🔥🔥

⚡ *Lead Completed Full Quote Wizard!*

👤 *Customer:* ${lead.name}
📧 *Email:* ${lead.email}
📱 *Phone:* ${lead.phone}

📍 *Address:* ${lead.address}
🔆 *System:* ${lead.system_size_kw} kWp
🔋 *Battery:* ${lead.with_battery ? `${lead.battery_size_kwh} kWh` : 'No'}
🎫 *Grant:* ${lead.grant_type || 'pv_only'} (${formatCurrency(lead.grant_amount || 0)})
💳 *Payment:* ${lead.payment_method === 'loan' ? `Loan (${lead.loan_term ? lead.loan_term/12 : '?'} years)` : 'Cash'}

💰 *Total Price:* ${formatCurrency(lead.total_price || 0)}
📊 *Annual Savings:* ${formatCurrency(lead.annual_savings || 0)}

🎯 *This customer:*
✅ Showed interest (clicked ad/received email)
✅ Came to our wizard
✅ Completed full quote

📞 *ACTION REQUIRED:* Call within 15 minutes!

🔗 Source: ${lead.source || 'Sales Portal'}`
      : `✅ *Quote Completed - Needs Callback!*
${priorityLabel}

👤 *Customer:* ${lead.name}
📧 *Email:* ${lead.email}
📱 *Phone:* ${lead.phone}

📍 *Address:* ${lead.address}

🔆 *System:* ${lead.system_size_kw || 'TBD'} kWp
🔋 *Battery:* ${lead.with_battery ? `${lead.battery_size_kwh} kWh` : 'No'}
🎫 *Grant:* ${lead.grant_type || 'pv_only'} (${formatCurrency(lead.grant_amount || 0)})
💳 *Payment:* ${lead.payment_method === 'loan' ? `Loan (${lead.loan_term ? lead.loan_term/12 : '?'} years)` : 'Cash'}

💰 *Total Price:* ${formatCurrency(lead.total_price || 0)}
📊 *Annual Savings:* ${formatCurrency(lead.annual_savings || 0)}
📄 *Proposal:* ${lead.proposal_file_url ? 'PDF attached' : 'Not generated'}

⚡ *Action:* Customer completed quote from CRM link - ready for callback!
🔗 Source: Zoho CRM`;

    await notifyAll(message, keyboard);
    return;
  }

  // Regular new lead - use standard notifyNewLead (routes to everything + team)
  await notifyNewLead({
    customerName: lead.name || 'Unknown',
    phone: lead.phone || undefined,
    email: lead.email || undefined,
    locality: lead.address || undefined,
    source: 'sales-portal',
    zohoLeadId: lead.zoho_lead_id || undefined,
  });
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

    // Detect is_gozo from: explicit param, utm_campaign, location param, or coordinates
    let isGozo = body.is_gozo;
    if (isGozo === undefined) {
      // Check utm_campaign for gozo/malta keywords
      const utmCampaign = (body.utm_campaign || '').toLowerCase();
      const utmContent = (body.utm_content || '').toLowerCase();
      const locationParam = (body.location || '').toLowerCase();

      if (utmCampaign.includes('gozo') || utmContent.includes('gozo') || locationParam === 'gozo') {
        isGozo = true;
      } else if (utmCampaign.includes('malta') || utmContent.includes('malta') || locationParam === 'malta') {
        isGozo = false;
      } else if (body.coordinates?.lat) {
        // Fallback to coordinates (Gozo is north of 36.0°N)
        isGozo = body.coordinates.lat >= 36.0;
      } else {
        // Default to false (Malta) if no indicators
        isGozo = false;
      }
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
      deposit_amount: body.deposit_amount || null, // Minimum €799 deposit (30% or €799, whichever higher)
      monthly_payment: body.monthly_payment || null,
      annual_savings: body.annual_savings || null,
      notes: body.notes ? `[Customer note during application]: ${body.notes}` : null,
      zoho_lead_id: body.zoho_lead_id || null,
      status: 'new',
      source: body.source || 'sales-portal',
      bill_file_url: body.bill_file_url || null,
      proposal_file_url: body.proposal_file_url || null,
      social_provider: body.social_provider || null,
      // Location - Gozo vs Malta
      is_gozo: isGozo,
      locality: body.locality || null,
      location_source: body.location_source || 'auto',
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
          bill_file_url: leadData.bill_file_url,
          notes: leadData.notes,
          is_gozo: leadData.is_gozo,
          locality: leadData.locality,
          status: 'qualified',
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
        notes: leadData.notes,
        // Additional fields for sales team
        consumption_kwh: leadData.consumption_kwh,
        monthly_payment: leadData.monthly_payment,
        roof_area: leadData.roof_area,
        household_size: leadData.household_size,
        selected_system: leadData.selected_system,
        bill_file_url: leadData.bill_file_url,
        grant_path: leadData.grant_path,
        social_provider: leadData.social_provider,
        coordinates: leadData.coordinates,
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

    // Always send Telegram if at least one system succeeded (3-tier routing)
    if (lead || zohoLeadId) {
      // Enrich notificationLead with zoho_lead_id for proper button links
      if (finalZohoId && !notificationLead.zoho_lead_id) {
        notificationLead.zoho_lead_id = finalZohoId;
      }

      Promise.all([
        sendLeadNotification(notificationLead, {
          isHotLead: hotLead,
          isQuoteCompletion: isPrefilledUser || isReturningLead,
          priority,
          prefillLink,
        }),
        lead ? triggerN8nWebhook(lead) : Promise.resolve(),
      ]).catch(console.error);
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

    // Create contract via backoffice API with retry logic
    let contractSigningUrl: string | null = null;
    let fallbackSigningUrl: string | null = null;

    // Determine if we have a valid configuration for contract creation
    // Support battery-only (system_size_kw = 0 with battery)
    const isBatteryOnly = !leadData.system_size_kw && leadData.with_battery && leadData.battery_size_kwh;
    const hasValidConfig = leadData.total_price && (leadData.system_size_kw || isBatteryOnly);

    if (lead?.id) {
      // Always generate fallback URL (for button to show even if contract creation fails)
      fallbackSigningUrl = buildFallbackSigningUrl(lead.id);

      if (hasValidConfig) {
        const backofficeUrl = process.env.BACKOFFICE_URL || 'https://bo.ghawdex.pro';
        const portalSecret = process.env.PORTAL_CONTRACT_SECRET;

        if (portalSecret) {
          // Retry configuration
          const MAX_RETRIES = 3;
          const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

          for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
              const contractResponse = await fetch(`${backofficeUrl}/api/contracts/portal`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Portal-Secret': portalSecret, // Send secret in header (preferred)
                },
                body: JSON.stringify({
                  leadId: lead.id,
                  systemConfig: {
                    sizeKwp: leadData.system_size_kw || 0, // Allow 0 for battery-only
                    panelBrand: leadData.panel_brand || 'Huawei',
                    panelModel: leadData.panel_model || '',
                    panelWattage: leadData.panel_wattage || 455,
                    panelCount: leadData.panel_count || (leadData.system_size_kw ? Math.ceil((leadData.system_size_kw * 1000) / 455) : 0),
                    inverterBrand: leadData.inverter_brand || 'Huawei',
                    inverterModel: leadData.inverter_model || '',
                    hasBattery: leadData.with_battery || false,
                    batteryBrand: leadData.battery_brand || undefined,
                    batteryModel: leadData.battery_model || undefined,
                    batteryKwh: leadData.battery_size_kwh || undefined,
                  },
                  pricing: {
                    totalPrice: leadData.total_price || 0,
                    grantAmount: leadData.grant_amount || 0,
                    netCost: (leadData.total_price || 0) - (leadData.grant_amount || 0),
                  },
                }),
              });

              if (contractResponse.ok) {
                const contractData = await contractResponse.json();
                contractSigningUrl = contractData.signingUrl || null;
                console.log('Portal contract created:', contractData.contractReference);
                break; // Success - exit retry loop
              }

              // Don't retry on client errors (4xx) except rate limiting
              if (contractResponse.status >= 400 && contractResponse.status < 500 && contractResponse.status !== 429) {
                const errorText = await contractResponse.text();
                console.error(`Backoffice contract creation failed (${contractResponse.status}):`, errorText);
                break; // Don't retry client errors
              }

              // Server error - retry if we have attempts left
              if (attempt < MAX_RETRIES - 1) {
                console.log(`Contract creation attempt ${attempt + 1} failed, retrying in ${RETRY_DELAYS[attempt]}ms...`);
                await sleep(RETRY_DELAYS[attempt]);
              } else {
                const errorText = await contractResponse.text();
                console.error('All contract creation retries failed:', contractResponse.status, errorText);
              }
            } catch (error) {
              // Network error - retry if we have attempts left
              if (attempt < MAX_RETRIES - 1) {
                console.error(`Contract creation network error (attempt ${attempt + 1}):`, error);
                await sleep(RETRY_DELAYS[attempt]);
              } else {
                console.error('All contract creation retries failed due to network errors:', error);
              }
            }
          }
        } else {
          console.log('PORTAL_CONTRACT_SECRET not configured, skipping contract creation');
        }
      }
    }

    // =========================================================================
    // SEND CUSTOMER COMMUNICATIONS (Email + SMS)
    // Non-blocking - don't fail lead creation if communications fail
    // Send for BOTH new leads AND quote completions (updated leads)
    // =========================================================================
    if (lead?.id && leadData.email && leadData.total_price) {
      const signingUrl = contractSigningUrl || fallbackSigningUrl || undefined;
      const quoteRef = `GHX-${lead.id.substring(0, 8).toUpperCase()}`;

      // Determine if this is a quote completion (has system config + price)
      const isQuoteComplete = leadData.system_size_kw && leadData.total_price && leadData.total_price > 0;

      // Only send emails/SMS if quote is complete (prevent sending for partial wizard data)
      if (isQuoteComplete) {
        console.log('[Lead] Quote complete - sending email + SMS confirmations');

        // Prepare confirmation data
        const confirmationData = {
          name: leadData.name,
          systemSize: leadData.system_size_kw || 0,
          totalPrice: leadData.total_price || 0,
          annualSavings: leadData.annual_savings || 0,
          paybackYears: leadData.annual_savings && leadData.total_price
            ? Math.round((leadData.total_price - (leadData.grant_amount || 0)) / leadData.annual_savings * 10) / 10
            : 5,
          withBattery: leadData.with_battery || false,
          batterySize: leadData.battery_size_kwh ?? undefined,
          paymentMethod: (leadData.payment_method as 'cash' | 'loan') || 'cash',
          monthlyPayment: leadData.monthly_payment ?? undefined,
          contractSigningUrl: signingUrl,
          quoteRef,
        };

        // Send email confirmation (logged in Zoho CRM if zohoLeadId available)
        if (isEmailConfigured()) {
          sendLeadConfirmationEmail(finalZohoId || null, confirmationData, leadData.email)
            .then(result => {
              if (result.success) {
                console.log('[Lead] Email confirmation sent:', result.messageId);
              } else {
                console.error('[Lead] Email confirmation failed:', result.error);
              }
            })
            .catch(err => console.error('[Lead] Email error:', err));
        }

        // Send SMS confirmation
        if (isSmsConfigured() && leadData.phone) {
          sendLeadConfirmationSms(leadData.phone, {
            name: leadData.name,
            quoteRef,
            systemSize: leadData.system_size_kw || 0,
          })
            .then(result => {
              if (result.success) {
                console.log('[Lead] SMS confirmation sent:', result.messageId);
              } else {
                console.error('[Lead] SMS confirmation failed:', result.error);
              }
            })
            .catch(err => console.error('[Lead] SMS error:', err));
        }

        // Schedule follow-up communications (24h, 72h, 7d)
        // Only schedule if this is a NEW quote (prevent duplicate follow-ups for updates)
        const isNewQuote = !existingLead || !existingLead.total_price || existingLead.total_price === 0;
        if (isNewQuote) {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

          if (supabaseUrl && supabaseKey) {
            const now = new Date();
            const followUps = [
              { type: 'follow-up-24h', channel: 'email', hours: 24 },
              { type: 'follow-up-24h', channel: 'sms', hours: 24 },
              { type: 'follow-up-72h', channel: 'email', hours: 72 },
              { type: 'follow-up-7d', channel: 'email', hours: 168 },
            ];

            const scheduleData = followUps.map(fu => ({
              lead_id: lead.id,
              scheduled_at: new Date(now.getTime() + fu.hours * 60 * 60 * 1000).toISOString(),
              type: fu.type,
              channel: fu.channel,
              status: 'pending',
              metadata: { quoteRef, contractUrl: signingUrl },
            }));

            fetch(`${supabaseUrl}/rest/v1/follow_up_schedule`, {
              method: 'POST',
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal',
              },
              body: JSON.stringify(scheduleData),
            }).catch(err => console.error('[Lead] Failed to schedule follow-ups:', err));
          }
        }
      } else {
        console.log('[Lead] Quote incomplete - skipping email/SMS (no system size or price)');
      }
    }

    return NextResponse.json({
      success: true,
      lead: lead ? {
        id: lead.id,
        created_at: lead.created_at,
        contract_signing_url: contractSigningUrl,
      } : null,
      lead_id: lead?.id || null, // Always return lead_id for fallback signing URL
      zoho_lead_id: zohoLeadId,
      supabase_success: supabaseResult.status === 'fulfilled',
      zoho_success: zohoResult.status === 'fulfilled',
      is_hot_lead: hotLead,
      is_returning_lead: isReturningLead,
      contract_signing_url: contractSigningUrl,
      fallback_signing_url: fallbackSigningUrl, // Always available if lead was created
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
