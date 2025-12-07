/**
 * GhawdeX SMS Service Types
 */

// =============================================================================
// SMS TYPES
// =============================================================================

export type SmsTemplate =
  | 'lead-confirmation'
  | 'follow-up-24h'
  | 'follow-up-72h'
  | 'follow-up-7d'
  | 'contract-reminder'
  | 'appointment-reminder'
  | 'session-recovery';

export type SmsStatus = 'pending' | 'sent' | 'delivered' | 'failed';

export interface SendSmsOptions {
  to: string;
  message: string;
}

export interface SendTemplateSmsOptions<T = Record<string, unknown>> {
  to: string;
  template: SmsTemplate;
  data: T;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// =============================================================================
// TEMPLATE DATA TYPES
// =============================================================================

export interface LeadConfirmationSmsData {
  name: string;
  quoteRef: string;
  systemSize: number;
}

export interface FollowUpSmsData {
  name: string;
  quoteRef: string;
  contractUrl?: string;
}

export interface ContractReminderSmsData {
  name: string;
  contractUrl: string;
}

export interface AppointmentReminderSmsData {
  name: string;
  date: string;
  time: string;
  address?: string;
}

export interface SessionRecoverySmsData {
  name?: string;
  resumeUrl: string;
}
