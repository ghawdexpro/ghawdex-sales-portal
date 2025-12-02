/**
 * GhawdeX Unified Telegram Notifications
 * Low-level Telegram API client
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

/**
 * Get bot token from environment
 */
function getBotToken(): string | undefined {
  return process.env.TELEGRAM_BOT_TOKEN;
}

/**
 * Get chat ID for a specific tier
 */
export function getChatIdForTier(tier: 'admin' | 'everything' | 'team'): string | undefined {
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
 * Check if Telegram is properly configured
 */
export function isTelegramConfigured(): boolean {
  const token = getBotToken();
  if (!token || token.includes('PLACEHOLDER')) {
    return false;
  }

  // At least one chat ID must be configured
  const adminChat = getChatIdForTier('admin');
  const everythingChat = getChatIdForTier('everything');
  const teamChat = getChatIdForTier('team');

  return !!(adminChat || everythingChat || teamChat);
}

/**
 * Check which tiers are configured
 */
export function getConfiguredTiers(): ('admin' | 'everything' | 'team')[] {
  const tiers: ('admin' | 'everything' | 'team')[] = [];

  if (getChatIdForTier('admin')) tiers.push('admin');
  if (getChatIdForTier('everything')) tiers.push('everything');
  if (getChatIdForTier('team')) tiers.push('team');

  return tiers;
}

// =============================================================================
// TELEGRAM API METHODS
// =============================================================================

/**
 * Send a message to Telegram
 */
export async function sendMessage(options: SendMessageOptions): Promise<boolean> {
  const token = getBotToken();

  if (!token) {
    console.warn('[Telegram] Bot token not configured');
    return false;
  }

  const { chatId, text, parseMode = 'Markdown', replyMarkup, disablePreview = true } = options;

  if (!chatId) {
    console.warn('[Telegram] No chat ID provided');
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
      console.error('[Telegram] API error:', data.description);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Telegram] Send error:', error);
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
  replyMarkup?: InlineKeyboard
): Promise<boolean> {
  const token = getBotToken();

  if (!token) {
    console.warn('[Telegram] Bot token not configured');
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
      console.error('[Telegram] Edit error:', data.description);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Telegram] Edit error:', error);
    return false;
  }
}

/**
 * Answer a callback query (button click)
 */
export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string,
  showAlert = false
): Promise<boolean> {
  const token = getBotToken();

  if (!token) {
    console.warn('[Telegram] Bot token not configured');
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
      console.error('[Telegram] Callback answer error:', data.description);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Telegram] Callback answer error:', error);
    return false;
  }
}

/**
 * Delete a message
 */
export async function deleteMessage(chatId: string, messageId: number): Promise<boolean> {
  const token = getBotToken();

  if (!token) {
    console.warn('[Telegram] Bot token not configured');
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
    console.error('[Telegram] Delete error:', error);
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
  replyMarkup?: InlineKeyboard
): Promise<boolean> {
  const token = getBotToken();

  if (!token) {
    console.warn('[Telegram] Bot token not configured');
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
      console.error('[Telegram] Photo send error:', data.description);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Telegram] Photo send error:', error);
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
  filename?: string
): Promise<boolean> {
  const token = getBotToken();

  if (!token) {
    console.warn('[Telegram] Bot token not configured');
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
      console.error('[Telegram] Document send error:', data.description);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Telegram] Document send error:', error);
    return false;
  }
}
