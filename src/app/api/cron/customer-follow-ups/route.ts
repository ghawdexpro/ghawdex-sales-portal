import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendFollowUpEmail, sendContractReminderEmail } from '@/lib/email';
import { sendFollowUpSms } from '@/lib/sms';

/**
 * Customer Follow-up Cron Job
 *
 * Processes scheduled follow-up communications from the follow_up_schedule table.
 * Should be run every 1-4 hours via Railway/Vercel cron.
 *
 * GET /api/cron/customer-follow-ups
 * Authorization: Bearer {CRON_SECRET}
 */

// Lazy initialization to avoid build-time errors
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface ScheduledFollowUp {
  id: string;
  lead_id: string;
  scheduled_at: string;
  type: string;
  channel: string;
  status: string;
  metadata: {
    quoteRef?: string;
    contractUrl?: string;
  };
}

interface LeadInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  system_size_kw: number;
  annual_savings: number;
  total_price: number;
  zoho_lead_id: string | null;
  status: string;
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();
  const results = {
    processed: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: [] as string[],
  };

  try {
    // Fetch pending follow-ups that are due (scheduled_at <= now)
    const now = new Date().toISOString();

    const { data: pendingFollowUps, error: fetchError } = await supabase
      .from('follow_up_schedule')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(50); // Process max 50 at a time

    if (fetchError) {
      console.error('[Cron] Failed to fetch pending follow-ups:', fetchError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!pendingFollowUps || pendingFollowUps.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending follow-ups',
        ...results,
      });
    }

    console.log(`[Cron] Processing ${pendingFollowUps.length} pending follow-ups`);

    // Get unique lead IDs and fetch lead info
    const leadIds = [...new Set(pendingFollowUps.map(f => f.lead_id))];

    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, name, email, phone, system_size_kw, annual_savings, total_price, zoho_lead_id, status')
      .in('id', leadIds);

    if (leadsError) {
      console.error('[Cron] Failed to fetch leads:', leadsError);
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    const leadsMap = new Map<string, LeadInfo>(leads?.map(l => [l.id, l]) || []);

    // Process each follow-up
    for (const followUp of pendingFollowUps as ScheduledFollowUp[]) {
      results.processed++;

      const lead = leadsMap.get(followUp.lead_id);

      if (!lead) {
        console.warn(`[Cron] Lead not found for follow-up: ${followUp.id}`);
        await markFollowUp(supabase, followUp.id, 'skipped', 'Lead not found');
        results.skipped++;
        continue;
      }

      // Skip if lead status is not 'new' (already contacted or converted)
      if (lead.status !== 'new') {
        console.log(`[Cron] Skipping follow-up for lead ${lead.id} - status: ${lead.status}`);
        await markFollowUp(supabase, followUp.id, 'skipped', `Lead status: ${lead.status}`);
        results.skipped++;
        continue;
      }

      // Prepare follow-up data
      const followUpData = {
        name: lead.name,
        quoteRef: followUp.metadata?.quoteRef || `GHX-${lead.id.substring(0, 8).toUpperCase()}`,
        systemSize: lead.system_size_kw || 0,
        annualSavings: lead.annual_savings || 0,
        contractSigningUrl: followUp.metadata?.contractUrl,
        salesPhone: '+356 7905 5156',
      };

      let success = false;
      let messageId: string | undefined;
      let errorMessage: string | undefined;

      try {
        // Send based on channel
        if (followUp.channel === 'email' && lead.email) {
          // Determine if this is a follow-up or contract reminder
          if (followUp.type.startsWith('follow-up-')) {
            const template = followUp.type as 'follow-up-24h' | 'follow-up-72h' | 'follow-up-7d';
            const result = await sendFollowUpEmail(lead.zoho_lead_id || lead.id, template, followUpData);
            success = result.success;
            messageId = result.messageId;
            errorMessage = result.error;
          } else if (followUp.type === 'contract-reminder' && followUp.metadata?.contractUrl) {
            const result = await sendContractReminderEmail(lead.zoho_lead_id || lead.id, {
              name: lead.name,
              quoteRef: followUpData.quoteRef,
              systemSize: lead.system_size_kw || 0,
              totalPrice: lead.total_price || 0,
              contractSigningUrl: followUp.metadata.contractUrl,
              daysWaiting: Math.floor((Date.now() - new Date(followUp.scheduled_at).getTime()) / (1000 * 60 * 60 * 24)),
            });
            success = result.success;
            messageId = result.messageId;
            errorMessage = result.error;
          }
        } else if (followUp.channel === 'sms' && lead.phone) {
          if (followUp.type.startsWith('follow-up-')) {
            const template = followUp.type as 'follow-up-24h' | 'follow-up-72h' | 'follow-up-7d';
            const result = await sendFollowUpSms(lead.phone, template, {
              name: lead.name,
              quoteRef: followUpData.quoteRef,
              contractUrl: followUp.metadata?.contractUrl,
            });
            success = result.success;
            messageId = result.messageId;
            errorMessage = result.error;
          }
        } else {
          errorMessage = `No ${followUp.channel} contact info for lead`;
        }

        // Update follow-up status
        if (success) {
          await markFollowUp(supabase, followUp.id, 'sent', undefined, messageId);
          results.sent++;
          console.log(`[Cron] Sent ${followUp.type} via ${followUp.channel} to ${lead.name}`);
        } else {
          await markFollowUp(supabase, followUp.id, 'failed', errorMessage);
          results.failed++;
          results.errors.push(`${followUp.id}: ${errorMessage}`);
          console.error(`[Cron] Failed to send ${followUp.type}: ${errorMessage}`);
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        await markFollowUp(supabase, followUp.id, 'failed', errMsg);
        results.failed++;
        results.errors.push(`${followUp.id}: ${errMsg}`);
        console.error(`[Cron] Error processing follow-up ${followUp.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} follow-ups`,
      ...results,
    });
  } catch (error) {
    console.error('[Cron] Customer follow-ups error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper to update follow-up status
async function markFollowUp(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  id: string,
  status: 'sent' | 'failed' | 'skipped',
  error?: string,
  messageId?: string
) {
  await supabase
    .from('follow_up_schedule')
    .update({
      status,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
      result_message_id: messageId || null,
      result_error: error || null,
    })
    .eq('id', id);
}

// Support POST for flexibility
export const POST = GET;
