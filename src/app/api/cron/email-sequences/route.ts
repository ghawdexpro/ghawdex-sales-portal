/**
 * Email Sequences Cron Job
 *
 * Runs every hour to send automated follow-up emails:
 * - 24h follow-up (if no response)
 * - 72h follow-up (if no response)
 * - 7d final follow-up (if no response)
 *
 * Also handles marketing sequences based on lead pillar:
 * - Speed Pillar: Fast installation messaging
 * - Grants Pillar: €10,200 grant focus
 * - Nurture: Educational content for cold leads
 *
 * Cron: 0 * * * * (every hour)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendFollowUpEmail, sendEmailViaZohoCRM } from '@/lib/email';
import { generateMarketingEmail } from '@/lib/email/templates/marketing-sequences';

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Time thresholds in hours
const FOLLOW_UP_24H = 24;
const FOLLOW_UP_72H = 72;
const FOLLOW_UP_7D = 168; // 7 days

// Sequence email timing (hours after lead creation)
const SEQUENCE_TIMINGS = {
  'speed-1': 1,      // 1 hour - immediate
  'speed-2': 72,     // 3 days
  'speed-3': 120,    // 5 days
  'grants-1': 1,     // 1 hour - immediate
  'grants-2': 72,    // 3 days
  'grants-3': 120,   // 5 days
  'nurture-1': 48,   // 2 days
  'nurture-2': 168,  // 7 days
  'nurture-3': 336,  // 14 days
};

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = {
    followUps: { sent: 0, skipped: 0, errors: 0 },
    sequences: { sent: 0, skipped: 0, errors: 0 },
    details: [] as string[],
  };

  try {
    // 1. Get leads that need follow-ups
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select(`
        id,
        name,
        email,
        phone,
        zoho_lead_id,
        status,
        lead_score,
        quality_score,
        source_campaign,
        source_medium,
        is_gozo,
        created_at,
        converted_at
      `)
      .in('status', ['new', 'contacted', 'qualified'])
      .is('converted_at', null)
      .is('deleted_at', null)
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
    const { data: communications } = await supabase
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

      // Determine lead pillar based on source/score
      const pillar = determinePillar(lead);

      // Check which emails to send
      const emailsToSend = getEmailsToSend(
        hoursSinceCreation,
        leadSentEmails,
        pillar,
        lead.lead_score || 0
      );

      for (const emailType of emailsToSend) {
        try {
          let result;

          if (emailType.startsWith('follow-up')) {
            // Standard follow-up emails
            result = await sendFollowUpEmail(
              lead.zoho_lead_id,
              emailType as 'follow-up-24h' | 'follow-up-72h' | 'follow-up-7d',
              {
                name: lead.name,
                quoteRef: `GX-${lead.id.slice(0, 8).toUpperCase()}`,
                systemSize: 10, // Default, should come from quote
                annualSavings: 1800, // Default, should come from quote
                contractSigningUrl: `https://bo.ghawdex.pro/sign/lead/${lead.id}`,
                salesPhone: '+356 7905 5156',
              }
            );
          } else {
            // Marketing sequence emails
            const { subject, html } = generateMarketingEmail(emailType, {
              name: lead.name,
              isGozo: lead.is_gozo,
            });

            result = await sendEmailViaZohoCRM({
              leadId: lead.zoho_lead_id,
              subject,
              html,
            });
          }

          if (result.success) {
            // Log to communications table
            await supabase.from('communications').insert({
              lead_id: lead.id,
              channel: 'email',
              direction: 'outbound',
              template_used: emailType,
              status: 'sent',
              subject: getEmailSubject(emailType, lead.name),
              external_message_id: result.messageId,
            });

            results.followUps.sent++;
            results.details.push(`Sent ${emailType} to ${lead.email}`);
          } else {
            results.followUps.errors++;
            results.details.push(`Failed ${emailType} for ${lead.email}: ${result.error}`);
          }
        } catch (error) {
          results.followUps.errors++;
          console.error(`[EmailCron] Error sending ${emailType}:`, error);
        }
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
 * Determine which pillar a lead belongs to based on source and behavior
 */
function determinePillar(lead: {
  source_campaign?: string | null;
  source_medium?: string | null;
  lead_score?: number | null;
}): 'speed' | 'grants' | 'nurture' {
  const campaign = (lead.source_campaign || '').toLowerCase();
  const medium = (lead.source_medium || '').toLowerCase();

  // Check campaign/medium for pillar hints
  if (campaign.includes('speed') || campaign.includes('14day') || campaign.includes('fast')) {
    return 'speed';
  }
  if (campaign.includes('grant') || campaign.includes('10200') || campaign.includes('savings')) {
    return 'grants';
  }

  // High-intent leads get grants messaging (most compelling)
  if ((lead.lead_score || 0) >= 50) {
    return 'grants';
  }

  // Low-score leads get nurture sequence
  if ((lead.lead_score || 0) < 30) {
    return 'nurture';
  }

  // Default to grants (strongest message)
  return 'grants';
}

/**
 * Determine which emails need to be sent based on timing
 */
function getEmailsToSend(
  hoursSinceCreation: number,
  alreadySent: Set<string>,
  pillar: 'speed' | 'grants' | 'nurture',
  leadScore: number
): string[] {
  const emailsToSend: string[] = [];

  // Standard follow-ups (for all pillars)
  if (hoursSinceCreation >= FOLLOW_UP_24H && !alreadySent.has('follow-up-24h')) {
    emailsToSend.push('follow-up-24h');
  }
  if (hoursSinceCreation >= FOLLOW_UP_72H && !alreadySent.has('follow-up-72h')) {
    emailsToSend.push('follow-up-72h');
  }
  if (hoursSinceCreation >= FOLLOW_UP_7D && !alreadySent.has('follow-up-7d')) {
    emailsToSend.push('follow-up-7d');
  }

  // Marketing sequence emails based on pillar
  const sequencePrefix = pillar;
  for (let i = 1; i <= 3; i++) {
    const emailKey = `${sequencePrefix}-${i}` as keyof typeof SEQUENCE_TIMINGS;
    const timing = SEQUENCE_TIMINGS[emailKey];

    if (hoursSinceCreation >= timing && !alreadySent.has(emailKey)) {
      emailsToSend.push(emailKey);
    }
  }

  // Only send one email at a time to avoid spam
  return emailsToSend.slice(0, 1);
}

/**
 * Get email subject for logging
 */
function getEmailSubject(emailType: string, name: string): string {
  const firstName = name.split(' ')[0];

  const subjects: Record<string, string> = {
    'follow-up-24h': `${firstName}, any questions about your solar quote?`,
    'follow-up-72h': `${firstName}, don't miss your solar savings opportunity`,
    'follow-up-7d': `${firstName}, your solar quote expires soon`,
    'speed-1': 'Your 14-day solar installation starts now',
    'speed-2': '"They did it in 14 days" - Real customer stories',
    'speed-3': 'Last chance: Start your 14-day countdown',
    'grants-1': 'How to claim your €10,200 solar grant',
    'grants-2': 'Step-by-step: How we get you €10,200',
    'grants-3': 'Grant budget update: Act now',
    'nurture-1': 'Free tool: Calculate your solar savings in 60 seconds',
    'nurture-2': 'Quick question: What\'s holding you back?',
    'nurture-3': 'Last message (but you need to see this)',
  };

  return subjects[emailType] || `GhawdeX Solar - ${emailType}`;
}

// Also support POST for manual triggers
export async function POST(request: Request) {
  return GET(request);
}
