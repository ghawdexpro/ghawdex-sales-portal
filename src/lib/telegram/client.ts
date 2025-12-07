/**
 * GhawdeX Unified Telegram Notifications
 * Low-level Telegram API client
 *
 * Supports 3 separate bots for different notification tiers:
 * - Team: Operations team notifications
 * - Everything: Developer audit log (all events)
 * - Admin: CEO/CTO critical alerts
 */

import type {
  SendMessageOptions,
  InlineKeyboard,
  TelegramResponse,
} from './types';

// =============================================================================
// CONFIGURATION
// =============================================================================

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

export type NotificationTier = 'admin' | 'everything' | 'team';

/**
 * Get bot token for a specific tier
 * Each tier has its own dedicated bot for access control
 */
export function getBotTokenForTier(tier: NotificationTier): string | undefined {
  switch (tier) {
    case 'admin':
      return process.env.TELEGRAM_ADMIN_BOT_TOKEN;
    case 'everything':
      return process.env.TELEGRAM_EVERYTHING_BOT_TOKEN;
    case 'team':
      return process.env.TELEGRAM_TEAM_BOT_TOKEN;
    default:
      return undefined;
  }
}

/**
 * Get chat ID for a specific tier
 */
export function getChatIdForTier(tier: NotificationTier): string | undefined {
  switch (tier) {
    case 'admin':
      return process.env.TELEGRAM_ADMIN_CHAT_ID;
    case 'everything':
      return process.env.TELEGRAM_EVERYTHING_CHAT_ID;
    case 'team':
      return process.env.TELEGRAM_TEAM_CHAT_ID;
    default:
      return undefined;
  }
}

/**
 * Check if a specific tier is properly configured
 */
export function isTierConfigured(tier: NotificationTier): boolean {
  const token = getBotTokenForTier(tier);
  const chatId = getChatIdForTier(tier);

  if (!token || token.includes('PLACEHOLDER')) return false;
  if (!chatId || chatId.includes('PLACEHOLDER')) return false;

  return true;
}

/**
 * Check if Telegram is properly configured (at least one tier)
 */
export function isTelegramConfigured(): boolean {
  return isTierConfigured('admin') ||
         isTierConfigured('everything') ||
         isTierConfigured('team');
}

/**
 * Check which tiers are configured
 */
export function getConfiguredTiers(): NotificationTier[] {
  const tiers: NotificationTier[] = [];

  if (isTierConfigured('admin')) tiers.push('admin');
  if (isTierConfigured('everything')) tiers.push('everything');
  if (isTierConfigured('team')) tiers.push('team');

  return tiers;
}

// =============================================================================
// TELEGRAM API METHODS
// =============================================================================

/**
 * Determine tier from chat ID (for backward compatibility)
 */
function getTierFromChatId(chatId: string): NotificationTier | undefined {
  if (chatId === process.env.TELEGRAM_ADMIN_CHAT_ID) return 'admin';
  if (chatId === process.env.TELEGRAM_EVERYTHING_CHAT_ID) return 'everything';
  if (chatId === process.env.TELEGRAM_TEAM_CHAT_ID) return 'team';
  return undefined;
}

/**
 * Send a message to Telegram
 * Uses tier-specific bot token based on chatId or explicit tier parameter
 */
export async function sendMessage(options: SendMessageOptions & { tier?: NotificationTier }): Promise<boolean> {
  const { chatId, text, parseMode = 'Markdown', replyMarkup, disablePreview = true, tier } = options;

  if (!chatId) {
    console.warn('[Telegram] No chat ID provided');
    return false;
  }

  // Determine which tier/bot to use
  const targetTier = tier || getTierFromChatId(chatId);

  if (!targetTier) {
    console.warn('[Telegram] Could not determine tier for chat ID:', chatId);
    return false;
  }

  const token = getBotTokenForTier(targetTier);

  if (!token) {
    console.warn(`[Telegram] Bot token not configured for tier: ${targetTier}`);
    return false;
  }

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: disablePreview,
        ...(replyMarkup && { reply_markup: replyMarkup }),
      }),
    });

    const data: TelegramResponse = await response.json();

    if (!data.ok) {
      console.error(`[Telegram] API error (${targetTier}):`, data.description);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`[Telegram] Send error (${targetTier}):`, error);
    return false;
  }
}

/**
 * Edit an existing message
 */
export async function editMessage(
  chatId: string,
  messageId: number,
  text: string,
  replyMarkup?: InlineKeyboard,
  tier?: NotificationTier
): Promise<boolean> {
  const targetTier = tier || getTierFromChatId(chatId);

  if (!targetTier) {
    console.warn('[Telegram] Could not determine tier for chat ID:', chatId);
    return false;
  }

  const token = getBotTokenForTier(targetTier);

  if (!token) {
    console.warn(`[Telegram] Bot token not configured for tier: ${targetTier}`);
    return false;
  }

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}${token}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        ...(replyMarkup && { reply_markup: replyMarkup }),
      }),
    });

    const data: TelegramResponse = await response.json();

    if (!data.ok) {
      console.error(`[Telegram] Edit error (${targetTier}):`, data.description);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`[Telegram] Edit error (${targetTier}):`, error);
    return false;
  }
}

/**
 * Answer a callback query (button click)
 * Note: Uses admin bot by default since callbacks typically come from admin actions
 */
export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string,
  showAlert = false,
  tier: NotificationTier = 'admin'
): Promise<boolean> {
  const token = getBotTokenForTier(tier);

  if (!token) {
    console.warn(`[Telegram] Bot token not configured for tier: ${tier}`);
    return false;
  }

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        ...(text && { text }),
        show_alert: showAlert,
      }),
    });

    const data: TelegramResponse = await response.json();

    if (!data.ok) {
      console.error(`[Telegram] Callback answer error (${tier}):`, data.description);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`[Telegram] Callback answer error (${tier}):`, error);
    return false;
  }
}

/**
 * Delete a message
 */
export async function deleteMessage(
  chatId: string,
  messageId: number,
  tier?: NotificationTier
): Promise<boolean> {
  const targetTier = tier || getTierFromChatId(chatId);

  if (!targetTier) {
    console.warn('[Telegram] Could not determine tier for chat ID:', chatId);
    return false;
  }

  const token = getBotTokenForTier(targetTier);

  if (!token) {
    console.warn(`[Telegram] Bot token not configured for tier: ${targetTier}`);
    return false;
  }

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}${token}/deleteMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
      }),
    });

    const data: TelegramResponse = await response.json();
    return data.ok;
  } catch (error) {
    console.error(`[Telegram] Delete error (${targetTier}):`, error);
    return false;
  }
}

/**
 * Send a photo with caption
 */
export async function sendPhoto(
  chatId: string,
  photoUrl: string,
  caption?: string,
  replyMarkup?: InlineKeyboard,
  tier?: NotificationTier
): Promise<boolean> {
  const targetTier = tier || getTierFromChatId(chatId);

  if (!targetTier) {
    console.warn('[Telegram] Could not determine tier for chat ID:', chatId);
    return false;
  }

  const token = getBotTokenForTier(targetTier);

  if (!token) {
    console.warn(`[Telegram] Bot token not configured for tier: ${targetTier}`);
    return false;
  }

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}${token}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photoUrl,
        ...(caption && { caption, parse_mode: 'Markdown' }),
        ...(replyMarkup && { reply_markup: replyMarkup }),
      }),
    });

    const data: TelegramResponse = await response.json();

    if (!data.ok) {
      console.error(`[Telegram] Photo send error (${targetTier}):`, data.description);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`[Telegram] Photo send error (${targetTier}):`, error);
    return false;
  }
}

/**
 * Send a document
 */
export async function sendDocument(
  chatId: string,
  documentUrl: string,
  caption?: string,
  filename?: string,
  tier?: NotificationTier
): Promise<boolean> {
  const targetTier = tier || getTierFromChatId(chatId);

  if (!targetTier) {
    console.warn('[Telegram] Could not determine tier for chat ID:', chatId);
    return false;
  }

  const token = getBotTokenForTier(targetTier);

  if (!token) {
    console.warn(`[Telegram] Bot token not configured for tier: ${targetTier}`);
    return false;
  }

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}${token}/sendDocument`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        document: documentUrl,
        ...(caption && { caption, parse_mode: 'Markdown' }),
        ...(filename && { filename }),
      }),
    });

    const data: TelegramResponse = await response.json();

    if (!data.ok) {
      console.error(`[Telegram] Document send error (${targetTier}):`, data.description);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`[Telegram] Document send error (${targetTier}):`, error);
    return false;
  }
}
