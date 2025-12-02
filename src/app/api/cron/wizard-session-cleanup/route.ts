import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cron endpoint to mark abandoned wizard sessions and notify sales team
// Should be called every 30-60 minutes
// Identifies users who started the wizard but didn't complete (potential leads!)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface WizardSessionSummary {
  id: string;
  address: string | null;
  location: string | null;
  highest_step_reached: number;
  selected_system: string | null;
  system_size_kw: number | null;
  with_battery: boolean;
  battery_size_kwh: number | null;
  total_price: number | null;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  created_at: string;
  last_activity_at: string;
}

// Step names for human-readable output
const STEP_NAMES: Record<number, string> = {
  1: 'Location',
  2: 'Consumption',
  3: 'System Selection',
  4: 'Financing',
  5: 'Contact',
  6: 'Summary',
};

async function notifySalesTeam(sessions: WizardSessionSummary[]) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!botToken || !chatId || sessions.length === 0) return;

  // Group by step for better reporting
  const byStep: Record<number, WizardSessionSummary[]> = {};
  sessions.forEach(s => {
    const step = s.highest_step_reached;
    if (!byStep[step]) byStep[step] = [];
    byStep[step].push(s);
  });

  // Build message with high-value sessions (step 3+)
  const highValueSessions = sessions.filter(s =>
    s.highest_step_reached >= 3 && (s.address || s.selected_system)
  );

  if (highValueSessions.length === 0) return; // Don't spam for low-intent sessions

  const sessionList = highValueSessions.slice(0, 5).map((s, i) => {
    const minutesAgo = Math.round((Date.now() - new Date(s.last_activity_at).getTime()) / (1000 * 60));
    return `${i + 1}. *Step ${s.highest_step_reached}* (${STEP_NAMES[s.highest_step_reached]})
   📍 ${s.address || 'No address'}
   🔆 ${s.selected_system || 'No system'} ${s.system_size_kw ? `(${s.system_size_kw} kWp)` : ''}
   💰 ${s.total_price ? `€${s.total_price.toLocaleString()}` : 'No price'}
   ⏱️ ${minutesAgo}min ago`;
  }).join('\n\n');

  // Summary stats
  const stepSummary = Object.entries(byStep)
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([step, list]) => `Step ${step}: ${list.length}`)
    .join(' | ');

  const message = `📊 *Wizard Session Report*

${sessions.length} session${sessions.length > 1 ? 's' : ''} marked as abandoned

*Drop-off by step:* ${stepSummary}

*High-Value Abandonments:*

${sessionList}

${highValueSessions.length > 5 ? `... and ${highValueSessions.length - 5} more` : ''}

💡 *Insight:* ${sessions.filter(s => s.highest_step_reached >= 4).length} users got to financing - very close to converting!`;

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

export async function GET(request: NextRequest) {
  // Verify cron secret (if configured)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    // Find in_progress sessions that have been idle for 30+ minutes
    const { data: staleSessions, error: staleError } = await supabase
      .from('wizard_sessions')
      .select(`
        id, address, location, highest_step_reached,
        selected_system, system_size_kw, with_battery, battery_size_kwh,
        total_price, email, phone, full_name, created_at, last_activity_at
      `)
      .eq('status', 'in_progress')
      .lt('last_activity_at', thirtyMinutesAgo)
      .order('highest_step_reached', { ascending: false })
      .limit(100);

    if (staleError) {
      console.error('Failed to fetch stale sessions:', staleError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!staleSessions || staleSessions.length === 0) {
      return NextResponse.json({
        success: true,
        abandoned: 0,
        message: 'No stale sessions found',
      });
    }

    // Mark sessions as abandoned
    const sessionIds = staleSessions.map(s => s.id);
    const { error: updateError } = await supabase
      .from('wizard_sessions')
      .update({ status: 'abandoned' })
      .in('id', sessionIds);

    if (updateError) {
      console.error('Failed to mark sessions as abandoned:', updateError);
      return NextResponse.json({ error: 'Failed to update sessions' }, { status: 500 });
    }

    // Notify sales team about high-value abandonments
    await notifySalesTeam(staleSessions as WizardSessionSummary[]);

    // Calculate analytics
    const stepCounts: Record<number, number> = {};
    staleSessions.forEach(s => {
      const step = s.highest_step_reached;
      stepCounts[step] = (stepCounts[step] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      abandoned: staleSessions.length,
      by_step: stepCounts,
      high_value: staleSessions.filter(s => s.highest_step_reached >= 3).length,
      message: `Marked ${staleSessions.length} sessions as abandoned`,
    });
  } catch (error) {
    console.error('Wizard session cleanup cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Allow both GET and POST for flexibility with cron services
export const POST = GET;
