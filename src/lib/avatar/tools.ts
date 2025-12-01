/**
 * HeyGen Avatar Chat - Tool Implementations
 *
 * Implements all function calling tools for the conversation engine.
 * Tools handle external actions like sending SMS, calculating quotes,
 * and saving to CRM.
 */

import { FunctionCall, FunctionResult, AvatarSession, ToolName } from './types';
import { ENV, LINK_TEMPLATES, MESSAGE_TEMPLATES } from './config';
import {
  SYSTEM_PACKAGES,
  BATTERY_OPTIONS,
  Location,
  GrantType,
  calculateGrantAmount,
} from '../types';
import {
  calculateTotalPriceWithGrant,
  calculateAnnualSavingsWithGrant,
  calculatePaybackYears,
  calculateMonthlyPayment,
  recommendSystem,
} from '../calculations';

// ============================================================================
// Main Tool Executor
// ============================================================================

export async function executeToolCall(
  call: FunctionCall,
  session: AvatarSession
): Promise<FunctionResult> {
  const toolName = call.name as ToolName;
  const args = call.arguments;

  try {
    let result: unknown;

    switch (toolName) {
      case 'send_location_link':
        result = await sendLocationLink(
          session.id,
          args.phone as string,
          args.channel as 'sms' | 'whatsapp',
          session.customer_name || undefined
        );
        break;

      case 'send_bill_upload_link':
        result = await sendBillUploadLink(
          session.id,
          args.phone as string,
          args.channel as 'sms' | 'whatsapp',
          session.customer_name || undefined
        );
        break;

      case 'send_document_link':
        result = await sendDocumentLink(
          session.id,
          args.phone as string,
          args.document_type as string,
          args.channel as 'sms' | 'whatsapp'
        );
        break;

      case 'send_signature_link':
        result = await sendSignatureLink(
          session.id,
          args.phone as string,
          args.email as string,
          args.channel as 'sms' | 'whatsapp' | 'email'
        );
        break;

      case 'check_data_received':
        result = await checkDataReceived(
          session.id,
          args.data_type as 'location' | 'bill' | 'document' | 'signature'
        );
        break;

      case 'get_solar_analysis':
        result = await getSolarAnalysis(args.lat as number, args.lng as number);
        break;

      case 'calculate_quote':
        result = calculateQuote(
          args.system_id as string,
          args.with_battery as boolean,
          args.battery_size_kwh as number | undefined,
          args.grant_type as GrantType,
          args.location as Location,
          args.payment_method as 'cash' | 'loan',
          args.loan_term_months as number | undefined
        );
        break;

      case 'recommend_system':
        result = getSystemRecommendation(
          args.monthly_consumption_kwh as number,
          args.roof_area_m2 as number | undefined
        );
        break;

      case 'save_to_crm':
        result = await saveToCRM(
          session,
          args.send_telegram_notification as boolean | undefined
        );
        break;

      case 'create_human_task':
        result = await createHumanTask(
          session,
          args.reason as string,
          args.priority as string,
          args.preferred_contact_time as string | undefined
        );
        break;

      case 'pause_session':
        result = await pauseSession(
          session,
          args.reason as string,
          args.send_resume_link as boolean,
          args.resume_channel as 'sms' | 'whatsapp' | 'email' | undefined
        );
        break;

      case 'send_summary_email':
        result = await sendSummaryEmail(
          session,
          args.email as string,
          args.include_quote_pdf as boolean | undefined
        );
        break;

      case 'schedule_callback':
        result = await scheduleCallback(
          session,
          args.type as 'call' | 'site_visit',
          args.preferred_date as string | undefined,
          args.preferred_time as string | undefined,
          args.notes as string | undefined
        );
        break;

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }

    return {
      name: toolName,
      result,
      success: true,
    };
  } catch (error) {
    console.error(`Tool ${toolName} failed:`, error);
    return {
      name: toolName,
      result: null,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// Communication Tools (SMS/WhatsApp)
// ============================================================================

async function sendLocationLink(
  sessionId: string,
  phone: string,
  channel: 'sms' | 'whatsapp',
  customerName?: string
): Promise<{ success: boolean; link_url: string; message_id?: string }> {
  const linkUrl = LINK_TEMPLATES.location(sessionId);
  const message = MESSAGE_TEMPLATES.location_request(customerName || 'there') + linkUrl;

  // In production, this would call Twilio API
  // For now, we'll simulate the send
  const result = await sendMessage(phone, message, channel);

  return {
    success: result.success,
    link_url: linkUrl,
    message_id: result.message_id,
  };
}

async function sendBillUploadLink(
  sessionId: string,
  phone: string,
  channel: 'sms' | 'whatsapp',
  customerName?: string
): Promise<{ success: boolean; link_url: string; message_id?: string }> {
  const linkUrl = LINK_TEMPLATES.bill(sessionId);
  const message = MESSAGE_TEMPLATES.bill_upload_request(customerName || 'there') + linkUrl;

  const result = await sendMessage(phone, message, channel);

  return {
    success: result.success,
    link_url: linkUrl,
    message_id: result.message_id,
  };
}

async function sendDocumentLink(
  sessionId: string,
  phone: string,
  documentType: string,
  channel: 'sms' | 'whatsapp'
): Promise<{ success: boolean; link_url: string; message_id?: string }> {
  const linkUrl = LINK_TEMPLATES.document(sessionId, documentType);
  const message = `Please upload your ${documentType.replace('_', ' ')} here: ${linkUrl}`;

  const result = await sendMessage(phone, message, channel);

  return {
    success: result.success,
    link_url: linkUrl,
    message_id: result.message_id,
  };
}

async function sendSignatureLink(
  sessionId: string,
  phone: string,
  email: string,
  channel: 'sms' | 'whatsapp' | 'email'
): Promise<{ success: boolean; link_url: string; message_id?: string }> {
  // In production, this would create a contract in SignNow/DocuSign and return the signing link
  const linkUrl = LINK_TEMPLATES.signature(sessionId);
  const message = `Your solar installation contract is ready for signature: ${linkUrl}`;

  if (channel === 'email') {
    // Would send email via SendGrid/SES
    console.log(`Would send signature email to ${email}: ${message}`);
    return { success: true, link_url: linkUrl };
  }

  const result = await sendMessage(phone, message, channel);

  return {
    success: result.success,
    link_url: linkUrl,
    message_id: result.message_id,
  };
}

/**
 * Send SMS or WhatsApp message via Twilio
 */
async function sendMessage(
  phone: string,
  message: string,
  channel: 'sms' | 'whatsapp'
): Promise<{ success: boolean; message_id?: string }> {
  // Skip if Twilio not configured (development mode)
  if (!ENV.TWILIO_ACCOUNT_SID || !ENV.TWILIO_AUTH_TOKEN) {
    console.log(`[DEV] Would send ${channel} to ${phone}: ${message}`);
    return { success: true, message_id: `dev_${Date.now()}` };
  }

  try {
    const fromNumber =
      channel === 'whatsapp'
        ? `whatsapp:${ENV.TWILIO_WHATSAPP_NUMBER}`
        : ENV.TWILIO_PHONE_NUMBER;

    const toNumber = channel === 'whatsapp' ? `whatsapp:${phone}` : phone;

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${ENV.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization:
            'Basic ' +
            Buffer.from(`${ENV.TWILIO_ACCOUNT_SID}:${ENV.TWILIO_AUTH_TOKEN}`).toString(
              'base64'
            ),
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: toNumber,
          Body: message,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Twilio error:', error);
      return { success: false };
    }

    const data = await response.json();
    return { success: true, message_id: data.sid };
  } catch (error) {
    console.error('Failed to send message:', error);
    return { success: false };
  }
}

// ============================================================================
// Data Collection Tools
// ============================================================================

async function checkDataReceived(
  sessionId: string,
  dataType: 'location' | 'bill' | 'document' | 'signature'
): Promise<{ received: boolean; data?: unknown }> {
  // In production, this would check Supabase for the submitted data
  // For now, we simulate by returning not received
  // The actual data would come via webhook/realtime subscription

  // TODO: Implement Supabase query to check for submitted data
  console.log(`Checking if ${dataType} received for session ${sessionId}`);

  return {
    received: false,
    data: null,
  };
}

async function getSolarAnalysis(
  lat: number,
  lng: number
): Promise<{
  max_panels: number;
  roof_area_m2: number;
  yearly_energy_kwh: number;
  is_fallback: boolean;
}> {
  // Call Google Solar API via our existing endpoint
  try {
    const response = await fetch(
      `${ENV.APP_URL}/api/solar?lat=${lat}&lng=${lng}`
    );

    if (!response.ok) {
      throw new Error('Solar API failed');
    }

    const data = await response.json();

    return {
      max_panels: data.maxArrayPanelsCount || 20,
      roof_area_m2: data.maxArrayAreaMeters2 || 40,
      yearly_energy_kwh: data.yearlyEnergyDcKwh || 8000,
      is_fallback: data.isFallback || false,
    };
  } catch (error) {
    console.error('Solar API error:', error);
    // Return fallback values
    return {
      max_panels: 20,
      roof_area_m2: 40,
      yearly_energy_kwh: 8000,
      is_fallback: true,
    };
  }
}

// ============================================================================
// Quote & Recommendation Tools
// ============================================================================

function calculateQuote(
  systemId: string,
  withBattery: boolean,
  batterySizeKwh: number | undefined,
  grantType: GrantType,
  location: Location,
  paymentMethod: 'cash' | 'loan',
  loanTermMonths: number | undefined
): {
  system: typeof SYSTEM_PACKAGES[0];
  battery: typeof BATTERY_OPTIONS[0] | null;
  gross_price: number;
  grant_amount: number;
  total_price: number;
  annual_savings: number;
  payback_years: number;
  monthly_payment: number | null;
  loan_total_cost: number | null;
} {
  // Find system
  const system = SYSTEM_PACKAGES.find(s => s.id === systemId);
  if (!system) {
    throw new Error(`System not found: ${systemId}`);
  }

  // Find battery if requested
  let battery: typeof BATTERY_OPTIONS[0] | null = null;
  if (withBattery && batterySizeKwh) {
    battery = BATTERY_OPTIONS.find(b => b.capacityKwh === batterySizeKwh) || null;
  }

  // Calculate pricing
  const { totalPrice, grantAmount, grossPrice } = calculateTotalPriceWithGrant(
    system,
    battery,
    grantType,
    location
  );

  // Calculate savings
  const annualSavings = calculateAnnualSavingsWithGrant(
    system.annualProductionKwh,
    grantType
  );

  // Calculate payback
  const paybackYears = calculatePaybackYears(totalPrice, annualSavings);

  // Calculate loan if applicable
  let monthlyPayment: number | null = null;
  let loanTotalCost: number | null = null;

  if (paymentMethod === 'loan' && loanTermMonths) {
    monthlyPayment = calculateMonthlyPayment(totalPrice, 0.0475, loanTermMonths);
    loanTotalCost = Math.round(monthlyPayment * loanTermMonths);
  }

  return {
    system,
    battery,
    gross_price: grossPrice,
    grant_amount: grantAmount,
    total_price: totalPrice,
    annual_savings: annualSavings,
    payback_years: paybackYears,
    monthly_payment: monthlyPayment,
    loan_total_cost: loanTotalCost,
  };
}

function getSystemRecommendation(
  monthlyConsumptionKwh: number,
  roofAreaM2?: number
): {
  recommended_system: typeof SYSTEM_PACKAGES[0];
  reason: string;
  alternatives: typeof SYSTEM_PACKAGES;
} {
  const recommended = recommendSystem(monthlyConsumptionKwh, SYSTEM_PACKAGES);

  // Filter alternatives (one smaller, one larger if available)
  const sortedSystems = [...SYSTEM_PACKAGES].sort(
    (a, b) => a.systemSizeKw - b.systemSizeKw
  );
  const recommendedIndex = sortedSystems.findIndex(s => s.id === recommended.id);

  const alternatives = sortedSystems.filter((_, i) => {
    return i === recommendedIndex - 1 || i === recommendedIndex + 1;
  });

  const annualConsumption = monthlyConsumptionKwh * 12;
  const coverage = Math.round(
    (recommended.annualProductionKwh / annualConsumption) * 100
  );

  let reason = `Based on your ${monthlyConsumptionKwh} kWh monthly consumption (${annualConsumption.toLocaleString()} kWh/year), the ${recommended.name} system will cover approximately ${coverage}% of your electricity needs.`;

  if (roofAreaM2) {
    const panelArea = recommended.panels * 2; // ~2m² per panel
    if (panelArea > roofAreaM2) {
      reason += ` Note: This may require ${Math.round(panelArea)}m² of roof space, which is slightly more than your available ${roofAreaM2}m².`;
    }
  }

  return {
    recommended_system: recommended,
    reason,
    alternatives,
  };
}

// ============================================================================
// CRM & Task Tools
// ============================================================================

async function saveToCRM(
  session: AvatarSession,
  sendTelegramNotification?: boolean
): Promise<{ success: boolean; lead_id?: string; zoho_id?: string }> {
  const data = session.collected_data;

  // Build lead object
  const lead = {
    name: data.full_name || session.customer_name || '',
    email: data.email || session.customer_email || '',
    phone: data.phone || session.customer_phone || '',
    address: data.address || '',
    coordinates: data.coordinates,
    household_size: data.household_size,
    monthly_bill: data.monthly_bill,
    consumption_kwh: data.consumption_kwh,
    roof_area: data.roof_area,
    selected_system: data.selected_system?.id || null,
    system_size_kw: data.selected_system?.systemSizeKw || null,
    with_battery: data.with_battery,
    battery_size_kwh: data.selected_battery?.capacityKwh || null,
    grant_path: data.grant_type !== 'none',
    payment_method: data.payment_method,
    loan_term: data.loan_term,
    total_price: data.total_price,
    monthly_payment: data.monthly_payment,
    annual_savings: data.annual_savings,
    notes: `Avatar session: ${session.id}`,
    zoho_lead_id: session.zoho_lead_id,
    source: 'avatar-chat',
  };

  try {
    // Call existing leads API
    const response = await fetch(`${ENV.APP_URL}/api/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lead),
    });

    if (!response.ok) {
      throw new Error('Failed to save lead');
    }

    const result = await response.json();

    return {
      success: true,
      lead_id: result.id,
      zoho_id: result.zoho_lead_id,
    };
  } catch (error) {
    console.error('Failed to save to CRM:', error);
    return { success: false };
  }
}

async function createHumanTask(
  session: AvatarSession,
  reason: string,
  priority: string,
  preferredContactTime?: string
): Promise<{ success: boolean; task_id?: string }> {
  // In production, this would create a task in Zoho CRM or a task management system
  const task = {
    type: 'human_callback',
    session_id: session.id,
    customer_name: session.customer_name || session.collected_data.full_name,
    customer_phone: session.customer_phone || session.collected_data.phone,
    customer_email: session.customer_email || session.collected_data.email,
    reason,
    priority,
    preferred_contact_time: preferredContactTime,
    created_at: new Date().toISOString(),
    conversation_summary: summarizeConversation(session),
  };

  console.log('Creating human task:', task);

  // TODO: Save to Supabase tasks table or Zoho Tasks
  // For now, we'll send a Telegram notification
  try {
    await sendTelegramNotification(
      `🙋 Human callback requested\n\n` +
        `Customer: ${task.customer_name || 'Unknown'}\n` +
        `Phone: ${task.customer_phone || 'Not provided'}\n` +
        `Priority: ${task.priority}\n` +
        `Reason: ${task.reason}\n` +
        `Preferred time: ${task.preferred_contact_time || 'Not specified'}\n\n` +
        `Session: ${session.id}`
    );

    return { success: true, task_id: `task_${Date.now()}` };
  } catch (error) {
    console.error('Failed to create human task:', error);
    return { success: false };
  }
}

async function pauseSession(
  session: AvatarSession,
  reason: string,
  sendResumeLink: boolean,
  resumeChannel?: 'sms' | 'whatsapp' | 'email'
): Promise<{ success: boolean; resume_link?: string }> {
  const resumeLink = LINK_TEMPLATES.resume(session.resume_token);

  if (sendResumeLink && resumeChannel) {
    const phone = session.customer_phone || session.collected_data.phone;
    const email = session.customer_email || session.collected_data.email;
    const name = session.customer_name || session.collected_data.full_name || 'there';

    const message = MESSAGE_TEMPLATES.resume_session(name) + resumeLink;

    if (resumeChannel === 'email' && email) {
      // Would send email
      console.log(`Would send resume email to ${email}`);
    } else if (phone) {
      await sendMessage(phone, message, resumeChannel as 'sms' | 'whatsapp');
    }
  }

  // TODO: Update session status in Supabase

  return {
    success: true,
    resume_link: resumeLink,
  };
}

async function sendSummaryEmail(
  session: AvatarSession,
  email: string,
  includeQuotePdf?: boolean
): Promise<{ success: boolean }> {
  // In production, this would use SendGrid/SES to send a formatted email
  console.log(`Would send summary email to ${email}`);
  console.log('Include PDF:', includeQuotePdf);
  console.log('Session data:', session.collected_data);

  // TODO: Implement email sending with SendGrid

  return { success: true };
}

async function scheduleCallback(
  session: AvatarSession,
  type: 'call' | 'site_visit',
  preferredDate?: string,
  preferredTime?: string,
  notes?: string
): Promise<{ success: boolean; appointment_id?: string }> {
  // In production, this would integrate with a calendar system
  const appointment = {
    type,
    session_id: session.id,
    customer_name: session.customer_name || session.collected_data.full_name,
    customer_phone: session.customer_phone || session.collected_data.phone,
    customer_email: session.customer_email || session.collected_data.email,
    address: session.collected_data.address,
    preferred_date: preferredDate,
    preferred_time: preferredTime,
    notes,
    created_at: new Date().toISOString(),
  };

  console.log('Scheduling appointment:', appointment);

  // TODO: Create calendar event and notify team

  await sendTelegramNotification(
    `📅 ${type === 'call' ? 'Callback' : 'Site Visit'} Requested\n\n` +
      `Customer: ${appointment.customer_name || 'Unknown'}\n` +
      `Phone: ${appointment.customer_phone || 'Not provided'}\n` +
      `Address: ${appointment.address || 'Not provided'}\n` +
      `Preferred: ${appointment.preferred_date || 'ASAP'} ${appointment.preferred_time || ''}\n` +
      `Notes: ${appointment.notes || 'None'}`
  );

  return { success: true, appointment_id: `apt_${Date.now()}` };
}

// ============================================================================
// Helper Functions
// ============================================================================

function summarizeConversation(session: AvatarSession): string {
  const data = session.collected_data;
  const parts: string[] = [];

  if (data.address) parts.push(`Location: ${data.address}`);
  if (data.consumption_kwh) parts.push(`Consumption: ${data.consumption_kwh} kWh/month`);
  if (data.selected_system) parts.push(`System: ${data.selected_system.name}`);
  if (data.total_price) parts.push(`Price: €${data.total_price}`);

  return parts.join(' | ') || 'No data collected yet';
}

async function sendTelegramNotification(message: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!botToken || !chatId) {
    console.log('[DEV] Telegram notification:', message);
    return;
  }

  try {
    await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    );
  } catch (error) {
    console.error('Telegram notification failed:', error);
  }
}
