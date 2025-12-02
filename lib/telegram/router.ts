/**
 * GhawdeX Unified Telegram Notifications
 * 3-tier notification routing
 */

import type {
  NotificationTier,
  NotificationEventType,
  NotifyOptions,
  InlineKeyboard,
} from './types';
import { EVENT_TIER_ROUTING } from './types';
import {
  sendMessage,
  getChatIdForTier,
  isTelegramConfigured,
  getConfiguredTiers,
} from './client';

// =============================================================================
// ROUTING FUNCTIONS
// =============================================================================

/**
 * Send a notification to specific tier(s)
 * @param tiers - Target tier(s) to send to
 * @param message - Message text (Markdown format)
 * @param options - Additional options (buttons, etc.)
 */
export async function notify(
  tiers: NotificationTier | NotificationTier[],
  message: string,
  options?: { buttons?: InlineKeyboard }
): Promise<boolean> {
  if (!isTelegramConfigured()) {
    console.warn('[Telegram] Not configured, skipping notification');
    return false;
  }

  const tierArray = Array.isArray(tiers) ? tiers : [tiers];
  const configuredTiers = getConfiguredTiers();

  // Filter to only configured tiers
  const activeTiers = tierArray.filter((t) => configuredTiers.includes(t));

  if (activeTiers.length === 0) {
    console.warn('[Telegram] No configured tiers for notification');
    return false;
  }

  // Send to each tier in parallel
  const results = await Promise.all(
    activeTiers.map((tier) => {
      const chatId = getChatIdForTier(tier);
      if (!chatId) return Promise.resolve(false);

      return sendMessage({
        chatId,
        text: message,
        replyMarkup: options?.buttons,
      });
    })
  );

  // Return true if at least one succeeded
  return results.some((r) => r);
}

/**
 * Send a notification based on event type (auto-routes to correct tiers)
 * @param eventType - The type of event
 * @param message - Message text
 * @param options - Override tiers or add buttons
 */
export async function notifyEvent(
  eventType: NotificationEventType,
  message: string,
  options?: NotifyOptions
): Promise<boolean> {
  // Get default routing for this event type
  const defaultTiers = EVENT_TIER_ROUTING[eventType] || ['everything'];

  // Allow override
  const tiers = options?.tiers || defaultTiers;

  return notify(tiers, message, { buttons: options?.buttons });
}

/**
 * Send to admin tier only
 */
export async function notifyAdmin(
  message: string,
  buttons?: InlineKeyboard
): Promise<boolean> {
  return notify('admin', message, { buttons });
}

/**
 * Send to everything tier only
 */
export async function notifyEverything(
  message: string,
  buttons?: InlineKeyboard
): Promise<boolean> {
  return notify('everything', message, { buttons });
}

/**
 * Send to team tier only
 */
export async function notifyTeam(
  message: string,
  buttons?: InlineKeyboard
): Promise<boolean> {
  return notify('team', message, { buttons });
}

/**
 * Send to all configured tiers
 */
export async function notifyAll(
  message: string,
  buttons?: InlineKeyboard
): Promise<boolean> {
  return notify(['admin', 'everything', 'team'], message, { buttons });
}

// =============================================================================
// CONVENIENCE FUNCTIONS FOR COMMON EVENTS
// =============================================================================

/**
 * Notify page view (everything only - high volume)
 */
export async function notifyPageView(
  page: string,
  source: string,
  sessionId?: string,
  device?: string
): Promise<boolean> {
  const message = [
    `*Page View*`,
    ``,
    `*Page:* ${page}`,
    `*Source:* ${source}`,
    sessionId ? `*Session:* \`${sessionId.slice(0, 8)}\`` : null,
    device ? `*Device:* ${device}` : null,
    ``,
    `_${formatTimestamp()}_`,
  ]
    .filter(Boolean)
    .join('\n');

  return notifyEvent('page_view', message);
}

/**
 * Notify hot lead action (everything + team)
 */
export async function notifyHotLead(
  action: 'phone' | 'whatsapp' | 'email' | 'cta',
  data: {
    source: string;
    page?: string;
    element?: string;
    customerName?: string;
  }
): Promise<boolean> {
  const emoji = {
    phone: '📞',
    whatsapp: '💬',
    email: '📧',
    cta: '🔥',
  }[action];

  const eventType = `${action}_click` as NotificationEventType;

  const message = [
    `${emoji} *HOT LEAD - ${action.toUpperCase()}*`,
    ``,
    `*Source:* ${data.source}`,
    data.page ? `*Page:* ${data.page}` : null,
    data.element ? `*Element:* ${data.element}` : null,
    data.customerName ? `*Customer:* ${data.customerName}` : null,
    ``,
    `_${formatTimestamp()}_`,
  ]
    .filter(Boolean)
    .join('\n');

  return notifyEvent(eventType, message);
}

/**
 * Notify new lead (everything + team)
 */
export async function notifyNewLead(data: {
  customerName: string;
  phone?: string;
  email?: string;
  locality?: string;
  source: string;
  leadId?: string;
  zohoLeadId?: string;
}): Promise<boolean> {
  const message = [
    `🆕 *NEW LEAD*`,
    ``,
    `*Customer:* ${data.customerName}`,
    data.phone ? `*Phone:* ${data.phone}` : null,
    data.email ? `*Email:* ${data.email}` : null,
    data.locality ? `*Locality:* ${data.locality}` : null,
    `*Source:* ${data.source}`,
    ``,
    data.leadId ? `*Lead ID:* \`${data.leadId}\`` : null,
    ``,
    `_${formatTimestamp()}_`,
  ]
    .filter(Boolean)
    .join('\n');

  const buttons: InlineKeyboard | undefined = data.zohoLeadId
    ? {
        inline_keyboard: [
          [
            {
              text: '📋 View in Zoho',
              url: `https://crm.zoho.eu/crm/org20109083961/tab/Leads/${data.zohoLeadId}`,
            },
          ],
        ],
      }
    : undefined;

  return notifyEvent('new_lead', message, { buttons });
}

/**
 * Notify bill received (everything + team)
 */
export async function notifyBillReceived(data: {
  customerName: string;
  locality?: string;
  phone?: string;
  consumption?: number;
  monthlyBill?: number;
  meterNumber?: string;
  source: string;
}): Promise<boolean> {
  const message = [
    `📄 *BILL RECEIVED*`,
    ``,
    `*Customer:* ${data.customerName}`,
    data.locality ? `*Locality:* ${data.locality}` : null,
    data.phone ? `*Phone:* ${data.phone}` : null,
    ``,
    `*Extracted Data:*`,
    data.consumption ? `• Consumption: ${data.consumption} kWh/month` : null,
    data.monthlyBill ? `• Monthly Bill: €${data.monthlyBill}` : null,
    data.meterNumber ? `• Meter: ${data.meterNumber}` : null,
    ``,
    `*Source:* ${data.source}`,
    ``,
    `✅ Ready to prepare quote!`,
    ``,
    `_${formatTimestamp()}_`,
  ]
    .filter(Boolean)
    .join('\n');

  return notifyEvent('bill_received', message);
}

/**
 * Notify contract signed (all tiers)
 */
export async function notifyContractSigned(data: {
  customerName: string;
  contractRef: string;
  systemSize?: string;
  totalPrice?: number;
  depositAmount?: number;
  source: string;
}): Promise<boolean> {
  const message = [
    `✍️ *CONTRACT SIGNED!*`,
    ``,
    `*Customer:* ${data.customerName}`,
    `*Contract:* ${data.contractRef}`,
    ``,
    `*Details:*`,
    data.systemSize ? `• System: ${data.systemSize}` : null,
    data.totalPrice ? `• Total: €${data.totalPrice.toLocaleString('en-MT')}` : null,
    data.depositAmount ? `• Deposit Due: €${data.depositAmount.toLocaleString('en-MT')}` : null,
    ``,
    `🎉 Ready to collect deposit!`,
    ``,
    `*Source:* ${data.source}`,
    `_${formatTimestamp()}_`,
  ]
    .filter(Boolean)
    .join('\n');

  return notifyEvent('contract_signed', message);
}

/**
 * Notify payment received (all tiers)
 */
export async function notifyPayment(data: {
  customerName: string;
  amount: number;
  paymentMethod: string;
  contractRef?: string;
  source: string;
}): Promise<boolean> {
  const message = [
    `💰 *PAYMENT RECEIVED*`,
    ``,
    `*Customer:* ${data.customerName}`,
    `*Amount:* €${data.amount.toLocaleString('en-MT')}`,
    `*Method:* ${data.paymentMethod}`,
    data.contractRef ? `*Contract:* ${data.contractRef}` : null,
    ``,
    `*Source:* ${data.source}`,
    `_${formatTimestamp()}_`,
  ]
    .filter(Boolean)
    .join('\n');

  return notifyEvent('payment_received', message);
}

/**
 * Notify error (everything + admin)
 */
export async function notifyError(data: {
  error: string;
  context: string;
  customerName?: string;
  source: string;
}): Promise<boolean> {
  const message = [
    `❌ *ERROR*`,
    ``,
    data.customerName ? `*Customer:* ${data.customerName}` : null,
    `*Context:* ${data.context}`,
    `*Error:* ${data.error}`,
    ``,
    `*Source:* ${data.source}`,
    `_${formatTimestamp()}_`,
  ]
    .filter(Boolean)
    .join('\n');

  return notifyEvent('error', message);
}

/**
 * Notify user question (everything + team)
 */
export async function notifyUserQuestion(data: {
  question: string;
  customerName?: string;
  channel?: string;
  source: string;
}): Promise<boolean> {
  const message = [
    `❓ *USER QUESTION*`,
    ``,
    data.customerName ? `*From:* ${data.customerName}` : null,
    data.channel ? `*Channel:* ${data.channel}` : null,
    ``,
    `*Question:*`,
    `"${data.question}"`,
    ``,
    `*Source:* ${data.source}`,
    `_${formatTimestamp()}_`,
  ]
    .filter(Boolean)
    .join('\n');

  return notifyEvent('user_question', message);
}

/**
 * Send daily summary (admin only)
 */
export async function sendDailySummary(stats: {
  newLeads: number;
  billsReceived: number;
  quotesSent: number;
  contractsSigned: number;
  paymentsReceived: number;
  totalRevenue?: number;
  remindersSent?: number;
  errors?: number;
}): Promise<boolean> {
  const message = [
    `📊 *DAILY SUMMARY*`,
    ``,
    `*Leads & Bills:*`,
    `• New Leads: ${stats.newLeads}`,
    `• Bills Received: ${stats.billsReceived}`,
    `• Quotes Sent: ${stats.quotesSent}`,
    ``,
    `*Conversions:*`,
    `• Contracts Signed: ${stats.contractsSigned}`,
    `• Payments Received: ${stats.paymentsReceived}`,
    stats.totalRevenue ? `• Total Revenue: €${stats.totalRevenue.toLocaleString('en-MT')}` : null,
    ``,
    stats.remindersSent !== undefined ? `*Operations:*` : null,
    stats.remindersSent !== undefined ? `• Reminders Sent: ${stats.remindersSent}` : null,
    stats.errors !== undefined ? `• Errors: ${stats.errors}` : null,
    ``,
    `_Generated at ${formatTimestamp()}_`,
  ]
    .filter(Boolean)
    .join('\n');

  return notifyEvent('daily_summary', message);
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Format timestamp in Malta timezone
 */
function formatTimestamp(): string {
  return new Date().toLocaleString('en-MT', {
    timeZone: 'Europe/Malta',
    dateStyle: 'short',
    timeStyle: 'short',
  });
}
