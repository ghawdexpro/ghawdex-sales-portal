import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cron endpoint to send follow-up reminders for leads that haven't been contacted
// Should be called every 24 hours

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function sendTelegramReminder(leads: Array<{ id: string; name: string; email: string; phone: string; total_price: number; created_at: string }>) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!botToken || !chatId || leads.length === 0) return;

  const leadList = leads.map((lead, i) => {
    const hoursAgo = Math.round((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60));
    return `${i + 1}. *${lead.name}* - €${lead.total_price?.toLocaleString() || 'TBD'} (${hoursAgo}h ago)\n   📱 ${lead.phone}`;
  }).join('\n\n');

  const message = `⏰ *Follow-Up Reminder*

${leads.length} lead${leads.length > 1 ? 's' : ''} waiting for callback (24h+):

${leadList}

🎯 Action: Call these leads today!`;

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
    console.error('Failed to send Telegram reminder:', error);
  }
}

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find leads older than 24 hours that are still 'new' status
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: staleLeads, error } = await supabase
      .from('leads')
      .select('id, name, email, phone, total_price, created_at, system_size_kw')
      .eq('status', 'new')
      .lt('created_at', twentyFourHoursAgo)
      .order('total_price', { ascending: false }) // High value first
      .limit(10);

    if (error) {
      console.error('Failed to fetch stale leads:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!staleLeads || staleLeads.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No leads need follow-up',
        count: 0
      });
    }

    // Send Telegram reminder
    await sendTelegramReminder(staleLeads);

    return NextResponse.json({
      success: true,
      message: `Sent reminder for ${staleLeads.length} leads`,
      count: staleLeads.length,
      leads: staleLeads.map(l => ({ id: l.id, name: l.name })),
    });
  } catch (error) {
    console.error('Follow-up reminder cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Also support POST for flexibility
export const POST = GET;
// Build trigger: 1764626496
