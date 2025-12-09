/**
 * GhawdeX Email Service Types
 */

// =============================================================================
// EMAIL TYPES
// =============================================================================

export type EmailTemplate =
  | 'lead-confirmation'
  | 'quote-pdf'
  | 'contract-reminder'
  | 'follow-up-24h'
  | 'follow-up-48h'
  | 'follow-up-72h'
  | 'follow-up-7d'
  | 'session-recovery';

export type EmailStatus = 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed';

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendEmailOptions {
  to: EmailRecipient | string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export interface SendTemplateEmailOptions<T = Record<string, unknown>> {
  to: EmailRecipient | string;
  template: EmailTemplate;
  data: T;
  attachments?: EmailAttachment[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// =============================================================================
// TEMPLATE DATA TYPES
// =============================================================================

export interface LeadConfirmationData {
  name: string;
  systemSize: number;
  totalPrice: number;
  annualSavings: number;
  paybackYears: number;
  withBattery: boolean;
  batterySize?: number;
  paymentMethod: 'cash' | 'loan';
  monthlyPayment?: number;
  contractSigningUrl?: string;
  quoteRef: string;
}

export interface QuotePdfData {
  name: string;
  quoteRef: string;
  pdfUrl: string;
  contractSigningUrl?: string;
}

export interface ContractReminderData {
  name: string;
  quoteRef: string;
  systemSize: number;
  totalPrice: number;
  contractSigningUrl: string;
  daysWaiting: number;
}

export interface FollowUpData {
  // Core fields
  name: string;
  quoteRef: string;
  systemSize: number;
  annualSavings: number;
  contractSigningUrl?: string;
  unsubscribeUrl?: string;        // For opt-out link in emails
  salesPhone: string;

  // System details (for specific quotes)
  batterySize?: number;           // 10 for LUNA-10
  panelCount?: number;            // 11 for 5 kWp
  inverterModel?: string;         // "SUN2000-5KTL-L1"
  batteryModel?: string;          // "LUNA2000-10-S0"
  annualProduction?: number;      // 7500 kWh

  // Pricing (for net cost display)
  totalPrice?: number;            // 13000
  grantAmount?: number;           // 9875
  netCost?: number;               // 3125
  pvGrant?: number;               // 2750
  batteryGrant?: number;          // 7125

  // Location (affects grant rates)
  isGozo?: boolean;               // true for 95% battery grant

  // Calculated fields
  lifetimeSavings?: number;       // 45000
  monthlySavings?: number;        // 150
  weeklyCost?: number;            // 35 (what they pay ARMS)
}

export interface SessionRecoveryData {
  name?: string;
  stepReached: number;
  systemSelected?: string;
  resumeUrl: string;
}

// =============================================================================
// COMMUNICATION LOG
// =============================================================================

export interface CommunicationRecord {
  id?: string;
  leadId: string;
  channel: 'email' | 'sms' | 'whatsapp' | 'telegram';
  type: EmailTemplate | string;
  status: EmailStatus;
  externalId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}
