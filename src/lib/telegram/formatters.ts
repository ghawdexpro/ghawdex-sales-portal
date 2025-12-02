/**
 * GhawdeX Unified Telegram Notifications
 * Message formatting utilities and templates
 */

import type { InlineKeyboard, InlineKeyboardButton } from './types';

// =============================================================================
// TEXT FORMATTING
// =============================================================================

/**
 * Bold text (Markdown)
 */
export function bold(text: string): string {
  return `*${escapeMarkdown(text)}*`;
}

/**
 * Italic text (Markdown)
 */
export function italic(text: string): string {
  return `_${escapeMarkdown(text)}_`;
}

/**
 * Code/monospace text (Markdown)
 */
export function code(text: string): string {
  return `\`${text}\``;
}

/**
 * Code block (Markdown)
 */
export function codeBlock(text: string, language = ''): string {
  return `\`\`\`${language}\n${text}\n\`\`\``;
}

/**
 * Link (Markdown)
 */
export function link(text: string, url: string): string {
  return `[${escapeMarkdown(text)}](${url})`;
}

/**
 * Escape special Markdown characters
 */
export function escapeMarkdown(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

// =============================================================================
// NUMBER FORMATTING
// =============================================================================

/**
 * Format currency in EUR (Malta locale)
 */
export function formatCurrency(amount: number): string {
  return `€${amount.toLocaleString('en-MT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format number with Malta locale
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-MT');
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

// =============================================================================
// DATE/TIME FORMATTING
// =============================================================================

/**
 * Format timestamp in Malta timezone
 */
export function formatTimestamp(date?: Date): string {
  const d = date || new Date();
  return d.toLocaleString('en-MT', {
    timeZone: 'Europe/Malta',
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

/**
 * Format date only in Malta timezone
 */
export function formatDate(date?: Date): string {
  const d = date || new Date();
  return d.toLocaleDateString('en-MT', {
    timeZone: 'Europe/Malta',
    dateStyle: 'medium',
  });
}

/**
 * Format time only in Malta timezone
 */
export function formatTime(date?: Date): string {
  const d = date || new Date();
  return d.toLocaleTimeString('en-MT', {
    timeZone: 'Europe/Malta',
    timeStyle: 'short',
  });
}

// =============================================================================
// KEYBOARD BUILDERS
// =============================================================================

/**
 * Create an inline keyboard from button definitions
 */
export function createKeyboard(buttons: InlineKeyboardButton[][]): InlineKeyboard {
  return { inline_keyboard: buttons };
}

/**
 * Create a single row of buttons
 */
export function buttonRow(...buttons: InlineKeyboardButton[]): InlineKeyboardButton[] {
  return buttons;
}

/**
 * Create a URL button
 */
export function urlButton(text: string, url: string): InlineKeyboardButton {
  return { text, url };
}

/**
 * Create a callback button
 */
export function callbackButton(text: string, callbackData: string): InlineKeyboardButton {
  return { text, callback_data: callbackData };
}

// =============================================================================
// COMMON BUTTON SETS
// =============================================================================

/**
 * View in Zoho CRM button
 */
export function zohoLeadButton(zohoLeadId: string): InlineKeyboardButton {
  return urlButton(
    '📋 View in Zoho',
    `https://crm.zoho.eu/crm/org20109083961/tab/Leads/${zohoLeadId}`
  );
}

/**
 * View in Backoffice button
 */
export function backofficeButton(path: string, text = '📊 View in Backoffice'): InlineKeyboardButton {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bo.ghawdex.pro';
  return urlButton(text, `${baseUrl}${path}`);
}

/**
 * Call button
 */
export function callButton(phone: string): InlineKeyboardButton {
  return urlButton('📞 Call', `tel:${phone.replace(/\s/g, '')}`);
}

/**
 * WhatsApp button
 */
export function whatsappButton(phone: string): InlineKeyboardButton {
  const cleanPhone = phone.replace(/\s/g, '').replace('+', '');
  return urlButton('💬 WhatsApp', `https://wa.me/${cleanPhone}`);
}

/**
 * Email button
 */
export function emailButton(email: string, subject?: string): InlineKeyboardButton {
  const url = subject
    ? `mailto:${email}?subject=${encodeURIComponent(subject)}`
    : `mailto:${email}`;
  return urlButton('📧 Email', url);
}

/**
 * Google Maps button
 */
export function mapsButton(address: string): InlineKeyboardButton {
  return urlButton('📍 Maps', `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`);
}

// =============================================================================
// MESSAGE TEMPLATES
// =============================================================================

/**
 * Build a header with emoji
 */
export function header(emoji: string, title: string): string {
  return `${emoji} ${bold(title)}`;
}

/**
 * Build a labeled field
 */
export function field(label: string, value: string | number | undefined | null): string | null {
  if (value === undefined || value === null || value === '') return null;
  return `${bold(label + ':')} ${value}`;
}

/**
 * Build a bullet point
 */
export function bullet(text: string): string {
  return `• ${text}`;
}

/**
 * Build a section with title
 */
export function section(title: string, items: (string | null)[]): string {
  const filtered = items.filter(Boolean) as string[];
  if (filtered.length === 0) return '';
  return `${bold(title)}\n${filtered.join('\n')}`;
}

/**
 * Build message from lines (filters null/undefined)
 */
export function buildMessage(lines: (string | null | undefined)[]): string {
  return lines.filter(Boolean).join('\n');
}

/**
 * Add footer with timestamp
 */
export function footer(source?: string): string {
  const parts = [];
  if (source) parts.push(`Source: ${source}`);
  parts.push(italic(formatTimestamp()));
  return parts.join('\n');
}

// =============================================================================
// PROGRESS INDICATORS
// =============================================================================

/**
 * Create a progress bar
 */
export function progressBar(current: number, total: number, width = 10): string {
  const filled = Math.round((current / total) * width);
  const empty = width - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${current}/${total}`;
}

/**
 * Create a step indicator
 */
export function stepIndicator(currentStep: number, totalSteps: number): string {
  return Array.from({ length: totalSteps }, (_, i) =>
    i < currentStep ? '●' : '○'
  ).join(' ');
}

// =============================================================================
// DEVICE DETECTION
// =============================================================================

/**
 * Parse device type from user agent
 */
export function parseDevice(userAgent?: string): string {
  if (!userAgent) return 'Unknown';

  const ua = userAgent.toLowerCase();

  if (ua.includes('iphone')) return 'iPhone';
  if (ua.includes('ipad')) return 'iPad';
  if (ua.includes('android') && ua.includes('mobile')) return 'Android Phone';
  if (ua.includes('android')) return 'Android Tablet';
  if (ua.includes('macintosh') || ua.includes('mac os')) return 'Mac';
  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('linux')) return 'Linux';

  return 'Unknown';
}

/**
 * Get device emoji
 */
export function deviceEmoji(device: string): string {
  const lower = device.toLowerCase();

  if (lower.includes('iphone') || lower.includes('android phone')) return '📱';
  if (lower.includes('ipad') || lower.includes('tablet')) return '📱';
  if (lower.includes('mac') || lower.includes('windows') || lower.includes('linux')) return '💻';

  return '🖥️';
}
