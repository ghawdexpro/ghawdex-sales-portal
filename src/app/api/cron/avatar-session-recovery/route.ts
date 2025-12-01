import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cron endpoint to recover paused avatar sessions
// Sends SMS/Telegram reminder to customers who paused and haven't returned
// Should be called every 12-24 hours

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AvatarSession {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  resume_token: string;
  updated_at: string;
  current_phase: string;
}

async function notifySalesTeam(sessions: AvatarSession[]) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!botToken || !chatId || sessions.length === 0) return;

  const sessionList = sessions.map((s, i) => {
    const hoursAgo = Math.round((Date.now() - new Date(s.updated_at).getTime()) / (1000 * 60 * 60));
    const resumeLink = `https://get.ghawdex.pro/avatar/resume/${s.resume_token}`;
    return `${i + 1}. *${s.customer_name || 'Unknown'}* (${hoursAgo}h ago)
   📱 ${s.customer_phone || 'No phone'}
   🔗 Phase: ${s.current_phase}
   Resume: \`${resumeLink}\``;
  }).join('\n\n');

  const message = `🔄 *Paused Avatar Sessions*

${sessions.length} customer${sessions.length > 1 ? 's' : ''} paused mid-conversation:

${sessionList}

💡 *Action:* Send them their resume link or call to complete quote!`;

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

async function markSessionsAbandoned(sessionIds: string[]) {
  // Mark sessions older than 72 hours as abandoned
  const { error } = await supabase
    .from('avatar_sessions')
    .update({ status: 'abandoned' })
    .in('id', sessionIds);

  if (error) {
    console.error('Failed to mark sessions as abandoned:', error);
  }
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();

    // Find paused sessions between 24-72 hours old (for recovery)
    const { data: pausedSessions, error: pausedError } = await supabase
      .from('avatar_sessions')
      .select('id, customer_name, customer_phone, customer_email, resume_token, updated_at, current_phase')
      .eq('status', 'paused')
      .lt('updated_at', twentyFourHoursAgo)
      .gt('updated_at', seventyTwoHoursAgo)
      .not('resume_token', 'is', null)
      .limit(10);

    if (pausedError) {
      console.error('Failed to fetch paused sessions:', pausedError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Find very old sessions to mark as abandoned (72h+)
    const { data: oldSessions, error: oldError } = await supabase
      .from('avatar_sessions')
      .select('id')
      .eq('status', 'paused')
      .lt('updated_at', seventyTwoHoursAgo)
      .limit(50);

    if (oldError) {
      console.error('Failed to fetch old sessions:', oldError);
    }

    // Send notification for recoverable sessions
    if (pausedSessions && pausedSessions.length > 0) {
      await notifySalesTeam(pausedSessions);
    }

    // Mark old sessions as abandoned
    if (oldSessions && oldSessions.length > 0) {
      await markSessionsAbandoned(oldSessions.map(s => s.id));
    }

    return NextResponse.json({
      success: true,
      recoverable: pausedSessions?.length || 0,
      abandoned: oldSessions?.length || 0,
      message: `Found ${pausedSessions?.length || 0} recoverable sessions, marked ${oldSessions?.length || 0} as abandoned`,
    });
  } catch (error) {
    console.error('Avatar session recovery cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = GET;
