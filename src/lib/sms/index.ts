/**
 * GhawdeX SMS Service
 *
 * Unified SMS module using Twilio.
 *
 * Features:
 * - Malta phone number formatting (+356)
 * - Pre-built templates for sales funnel
 * - Character count optimization
 * - Retry logic built-in
 *
 * Environment Variables:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_PHONE_NUMBER (Malta sender number)
 *
 * @example
 * ```typescript
 * import { sendLeadConfirmationSms, sendFollowUpSms } from '@/lib/sms';
 *
 * // Send lead confirmation
 * await sendLeadConfirmationSms('+35679123456', {
 *   name: 'John',
 *   quoteRef: 'GHX-ABC123',
 *   systemSize: 10,
 * });
 *
 * // Send follow-up
 * await sendFollowUpSms('+35679123456', 'follow-up-24h', {
 *   name: 'John',
 *   quoteRef: 'GHX-ABC123',
 * });
 * ```
 */

// =============================================================================
// RE-EXPORTS
// =============================================================================

// Types
export type {
  SmsTemplate,
  SmsStatus,
  SendSmsOptions,
  SendTemplateSmsOptions,
  SmsResult,
  LeadConfirmationSmsData,
  FollowUpSmsData,
  ContractReminderSmsData,
  AppointmentReminderSmsData,
  SessionRecoverySmsData,
} from './types';

// Client functions
export {
  isSmsConfigured,
  getSmsConfig,
  sendSms,
  sendSmsWithRetry,
  formatMaltaPhone,
  isValidMaltaPhone,
} from './client';

// Templates
export {
  generateSmsFromTemplate,
  isSingleSegment,
  calculateSegments,
} from './templates';

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

import { sendSms, isSmsConfigured } from './client';
import { generateSmsFromTemplate } from './templates';
import type {
  SmsResult,
  SmsTemplate,
  LeadConfirmationSmsData,
  FollowUpSmsData,
  ContractReminderSmsData,
  AppointmentReminderSmsData,
  SessionRecoverySmsData,
} from './types';

/**
 * Send lead confirmation SMS
 */
export async function sendLeadConfirmationSms(
  phone: string,
  data: LeadConfirmationSmsData
): Promise<SmsResult> {
  if (!isSmsConfigured()) {
    console.warn('[SMS] Service not configured');
    return { success: false, error: 'SMS not configured' };
  }

  const message = generateSmsFromTemplate('lead-confirmation', data);
  return sendSms({ to: phone, message });
}

/**
 * Send follow-up SMS (24h, 72h, or 7d)
 */
export async function sendFollowUpSms(
  phone: string,
  template: 'follow-up-24h' | 'follow-up-72h' | 'follow-up-7d',
  data: FollowUpSmsData
): Promise<SmsResult> {
  const message = generateSmsFromTemplate(template, data);
  return sendSms({ to: phone, message });
}

/**
 * Send contract reminder SMS
 */
export async function sendContractReminderSms(
  phone: string,
  data: ContractReminderSmsData
): Promise<SmsResult> {
  const message = generateSmsFromTemplate('contract-reminder', data);
  return sendSms({ to: phone, message });
}

/**
 * Send appointment reminder SMS
 */
export async function sendAppointmentReminderSms(
  phone: string,
  data: AppointmentReminderSmsData
): Promise<SmsResult> {
  const message = generateSmsFromTemplate('appointment-reminder', data);
  return sendSms({ to: phone, message });
}

/**
 * Send session recovery SMS
 */
export async function sendSessionRecoverySms(
  phone: string,
  data: SessionRecoverySmsData
): Promise<SmsResult> {
  const message = generateSmsFromTemplate('session-recovery', data);
  return sendSms({ to: phone, message });
}

/**
 * Send any template SMS
 */
export async function sendTemplateSms<T>(
  phone: string,
  template: SmsTemplate,
  data: T
): Promise<SmsResult> {
  const message = generateSmsFromTemplate(template, data);
  return sendSms({ to: phone, message });
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

const sms = {
  isConfigured: isSmsConfigured,
  send: sendSms,
  sendLeadConfirmation: sendLeadConfirmationSms,
  sendFollowUp: sendFollowUpSms,
  sendContractReminder: sendContractReminderSms,
  sendAppointmentReminder: sendAppointmentReminderSms,
  sendSessionRecovery: sendSessionRecoverySms,
  sendTemplate: sendTemplateSms,
};

export default sms;
