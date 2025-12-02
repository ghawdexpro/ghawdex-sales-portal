/**
 * GhawdeX Unified Telegram Notifications
 * Type definitions for 3-tier notification system
 */

// =============================================================================
// NOTIFICATION TIERS
// =============================================================================

/**
 * Notification tiers determine which Telegram chat(s) receive a message
 * - admin: CEO/CTO only - critical business events
 * - everything: Complete audit log - every event
 * - team: Operations team - actionable items
 */
export type NotificationTier = 'admin' | 'everything' | 'team';

// =============================================================================
// EVENT TYPES
// =============================================================================

/**
 * All possible notification event types across GhawdeX projects
 */
export type NotificationEventType =
  // Tracking events (everything only)
  | 'page_view'
  | 'click'
  | 'scroll'
  | 'form_start'
  | 'video_play'
  | 'time_milestone'

  // Lead events (everything + team)
  | 'phone_click'
  | 'whatsapp_click'
  | 'email_click'
  | 'cta_click'
  | 'new_lead'
  | 'lead_from_portal'
  | 'wizard_step'
  | 'wizard_complete'

  // Bill & Quote events (everything + team)
  | 'bill_received'
  | 'bill_analyzed'
  | 'quote_sent'
  | 'auto_quote_generated'

  // Contract events (all tiers)
  | 'contract_created'
  | 'contract_approval_requested'
  | 'contract_approved'
  | 'contract_rejected'
  | 'contract_signed'
  | 'contract_sent'

  // Payment events (all tiers)
  | 'payment_received'
  | 'deposit_paid'

  // Operations events (everything + team)
  | 'reminder_sent'
  | 'follow_up_needed'
  | 'document_generated'
  | 'document_task_created'
  | 'user_question'
  | 'name_mismatch'

  // System events
  | 'error'           // everything + admin
  | 'health_check'    // everything + admin
  | 'daily_summary';  // admin only

// =============================================================================
// EVENT TO TIER MAPPING
// =============================================================================

/**
 * Default routing for each event type
 * Can be overridden when sending
 */
export const EVENT_TIER_ROUTING: Record<NotificationEventType, NotificationTier[]> = {
  // Tracking - everything only (high volume)
  page_view: ['everything'],
  click: ['everything'],
  scroll: ['everything'],
  form_start: ['everything'],
  video_play: ['everything'],
  time_milestone: ['everything'],

  // Lead events - everything + team (actionable)
  phone_click: ['everything', 'team'],
  whatsapp_click: ['everything', 'team'],
  email_click: ['everything', 'team'],
  cta_click: ['everything', 'team'],
  new_lead: ['everything', 'team'],
  lead_from_portal: ['everything', 'team'],
  wizard_step: ['everything'],
  wizard_complete: ['everything', 'team'],

  // Bill & Quote - everything + team
  bill_received: ['everything', 'team'],
  bill_analyzed: ['everything', 'team'],
  quote_sent: ['everything', 'team'],
  auto_quote_generated: ['everything', 'team'],

  // Contract - all tiers (critical)
  contract_created: ['everything', 'team', 'admin'],
  contract_approval_requested: ['everything', 'team', 'admin'],
  contract_approved: ['everything', 'team', 'admin'],
  contract_rejected: ['everything', 'team', 'admin'],
  contract_signed: ['everything', 'team', 'admin'],
  contract_sent: ['everything', 'team'],

  // Payment - all tiers (critical)
  payment_received: ['everything', 'team', 'admin'],
  deposit_paid: ['everything', 'team', 'admin'],

  // Operations - everything + team
  reminder_sent: ['everything'],
  follow_up_needed: ['everything', 'team'],
  document_generated: ['everything'],
  document_task_created: ['everything', 'team'],
  user_question: ['everything', 'team'],
  name_mismatch: ['everything', 'team'],

  // System - varies
  error: ['everything', 'admin'],
  health_check: ['everything'],
  daily_summary: ['admin'],
};

// =============================================================================
// MESSAGE OPTIONS
// =============================================================================

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface InlineKeyboard {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface SendMessageOptions {
  /** Override default chat ID */
  chatId?: string;
  /** Message text (Markdown format) */
  text: string;
  /** Parse mode - defaults to Markdown */
  parseMode?: 'Markdown' | 'HTML';
  /** Inline keyboard buttons */
  replyMarkup?: InlineKeyboard;
  /** Disable link preview */
  disablePreview?: boolean;
}

export interface NotifyOptions {
  /** Override default tier routing */
  tiers?: NotificationTier[];
  /** Inline keyboard buttons */
  buttons?: InlineKeyboard;
  /** Additional context for logging */
  context?: Record<string, unknown>;
}

// =============================================================================
// NOTIFICATION DATA TYPES
// =============================================================================

export interface BaseNotificationData {
  /** Source project */
  source: 'landings' | 'portal' | 'sales-portal' | 'b2b' | 'backoffice';
  /** Timestamp */
  timestamp?: Date;
}

export interface PageViewData extends BaseNotificationData {
  page: string;
  referrer?: string;
  sessionId?: string;
  device?: string;
}

export interface ClickData extends BaseNotificationData {
  element: string;
  page: string;
  value?: string;
}

export interface LeadData extends BaseNotificationData {
  customerName: string;
  phone?: string;
  email?: string;
  locality?: string;
  leadId?: string;
  zohoLeadId?: string;
}

export interface BillData extends BaseNotificationData {
  customerName: string;
  locality?: string;
  phone?: string;
  consumption?: number;
  monthlyBill?: number;
  meterNumber?: string;
  leadId?: string;
}

export interface QuoteData extends BaseNotificationData {
  customerName: string;
  systemSize?: string;
  totalPrice?: number;
  grantAmount?: number;
  netCost?: number;
  quoteId?: string;
}

export interface ContractData extends BaseNotificationData {
  customerName: string;
  email?: string;
  phone?: string;
  contractRef: string;
  systemSize?: string;
  totalPrice?: number;
  grantAmount?: number;
  netCost?: number;
  depositAmount?: number;
  contractId?: string;
}

export interface PaymentData extends BaseNotificationData {
  customerName: string;
  amount: number;
  paymentMethod: string;
  contractRef?: string;
}

export interface ErrorData extends BaseNotificationData {
  error: string;
  context: string;
  customerName?: string;
  stack?: string;
}

export interface DailySummaryData {
  newLeads: number;
  billsReceived: number;
  quotesSent: number;
  contractsSigned: number;
  paymentsReceived: number;
  totalRevenue?: number;
  remindersSent?: number;
  errors?: number;
}

// Union type for all notification data
export type NotificationData =
  | PageViewData
  | ClickData
  | LeadData
  | BillData
  | QuoteData
  | ContractData
  | PaymentData
  | ErrorData;

// =============================================================================
// TELEGRAM API RESPONSE TYPES
// =============================================================================

export interface TelegramResponse {
  ok: boolean;
  result?: {
    message_id: number;
    chat: { id: number };
    date: number;
    text?: string;
  };
  error_code?: number;
  description?: string;
}

export interface TelegramCallbackQuery {
  id: string;
  from: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  message?: {
    message_id: number;
    chat: { id: number };
  };
  data?: string;
}
