/**
 * GhawdeX SMS Client (Twilio)
 *
 * Low-level SMS sending functions using Twilio API.
 */

import type { SmsResult, SendSmsOptions } from './types';

// =============================================================================
// CONFIGURATION
// =============================================================================

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// =============================================================================
// STATUS CHECKS
// =============================================================================

/**
 * Check if SMS service is configured
 */
export function isSmsConfigured(): boolean {
  return !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER);
}

/**
 * Get SMS configuration status
 */
export function getSmsConfig(): { configured: boolean; fromNumber: string | undefined } {
  return {
    configured: isSmsConfigured(),
    fromNumber: TWILIO_PHONE_NUMBER,
  };
}

// =============================================================================
// PHONE NUMBER FORMATTING
// =============================================================================

/**
 * Format phone number for Malta (E.164 format)
 * Handles: 79123456, +35679123456, 356-79-123-456, etc.
 */
export function formatMaltaPhone(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // If starts with 356, it's already Malta code
  if (cleaned.startsWith('356')) {
    return `+${cleaned}`;
  }

  // If 8 digits (Malta local number), add +356
  if (cleaned.length === 8) {
    return `+356${cleaned}`;
  }

  // If starts with 00356, convert to +356
  if (cleaned.startsWith('00356')) {
    return `+${cleaned.slice(2)}`;
  }

  // Return with + prefix if not already formatted
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

/**
 * Validate Malta phone number
 */
export function isValidMaltaPhone(phone: string): boolean {
  const formatted = formatMaltaPhone(phone);
  // Malta numbers are +356 followed by 8 digits
  // Mobile: 77, 79, 99 prefix
  // Landline: 21, 22, 23, 27 prefix
  return /^\+356[279][0-9]{7}$/.test(formatted);
}

// =============================================================================
// SEND FUNCTIONS
// =============================================================================

/**
 * Send SMS via Twilio
 */
export async function sendSms(options: SendSmsOptions): Promise<SmsResult> {
  if (!isSmsConfigured()) {
    console.warn('[SMS] Service not configured, skipping send');
    return { success: false, error: 'SMS service not configured' };
  }

  const to = formatMaltaPhone(options.to);

  if (!isValidMaltaPhone(to)) {
    console.warn('[SMS] Invalid Malta phone number:', options.to);
    return { success: false, error: 'Invalid phone number format' };
  }

  try {
    // Twilio API uses Basic Auth
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: TWILIO_PHONE_NUMBER!,
          Body: options.message,
        }),
      }
    );

    const result = await response.json();

    if (response.ok && result.sid) {
      console.log('[SMS] Sent successfully:', result.sid);
      return { success: true, messageId: result.sid };
    }

    console.error('[SMS] Twilio error:', result);
    return { success: false, error: result.message || 'Twilio error' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[SMS] Send error:', message);
    return { success: false, error: message };
  }
}

/**
 * Send SMS with retry logic
 */
export async function sendSmsWithRetry(
  options: SendSmsOptions,
  maxRetries = 3,
  delayMs = 1000
): Promise<SmsResult> {
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await sendSms(options);

    if (result.success) {
      return result;
    }

    lastError = result.error;
    console.warn(`[SMS] Attempt ${attempt}/${maxRetries} failed: ${result.error}`);

    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }

  return { success: false, error: `Failed after ${maxRetries} attempts: ${lastError}` };
}
