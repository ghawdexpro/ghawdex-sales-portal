/**
 * GhawdeX Unified Telegram Notifications
 *
 * 3-Tier notification system:
 * - admin: CEO/CTO only - critical business events
 * - everything: Complete audit log - every event
 * - team: Operations team - actionable items
 *
 * Environment Variables Required:
 * - TELEGRAM_BOT_TOKEN: Bot token from @BotFather
 * - TELEGRAM_ADMIN_CHAT_ID: Chat ID for admin notifications
 * - TELEGRAM_EVERYTHING_CHAT_ID: Chat ID for audit log
 * - TELEGRAM_TEAM_CHAT_ID: Chat ID for team notifications
 *
 * @example
 * ```typescript
 * import { notify, notifyNewLead, notifyContractSigned } from '@/lib/telegram';
 *
 * // Send to specific tier(s)
 * await notify('admin', 'Important message');
 * await notify(['everything', 'team'], 'Team notification');
 *
 * // Use convenience functions (auto-routes to correct tiers)
 * await notifyNewLead({ customerName: 'John', source: 'landings' });
 * await notifyContractSigned({ customerName: 'John', contractRef: 'GHX-001', source: 'backoffice' });
 * ```
 */

// =============================================================================
// RE-EXPORTS
// =============================================================================

// Types
export type {
  NotificationTier,
  NotificationEventType,
  NotifyOptions,
  SendMessageOptions,
  InlineKeyboard,
  InlineKeyboardButton,
  TelegramResponse,
  TelegramCallbackQuery,
  // Data types
  BaseNotificationData,
  PageViewData,
  ClickData,
  LeadData,
  BillData,
  QuoteData,
  ContractData,
  PaymentData,
  ErrorData,
  DailySummaryData,
  NotificationData,
} from './types';

export { EVENT_TIER_ROUTING } from './types';

// Client functions
export {
  isTelegramConfigured,
  getConfiguredTiers,
  getChatIdForTier,
  sendMessage,
  editMessage,
  answerCallbackQuery,
  deleteMessage,
  sendPhoto,
  sendDocument,
} from './client';

// Router functions
export {
  notify,
  notifyEvent,
  notifyAdmin,
  notifyEverything,
  notifyTeam,
  notifyAll,
  // Convenience functions
  notifyPageView,
  notifyHotLead,
  notifyNewLead,
  notifyBillReceived,
  notifyContractSigned,
  notifyPayment,
  notifyError,
  notifyUserQuestion,
  sendDailySummary,
} from './router';

// Formatters
export {
  // Text formatting
  bold,
  italic,
  code,
  codeBlock,
  link,
  escapeMarkdown,
  // Number formatting
  formatCurrency,
  formatNumber,
  formatPercent,
  // Date/time formatting
  formatTimestamp,
  formatDate,
  formatTime,
  // Keyboard builders
  createKeyboard,
  buttonRow,
  urlButton,
  callbackButton,
  // Common buttons
  zohoLeadButton,
  backofficeButton,
  callButton,
  whatsappButton,
  emailButton,
  mapsButton,
  // Message builders
  header,
  field,
  bullet,
  section,
  buildMessage,
  footer,
  // Progress
  progressBar,
  stepIndicator,
  // Device detection
  parseDevice,
  deviceEmoji,
} from './formatters';

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

/**
 * Default export with all main functions
 */
const telegram = {
  // Config
  isTelegramConfigured: () => import('./client').then((m) => m.isTelegramConfigured()),

  // Core routing
  notify: async (...args: Parameters<typeof import('./router').notify>) =>
    import('./router').then((m) => m.notify(...args)),

  notifyEvent: async (...args: Parameters<typeof import('./router').notifyEvent>) =>
    import('./router').then((m) => m.notifyEvent(...args)),

  // Tier-specific
  notifyAdmin: async (...args: Parameters<typeof import('./router').notifyAdmin>) =>
    import('./router').then((m) => m.notifyAdmin(...args)),

  notifyTeam: async (...args: Parameters<typeof import('./router').notifyTeam>) =>
    import('./router').then((m) => m.notifyTeam(...args)),

  notifyAll: async (...args: Parameters<typeof import('./router').notifyAll>) =>
    import('./router').then((m) => m.notifyAll(...args)),

  // Convenience
  notifyNewLead: async (...args: Parameters<typeof import('./router').notifyNewLead>) =>
    import('./router').then((m) => m.notifyNewLead(...args)),

  notifyContractSigned: async (...args: Parameters<typeof import('./router').notifyContractSigned>) =>
    import('./router').then((m) => m.notifyContractSigned(...args)),

  notifyPayment: async (...args: Parameters<typeof import('./router').notifyPayment>) =>
    import('./router').then((m) => m.notifyPayment(...args)),

  notifyError: async (...args: Parameters<typeof import('./router').notifyError>) =>
    import('./router').then((m) => m.notifyError(...args)),
};

export default telegram;
