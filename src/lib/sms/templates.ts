/**
 * SMS Templates
 *
 * Keep messages short! SMS limit is 160 characters for single segment.
 * Longer messages split into multiple segments (charged per segment).
 */

import type {
  SmsTemplate,
  LeadConfirmationSmsData,
  FollowUpSmsData,
  ContractReminderSmsData,
  AppointmentReminderSmsData,
  SessionRecoverySmsData,
} from './types';

const COMPANY_PHONE = '79055156';
const SHORT_URL_BASE = 'ghawdex.pro/s/'; // Use short URLs to save characters

// =============================================================================
// TEMPLATE GENERATORS
// =============================================================================

/**
 * Generate SMS message from template
 */
export function generateSmsFromTemplate<T>(
  template: SmsTemplate,
  data: T
): string {
  switch (template) {
    case 'lead-confirmation':
      return generateLeadConfirmationSms(data as LeadConfirmationSmsData);

    case 'follow-up-24h':
      return generateFollowUp24hSms(data as FollowUpSmsData);

    case 'follow-up-72h':
      return generateFollowUp72hSms(data as FollowUpSmsData);

    case 'follow-up-7d':
      return generateFollowUp7dSms(data as FollowUpSmsData);

    case 'contract-reminder':
      return generateContractReminderSms(data as ContractReminderSmsData);

    case 'appointment-reminder':
      return generateAppointmentReminderSms(data as AppointmentReminderSmsData);

    case 'session-recovery':
      return generateSessionRecoverySms(data as SessionRecoverySmsData);

    default:
      throw new Error(`Unknown SMS template: ${template}`);
  }
}

// =============================================================================
// INDIVIDUAL TEMPLATES
// =============================================================================

function getFirstName(name: string): string {
  return name.split(' ')[0];
}

/**
 * Lead confirmation SMS (sent immediately after quote)
 * ~140 chars
 */
function generateLeadConfirmationSms(data: LeadConfirmationSmsData): string {
  const firstName = getFirstName(data.name);
  return `Hi ${firstName}! Your GhawdeX ${data.systemSize}kWp solar quote (${data.quoteRef}) is ready. Check email for details or call ${COMPANY_PHONE}. -GhawdeX`;
}

/**
 * 24h follow-up SMS
 * ~150 chars
 */
function generateFollowUp24hSms(data: FollowUpSmsData): string {
  const firstName = getFirstName(data.name);
  if (data.contractUrl) {
    return `Hi ${firstName}, any questions about your solar quote? Sign contract here: ${data.contractUrl} or call ${COMPANY_PHONE}. -GhawdeX`;
  }
  return `Hi ${firstName}, any questions about your solar quote (${data.quoteRef})? We're here to help! Call ${COMPANY_PHONE}. -GhawdeX`;
}

/**
 * 72h follow-up SMS (more urgency)
 * ~155 chars
 */
function generateFollowUp72hSms(data: FollowUpSmsData): string {
  const firstName = getFirstName(data.name);
  if (data.contractUrl) {
    return `${firstName}, don't miss your solar savings! REWS 2025 grants are limited. Sign now: ${data.contractUrl} Questions? ${COMPANY_PHONE}. -GhawdeX`;
  }
  return `${firstName}, don't miss your solar savings! REWS 2025 grants are limited. Call us: ${COMPANY_PHONE}. -GhawdeX`;
}

/**
 * 7d follow-up SMS (final reminder)
 * ~150 chars
 */
function generateFollowUp7dSms(data: FollowUpSmsData): string {
  const firstName = getFirstName(data.name);
  if (data.contractUrl) {
    return `Final reminder ${firstName}: Your solar quote expires soon. Lock in REWS grant: ${data.contractUrl} or call ${COMPANY_PHONE}. -GhawdeX`;
  }
  return `Final reminder ${firstName}: Your solar quote (${data.quoteRef}) expires soon. Call ${COMPANY_PHONE} to secure your grant. -GhawdeX`;
}

/**
 * Contract reminder SMS
 * ~140 chars
 */
function generateContractReminderSms(data: ContractReminderSmsData): string {
  const firstName = getFirstName(data.name);
  return `${firstName}, your solar contract is ready! Sign in 5 min: ${data.contractUrl} Questions? Call ${COMPANY_PHONE}. -GhawdeX`;
}

/**
 * Appointment reminder SMS
 * ~145 chars
 */
function generateAppointmentReminderSms(data: AppointmentReminderSmsData): string {
  const firstName = getFirstName(data.name);
  return `Hi ${firstName}, reminder: GhawdeX site visit on ${data.date} at ${data.time}. ${data.address ? `Location: ${data.address}` : ''} Questions? ${COMPANY_PHONE}`;
}

/**
 * Session recovery SMS (abandoned cart)
 * ~140 chars
 */
function generateSessionRecoverySms(data: SessionRecoverySmsData): string {
  const firstName = data.name ? getFirstName(data.name) : 'Hi';
  return `${firstName}, your solar quote is waiting! Complete in 2 min: ${data.resumeUrl} or call ${COMPANY_PHONE}. -GhawdeX`;
}

// =============================================================================
// UTILITY
// =============================================================================

/**
 * Check if message fits in single SMS segment
 */
export function isSingleSegment(message: string): boolean {
  return message.length <= 160;
}

/**
 * Calculate number of SMS segments
 */
export function calculateSegments(message: string): number {
  if (message.length <= 160) return 1;
  // Multi-part SMS uses 153 chars per segment (7 chars for concatenation header)
  return Math.ceil(message.length / 153);
}
