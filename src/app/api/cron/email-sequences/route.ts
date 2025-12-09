/**
 * Email Sequences Cron Job
 *
 * Runs every hour to send automated follow-up emails:
 * - 24h follow-up (if no response)
 * - 72h follow-up (if no response)
 * - 7d final follow-up (if no response)
 *
 * Cron: 0 * * * * (every hour)
 */

import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { sendFollowUpEmail } from '@/lib/email';
import crypto from 'crypto';

// Generate HMAC token for lead signing URL (same algorithm as backoffice)
function generateLeadSigningToken(leadId: string): string | null {
  const secret = process.env.PORTAL_CONTRACT_SECRET || process.env.CRON_SECRET;
  if (!secret) {
    console.error('[EmailCron] No secret configured for signing URLs');
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

// Build contract signing URL with HMAC token
function buildContractSigningUrl(leadId: string): string {
  const backofficeUrl = process.env.BACKOFFICE_URL || 'https://bo.ghawdex.pro';
  const token = generateLeadSigningToken(leadId);
  if (token) {
    return `${backofficeUrl}/sign/lead/${leadId}?t=${token}`;
  }
  // Fallback without token (will likely be rejected by backoffice)
  return `${backofficeUrl}/sign/lead/${leadId}`;
}

// Build unsubscribe URL with HMAC token
function buildUnsubscribeUrl(leadId: string): string {
  const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://get.ghawdex.pro';
  const token = generateLeadSigningToken(leadId);
  if (token) {
    return `${portalUrl}/api/unsubscribe?lead=${leadId}&token=${token}`;
  }
  // Without token the unsubscribe will fail validation
  return `${portalUrl}/api/unsubscribe?lead=${leadId}`;
}

// Lazy-initialized Supabase client (avoids build-time errors)
let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabase;
}

// Time thresholds in hours
const FOLLOW_UP_24H = 24;
const FOLLOW_UP_48H = 48;
const FOLLOW_UP_72H = 72;
const FOLLOW_UP_7D = 168; // 7 days

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = {
    followUps: { sent: 0, skipped: 0, errors: 0 },
    details: [] as string[],
  };

  try {
    // 1. Get leads that need follow-ups (including system data for emails)
    // Filter out opted-out leads - they shouldn't receive any more emails
    const { data: leads, error: leadsError } = await getSupabase()
      .from('leads')
      .select(`
        id,
        name,
        email,
        phone,
        zoho_lead_id,
        status,
        created_at,
        converted_at,
        system_size_kw,
        battery_size_kwh,
        with_battery,
        annual_savings,
        grant_amount,
        total_price,
        is_gozo,
        email_opted_out
      `)
      .in('status', ['new', 'contacted', 'qualified'])
      .is('converted_at', null)
      .is('deleted_at', null)
      .or('email_opted_out.is.null,email_opted_out.eq.false')  // Only leads who haven't opted out
      .order('created_at', { ascending: false })
      .limit(100);

    if (leadsError) {
      console.error('[EmailCron] Error fetching leads:', leadsError);
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({ message: 'No leads to process', results });
    }

    // 2. Get sent communications to avoid duplicates
    const leadIds = leads.map(l => l.id);
    const { data: communications } = await getSupabase()
      .from('communications')
      .select('lead_id, template_used, created_at')
      .in('lead_id', leadIds)
      .eq('channel', 'email');

    // Build a map of sent emails per lead
    const sentEmails = new Map<string, Set<string>>();
    communications?.forEach(comm => {
      if (!sentEmails.has(comm.lead_id)) {
        sentEmails.set(comm.lead_id, new Set());
      }
      sentEmails.get(comm.lead_id)!.add(comm.template_used);
    });

    // 3. Process each lead
    for (const lead of leads) {
      if (!lead.email || !lead.zoho_lead_id) {
        results.followUps.skipped++;
        continue;
      }

      const leadSentEmails = sentEmails.get(lead.id) || new Set();
      const hoursSinceCreation = Math.floor(
        (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60)
      );

      // Check which follow-up to send
      const emailToSend = getFollowUpToSend(hoursSinceCreation, leadSentEmails);

      if (!emailToSend) {
        results.followUps.skipped++;
        continue;
      }

      try {
        // Apply defaults for leads without system data (Facebook, external sources)
        // User requirement: default 5 kWp + 10 kWh battery, Gozo location
        const systemSize = lead.system_size_kw || 5;  // Default: 5 kWp Essential
        const batterySize = lead.battery_size_kwh || 10;  // Default: 10 kWh LUNA
        const annualSavings = lead.annual_savings || 1800;  // Default estimate
        const totalPrice = lead.total_price || 13000;  // Default Gozo package
        const grantAmount = lead.grant_amount || 9875;  // Default Gozo grants
        const netCost = totalPrice - grantAmount;
        const isGozo = lead.is_gozo ?? true;  // Default to Gozo

        // Generate valid URLs with HMAC tokens
        const contractSigningUrl = buildContractSigningUrl(lead.id);
        const unsubscribeUrl = buildUnsubscribeUrl(lead.id);

        const result = await sendFollowUpEmail(
          lead.zoho_lead_id,
          emailToSend,
          {
            name: lead.name,
            quoteRef: `GX-${lead.id.slice(0, 8).toUpperCase()}`,
            systemSize,
            batterySize,
            annualSavings,
            totalPrice,
            grantAmount,
            netCost,
            pvGrant: 2750,  // Fixed Malta PV grant (50% up to €2,750)
            batteryGrant: isGozo ? 7125 : 6000,  // 95% Gozo vs 80% Malta
            isGozo,
            panelCount: 11,  // Default for 5 kWp
            contractSigningUrl,
            unsubscribeUrl,
            salesPhone: '+356 7905 5156',
          }
        );

        if (result.success) {
          // Log to communications table
          await getSupabase().from('communications').insert({
            lead_id: lead.id,
            channel: 'email',
            direction: 'outbound',
            template_used: emailToSend,
            status: 'sent',
            subject: getEmailSubject(emailToSend, lead.name),
            external_message_id: result.messageId,
          });

          results.followUps.sent++;
          results.details.push(`Sent ${emailToSend} to ${lead.email}`);
        } else {
          results.followUps.errors++;
          results.details.push(`Failed ${emailToSend} for ${lead.email}: ${result.error}`);
        }
      } catch (error) {
        results.followUps.errors++;
        console.error(`[EmailCron] Error sending ${emailToSend}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      processed: leads.length,
      results,
    });
  } catch (error) {
    console.error('[EmailCron] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Determine which follow-up email to send (only one at a time)
 */
function getFollowUpToSend(
  hoursSinceCreation: number,
  alreadySent: Set<string>
): 'follow-up-24h' | 'follow-up-48h' | 'follow-up-72h' | 'follow-up-7d' | null {
  // Check in order: 24h, 48h, 72h, 7d
  if (hoursSinceCreation >= FOLLOW_UP_24H && !alreadySent.has('follow-up-24h')) {
    return 'follow-up-24h';
  }
  if (hoursSinceCreation >= FOLLOW_UP_48H && !alreadySent.has('follow-up-48h')) {
    return 'follow-up-48h';
  }
  if (hoursSinceCreation >= FOLLOW_UP_72H && !alreadySent.has('follow-up-72h')) {
    return 'follow-up-72h';
  }
  if (hoursSinceCreation >= FOLLOW_UP_7D && !alreadySent.has('follow-up-7d')) {
    return 'follow-up-7d';
  }
  return null;
}

/**
 * Get email subject for logging
 */
function getEmailSubject(emailType: string, name: string): string {
  const firstName = name.split(' ')[0];

  const subjects: Record<string, string> = {
    'follow-up-24h': `${firstName}, your solar quote is ready to review`,
    'follow-up-48h': `${firstName}, see what we built for your neighbors in Gozo`,
    'follow-up-72h': `${firstName}, you've paid ARMS money since your quote arrived`,
    'follow-up-7d': `${firstName}, before I close your solar file...`,
  };

  return subjects[emailType] || `GhawdeX Solar - ${emailType}`;
}

// Also support POST for manual triggers
export async function POST(request: Request) {
  return GET(request);
}
