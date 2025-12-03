import { NextRequest, NextResponse } from 'next/server';
import {
  notifyEvent,
  notifyPageView,
  notifyHotLead,
  parseDevice,
  formatTimestamp,
  stepIndicator,
  type NotificationEventType,
} from '@/lib/telegram';

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

// Map old event types to new module event types
const eventTypeMap: Record<EventType, NotificationEventType> = {
  visitor: 'page_view',
  wizard_step: 'wizard_step',
  wizard_complete: 'wizard_complete',
  phone_click: 'phone_click',
  whatsapp_click: 'whatsapp_click',
  email_click: 'email_click',
  time_milestone: 'time_milestone',
  cta_click: 'cta_click',
};

/**
 * Send notification using 3-tier routing
 * Routes to appropriate tiers based on event type
 */
async function sendNotification(payload: TelegramEventPayload): Promise<boolean> {
  const { event, sessionId, data } = payload;
  const newEventType = eventTypeMap[event];

  // Use specialized functions for certain event types
  switch (event) {
    case 'visitor':
      // Page view - goes to 'everything' tier only
      return await notifyPageView(
        data?.url || 'Unknown',
        'sales-portal',
        sessionId,
        parseDevice(data?.userAgent)
      );

    case 'phone_click':
    case 'whatsapp_click':
      // Hot lead actions - goes to 'everything' + 'team' tiers
      return await notifyHotLead(
        event === 'phone_click' ? 'phone' : 'whatsapp',
        {
          source: 'sales-portal',
          page: 'wizard',
          customerName: data?.name,
        }
      );

    case 'email_click':
      // Email click - goes to 'everything' + 'team'
      return await notifyHotLead('email', {
        source: 'sales-portal',
        page: 'wizard',
        customerName: data?.name,
      });

    case 'cta_click':
      // CTA click - goes to 'everything' + 'team'
      return await notifyHotLead('cta', {
        source: 'sales-portal',
        page: data?.location || 'wizard',
        element: data?.buttonText,
        customerName: data?.name,
      });

    case 'wizard_step':
      // Wizard step - goes to 'everything' only
      const stepMessage = `📍 *Wizard Progress*

🔑 Session: \`${sessionId.slice(0, 8)}...\`
📊 Step ${data?.step}: ${data?.stepName}
${stepIndicator(data?.step || 1, 6)}

${data?.prefilled ? '✨ *Pre-filled from CRM*\n' : ''}_${formatTimestamp()}_`;

      return await notifyEvent('wizard_step', stepMessage);

    case 'wizard_complete':
      // Wizard complete - goes to 'everything' + 'team'
      const completeMessage = `🎉 *Wizard Completed!*

🔑 Session: \`${sessionId.slice(0, 8)}...\`
✅ Customer completed the quote wizard!
⏳ Lead notification coming separately...

_${formatTimestamp()}_`;

      return await notifyEvent('wizard_complete', completeMessage);

    case 'time_milestone':
      // Time milestone - goes to 'everything' only
      const mins = Math.floor((data?.seconds || 0) / 60);
      const secs = (data?.seconds || 0) % 60;
      const timeMessage = `⏱️ *Engaged Visitor*

🔑 Session: \`${sessionId.slice(0, 8)}...\`
⏱️ Time on site: ${mins > 0 ? `${mins}m ` : ''}${secs}s
${(data?.seconds || 0) >= 300 ? '🔥 *Highly engaged visitor!*\n' : ''}
_${formatTimestamp()}_`;

      return await notifyEvent('time_milestone', timeMessage);

    default:
      // Fallback - use generic event notification
      const genericMessage = `📌 *${event}*

🔑 Session: \`${sessionId.slice(0, 8)}...\`

_${formatTimestamp()}_`;

      return await notifyEvent(newEventType, genericMessage);
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

    // Send notification using 3-tier routing
    const sent = await sendNotification(payload);

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
