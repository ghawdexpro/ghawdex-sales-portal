/**
 * GhawdeX Email Service
 *
 * Unified email module using Zoho CRM Mail ONLY.
 *
 * Features:
 * - Sends via Zoho CRM (logs in lead history)
 * - Beautiful HTML dark-theme templates
 * - Retry logic built-in
 * - HMAC-secured unsubscribe links
 *
 * Environment Variables:
 * - ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN (required)
 * - ZOHO_SENDER_EMAIL (default: info@ghawdex.pro)
 *
 * @example
 * ```typescript
 * import { sendLeadConfirmationEmail, sendFollowUpEmail } from '@/lib/email';
 *
 * // Send lead confirmation (logged in Zoho CRM)
 * await sendLeadConfirmationEmail(zohoLeadId, {
 *   name: 'John',
 *   systemSize: 10,
 *   totalPrice: 2500,
 *   annualSavings: 1890,
 *   // ... more data
 * });
 *
 * // Send follow-up
 * await sendFollowUpEmail(zohoLeadId, 'follow-up-24h', followUpData);
 * ```
 */

// =============================================================================
// RE-EXPORTS
// =============================================================================

// Types
export type {
  EmailTemplate,
  EmailStatus,
  EmailRecipient,
  EmailAttachment,
  SendEmailOptions,
  SendTemplateEmailOptions,
  EmailResult,
  LeadConfirmationData,
  QuotePdfData,
  ContractReminderData,
  FollowUpData,
  SessionRecoveryData,
  CommunicationRecord,
} from './types';

// Client functions
export {
  isEmailConfigured,
  getEmailConfig,
  sendEmail,
  sendEmailWithRetry,
  sendEmailViaZohoCRM,
  sendStandaloneEmail,
  isValidEmail,
} from './client';

// Templates
export {
  generateEmailFromTemplate,
  generateLeadConfirmationEmail,
} from './templates';

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

import { sendEmailViaZohoCRM, sendStandaloneEmail, isEmailConfigured } from './client';
import { generateEmailFromTemplate } from './templates';
import type {
  EmailResult,
  LeadConfirmationData,
  FollowUpData,
  ContractReminderData,
  SessionRecoveryData,
  EmailTemplate,
} from './types';

/**
 * Send lead confirmation email
 */
export async function sendLeadConfirmationEmail(
  zohoLeadId: string | null,
  data: LeadConfirmationData,
  recipientEmail?: string
): Promise<EmailResult> {
  if (!isEmailConfigured()) {
    console.warn('[Email] Service not configured');
    return { success: false, error: 'Email not configured' };
  }

  const { subject, html } = generateEmailFromTemplate('lead-confirmation', data);

  if (zohoLeadId) {
    return sendEmailViaZohoCRM({
      leadId: zohoLeadId,
      subject,
      html,
    });
  }

  // Require Zoho Lead ID for all emails
  return { success: false, error: 'Zoho Lead ID required to send emails' };
}

/**
 * Send follow-up email (24h, 72h, or 7d)
 */
export async function sendFollowUpEmail(
  zohoLeadId: string,
  template: 'follow-up-24h' | 'follow-up-48h' | 'follow-up-72h' | 'follow-up-7d',
  data: FollowUpData
): Promise<EmailResult> {
  const { subject, html } = generateEmailFromTemplate(template, data);

  return sendEmailViaZohoCRM({
    leadId: zohoLeadId,
    subject,
    html,
  });
}

/**
 * Send contract reminder email
 */
export async function sendContractReminderEmail(
  zohoLeadId: string,
  data: ContractReminderData
): Promise<EmailResult> {
  const { subject, html } = generateEmailFromTemplate('contract-reminder', data);

  return sendEmailViaZohoCRM({
    leadId: zohoLeadId,
    subject,
    html,
  });
}

/**
 * Send session recovery email (for abandoned sessions)
 */
export async function sendSessionRecoveryEmail(
  recipientEmail: string,
  data: SessionRecoveryData
): Promise<EmailResult> {
  const { subject, html } = generateEmailFromTemplate('session-recovery', data);

  return sendStandaloneEmail({
    to: { email: recipientEmail, name: data.name },
    subject,
    html,
  });
}

/**
 * Send any template email
 */
export async function sendTemplateEmail<T>(
  zohoLeadId: string | null,
  template: EmailTemplate,
  data: T,
  recipientEmail?: string
): Promise<EmailResult> {
  const { subject, html } = generateEmailFromTemplate(template, data);

  if (zohoLeadId) {
    return sendEmailViaZohoCRM({
      leadId: zohoLeadId,
      subject,
      html,
    });
  }

  if (recipientEmail) {
    return sendStandaloneEmail({
      to: recipientEmail,
      subject,
      html,
    });
  }

  return { success: false, error: 'No lead ID or email provided' };
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

const email = {
  isConfigured: isEmailConfigured,
  sendLeadConfirmation: sendLeadConfirmationEmail,
  sendFollowUp: sendFollowUpEmail,
  sendContractReminder: sendContractReminderEmail,
  sendSessionRecovery: sendSessionRecoveryEmail,
  sendTemplate: sendTemplateEmail,
};

export default email;
