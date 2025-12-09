/**
 * GhawdeX Email Client (Zoho CRM Mail)
 *
 * Sends emails through Zoho CRM API, which automatically:
 * - Logs emails in lead/contact history
 * - Uses the same OAuth credentials as CRM
 * - Makes emails visible to sales team
 */

import type { EmailResult, SendEmailOptions } from './types';

// =============================================================================
// CONFIGURATION
// =============================================================================

const FROM_EMAIL = process.env.ZOHO_SENDER_EMAIL || 'info@ghawdex.pro';
const FROM_NAME = process.env.ZOHO_SENDER_NAME || 'GhawdeX Solar';

// Reuse Zoho OAuth from main zoho.ts
let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Get a valid Zoho access token
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 300000) {
    return cachedAccessToken;
  }

  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const accountsUrl = process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.eu';

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Zoho credentials not configured');
  }

  const response = await fetch(`${accountsUrl}/oauth/v2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json();

  if (data.error || !data.access_token) {
    throw new Error(`Zoho token refresh failed: ${data.error || 'No access token'}`);
  }

  cachedAccessToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;

  return data.access_token;
}

// =============================================================================
// STATUS CHECKS
// =============================================================================

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!(
    process.env.ZOHO_CLIENT_ID &&
    process.env.ZOHO_CLIENT_SECRET &&
    process.env.ZOHO_REFRESH_TOKEN
  );
}

/**
 * Get email configuration status
 */
export function getEmailConfig(): { configured: boolean; fromEmail: string } {
  return {
    configured: isEmailConfigured(),
    fromEmail: `${FROM_NAME} <${FROM_EMAIL}>`,
  };
}

// =============================================================================
// ZOHO CRM EMAIL FUNCTIONS
// =============================================================================

interface ZohoEmailOptions {
  leadId: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    base64Content: string;
  }>;
}

/**
 * Send email via Zoho CRM (attached to lead record)
 * This logs the email in the lead's timeline automatically
 */
export async function sendEmailViaZohoCRM(options: ZohoEmailOptions): Promise<EmailResult> {
  if (!isEmailConfigured()) {
    console.warn('[Email] Zoho not configured, skipping send');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const accessToken = await getAccessToken();
    const apiDomain = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.eu';

    const emailPayload = {
      data: [
        {
          from: {
            user_name: FROM_NAME,
            email: FROM_EMAIL,
          },
          subject: options.subject,
          content: options.html,
          mail_format: 'html',
          attachments: options.attachments?.map(att => ({
            file_name: att.filename,
            content: att.base64Content,
          })),
        },
      ],
    };

    const response = await fetch(
      `${apiDomain}/crm/v2/Leads/${options.leadId}/actions/send_mail`,
      {
        method: 'POST',
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      }
    );

    const result = await response.json();

    if (result.data?.[0]?.status === 'success' || result.data?.[0]?.code === 'SUCCESS') {
      console.log('[Email] Sent via Zoho CRM for lead:', options.leadId);
      return { success: true, messageId: result.data[0]?.details?.id };
    }

    // If Lead was converted to Contact, try Contact endpoint
    if (result.data?.[0]?.code === 'INVALID_DATA' || result.code === 'INVALID_MODULE') {
      console.log('[Email] Lead may be converted, trying Contact endpoint...');
      return await sendEmailViaZohoContact(options, accessToken, apiDomain);
    }

    console.error('[Email] Zoho CRM send failed:', result);
    return { success: false, error: result.data?.[0]?.message || 'Send failed' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Email] Zoho CRM error:', message);
    return { success: false, error: message };
  }
}

/**
 * Send email via Zoho CRM Contact (for converted leads)
 */
async function sendEmailViaZohoContact(
  options: ZohoEmailOptions,
  accessToken: string,
  apiDomain: string
): Promise<EmailResult> {
  try {
    const emailPayload = {
      data: [
        {
          from: {
            user_name: FROM_NAME,
            email: FROM_EMAIL,
          },
          subject: options.subject,
          content: options.html,
          mail_format: 'html',
        },
      ],
    };

    const response = await fetch(
      `${apiDomain}/crm/v2/Contacts/${options.leadId}/actions/send_mail`,
      {
        method: 'POST',
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      }
    );

    const result = await response.json();

    if (result.data?.[0]?.status === 'success') {
      console.log('[Email] Sent via Zoho CRM (Contact):', options.leadId);
      return { success: true, messageId: result.data[0]?.details?.id };
    }

    console.error('[Email] Zoho Contact send failed:', result);
    return { success: false, error: result.data?.[0]?.message || 'Send failed' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Email] Zoho Contact error:', message);
    return { success: false, error: message };
  }
}

// =============================================================================
// STANDALONE EMAIL (for leads without Zoho ID)
// =============================================================================

/**
 * Send standalone email (fallback for leads without Zoho ID)
 * NOTE: Currently not supported - all leads must have Zoho ID to receive emails
 */
export async function sendStandaloneEmail(options: SendEmailOptions): Promise<EmailResult> {
  console.warn('[Email] Standalone email not supported - lead must have Zoho ID');
  console.log('[Email] Would send to:', typeof options.to === 'string' ? options.to : options.to.email);
  console.log('[Email] Subject:', options.subject);

  return { success: false, error: 'Lead must have Zoho ID to send emails' };
}

// =============================================================================
// UNIFIED SEND FUNCTION
// =============================================================================

/**
 * Send email - automatically chooses best method
 * @param zohoLeadId - If provided, sends via Zoho CRM (logs in lead history)
 */
export async function sendEmail(
  options: SendEmailOptions,
  zohoLeadId?: string
): Promise<EmailResult> {
  if (zohoLeadId) {
    // Use Zoho CRM - email gets logged in lead history
    return sendEmailViaZohoCRM({
      leadId: zohoLeadId,
      subject: options.subject,
      html: options.html,
    });
  }

  // Standalone email (no Zoho ID)
  return sendStandaloneEmail(options);
}

/**
 * Send email with retry logic
 */
export async function sendEmailWithRetry(
  options: SendEmailOptions,
  zohoLeadId?: string,
  maxRetries = 3,
  delayMs = 1000
): Promise<EmailResult> {
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await sendEmail(options, zohoLeadId);

    if (result.success) {
      return result;
    }

    lastError = result.error;
    console.warn(`[Email] Attempt ${attempt}/${maxRetries} failed: ${result.error}`);

    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }

  return { success: false, error: `Failed after ${maxRetries} attempts: ${lastError}` };
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
