import { NextRequest, NextResponse } from 'next/server';

// Rate limiting: track recent events to avoid spam
const recentEvents = new Map<string, number>();
const RATE_LIMIT_MS = 5000; // 5 seconds between same event type from same session

type EventType =
  | 'visitor'
  | 'wizard_step'
  | 'wizard_complete'
  | 'phone_click'
  | 'whatsapp_click'
  | 'email_click'
  | 'time_milestone'
  | 'cta_click';

interface TelegramEventPayload {
  event: EventType;
  sessionId: string;
  data?: {
    step?: number;
    stepName?: string;
    seconds?: number;
    buttonText?: string;
    location?: string;
    userAgent?: string;
    referrer?: string;
    url?: string;
    prefilled?: boolean;
    name?: string;
  };
}

// Emoji map for events
const eventEmoji: Record<EventType, string> = {
  visitor: '👁️',
  wizard_step: '📍',
  wizard_complete: '🎉',
  phone_click: '📞',
  whatsapp_click: '💬',
  email_click: '📧',
  time_milestone: '⏱️',
  cta_click: '👆',
};

// Event titles
const eventTitle: Record<EventType, string> = {
  visitor: 'New Visitor',
  wizard_step: 'Wizard Progress',
  wizard_complete: 'Wizard Completed!',
  phone_click: 'Phone Click',
  whatsapp_click: 'WhatsApp Click',
  email_click: 'Email Click',
  time_milestone: 'Engaged Visitor',
  cta_click: 'CTA Click',
};

function formatMessage(payload: TelegramEventPayload, ip: string): string {
  const { event, sessionId, data } = payload;
  const emoji = eventEmoji[event] || '📌';
  const title = eventTitle[event] || event;

  let message = `${emoji} *${title}*\n\n`;
  message += `🔑 Session: \`${sessionId.slice(0, 8)}...\`\n`;

  // Add event-specific details
  switch (event) {
    case 'visitor':
      message += `🌐 URL: ${data?.url || 'N/A'}\n`;
      if (data?.referrer) message += `↩️ Referrer: ${data.referrer}\n`;
      if (data?.prefilled) message += `✨ *Pre-filled from CRM*\n`;
      if (data?.name) message += `👤 Name: ${data.name}\n`;
      message += `📱 Device: ${parseUserAgent(data?.userAgent)}\n`;
      break;

    case 'wizard_step':
      message += `📊 Step ${data?.step}: ${data?.stepName}\n`;
      message += getStepProgress(data?.step || 1);
      break;

    case 'wizard_complete':
      message += `✅ Customer completed the quote wizard!\n`;
      message += `⏳ Lead notification coming separately...\n`;
      break;

    case 'phone_click':
      message += `📱 Customer clicked to call!\n`;
      message += `🔥 *HOT LEAD - May be calling now*\n`;
      break;

    case 'whatsapp_click':
      message += `💬 Customer opened WhatsApp!\n`;
      message += `🔥 *HOT LEAD - Check WhatsApp*\n`;
      break;

    case 'email_click':
      message += `📧 Customer clicked email link\n`;
      break;

    case 'time_milestone':
      const mins = Math.floor((data?.seconds || 0) / 60);
      const secs = (data?.seconds || 0) % 60;
      message += `⏱️ Time on site: ${mins > 0 ? `${mins}m ` : ''}${secs}s\n`;
      if ((data?.seconds || 0) >= 300) {
        message += `🔥 *Highly engaged visitor!*\n`;
      }
      break;

    case 'cta_click':
      message += `🔘 Button: "${data?.buttonText}"\n`;
      message += `📍 Location: ${data?.location}\n`;
      break;
  }

  message += `\n🕐 ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/Malta' })}`;

  return message;
}

function parseUserAgent(ua?: string): string {
  if (!ua) return 'Unknown';

  if (ua.includes('iPhone')) return 'iPhone';
  if (ua.includes('iPad')) return 'iPad';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('Mac')) return 'Mac';
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Linux')) return 'Linux';

  return 'Other';
}

function getStepProgress(step: number): string {
  const steps = ['Location', 'Consumption', 'System', 'Financing', 'Contact', 'Summary'];
  const progress = steps.map((s, i) => {
    if (i + 1 < step) return '✅';
    if (i + 1 === step) return '👉';
    return '⬜';
  }).join('');
  return `${progress}\n`;
}

async function sendTelegramMessage(message: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!botToken || !chatId) {
    console.log('Telegram not configured');
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Telegram send error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload: TelegramEventPayload = await request.json();
    const { event, sessionId } = payload;

    // Validate
    if (!event || !sessionId) {
      return NextResponse.json({ error: 'Missing event or sessionId' }, { status: 400 });
    }

    // Rate limiting - prevent spam from same session
    const rateLimitKey = `${sessionId}-${event}`;
    const lastSent = recentEvents.get(rateLimitKey);

    if (lastSent && Date.now() - lastSent < RATE_LIMIT_MS) {
      return NextResponse.json({ success: true, skipped: true });
    }

    // Get client IP for logging
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown';

    // Format and send message
    const message = formatMessage(payload, ip);
    const sent = await sendTelegramMessage(message);

    if (sent) {
      recentEvents.set(rateLimitKey, Date.now());

      // Clean up old entries every 100 requests
      if (recentEvents.size > 1000) {
        const cutoff = Date.now() - 60000; // 1 minute
        for (const [key, time] of recentEvents.entries()) {
          if (time < cutoff) recentEvents.delete(key);
        }
      }
    }

    return NextResponse.json({ success: sent });
  } catch (error) {
    console.error('Telegram event error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
