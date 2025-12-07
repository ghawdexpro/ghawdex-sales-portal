/**
 * Email Templates Registry
 *
 * Central registry for all email templates.
 */

import type { EmailTemplate, LeadConfirmationData, FollowUpData, ContractReminderData, SessionRecoveryData } from '../types';
import { generateLeadConfirmationEmail } from './lead-confirmation';

// =============================================================================
// TEMPLATE GENERATORS
// =============================================================================

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

/**
 * Generate email content from template
 */
export function generateEmailFromTemplate<T>(
  template: EmailTemplate,
  data: T
): EmailContent {
  switch (template) {
    case 'lead-confirmation':
      return generateLeadConfirmationEmail(data as LeadConfirmationData);

    case 'follow-up-24h':
      return generateFollowUp24hEmail(data as FollowUpData);

    case 'follow-up-72h':
      return generateFollowUp72hEmail(data as FollowUpData);

    case 'follow-up-7d':
      return generateFollowUp7dEmail(data as FollowUpData);

    case 'contract-reminder':
      return generateContractReminderEmail(data as ContractReminderData);

    case 'session-recovery':
      return generateSessionRecoveryEmail(data as SessionRecoveryData);

    default:
      throw new Error(`Unknown email template: ${template}`);
  }
}

// =============================================================================
// FOLLOW-UP TEMPLATES
// =============================================================================

function generateFollowUp24hEmail(data: FollowUpData): EmailContent {
  const firstName = data.name.split(' ')[0];

  const subject = `${firstName}, any questions about your solar quote?`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .cta { display: inline-block; background: #16a34a; color: #fff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <p>Hi ${firstName},</p>

    <p>We noticed you requested a solar quote yesterday (ref: <strong>${data.quoteRef}</strong>) for a ${data.systemSize} kWp system.</p>

    <p>Do you have any questions I can help answer? Our team is ready to assist with:</p>

    <ul>
      <li>System sizing and roof suitability</li>
      <li>REWS 2025 grant application</li>
      <li>BOV financing options</li>
      <li>Installation timeline</li>
    </ul>

    <p>Your estimated annual savings: <strong>EUR ${data.annualSavings.toLocaleString()}</strong></p>

    ${data.contractSigningUrl ? `
    <p style="margin: 25px 0;">
      <a href="${data.contractSigningUrl}" class="cta">Review & Sign Contract</a>
    </p>
    ` : ''}

    <p>Or just reply to this email, or call us directly: <a href="tel:${data.salesPhone}">${data.salesPhone}</a></p>

    <p>Best regards,<br>The GhawdeX Team</p>

    <div class="footer">
      <p>GhawdeX Solar | Malta's #1 Solar Installer<br>
      <a href="https://get.ghawdex.pro">get.ghawdex.pro</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Hi ${firstName},

We noticed you requested a solar quote yesterday (ref: ${data.quoteRef}) for a ${data.systemSize} kWp system.

Do you have any questions I can help answer?

Your estimated annual savings: EUR ${data.annualSavings.toLocaleString()}

${data.contractSigningUrl ? `Ready to proceed? Sign here: ${data.contractSigningUrl}` : ''}

Call us: ${data.salesPhone}
Or just reply to this email.

Best regards,
The GhawdeX Team
  `.trim();

  return { subject, html, text };
}

function generateFollowUp72hEmail(data: FollowUpData): EmailContent {
  const firstName = data.name.split(' ')[0];

  const subject = `${firstName}, don't miss your solar savings opportunity`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .highlight { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .cta { display: inline-block; background: #16a34a; color: #fff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <p>Hi ${firstName},</p>

    <p>I wanted to follow up on your solar quote from earlier this week.</p>

    <div class="highlight">
      <strong>Did you know?</strong> Every month you wait, you're paying Enemalta approximately EUR ${Math.round(data.annualSavings / 12)} that could be going into your pocket instead.
    </div>

    <p>With the REWS 2025 grant still available, now is the perfect time to lock in your savings. The grant covers a significant portion of your system cost.</p>

    <p><strong>Your Quote Summary:</strong></p>
    <ul>
      <li>System: ${data.systemSize} kWp</li>
      <li>Annual Savings: EUR ${data.annualSavings.toLocaleString()}</li>
      <li>Quote Reference: ${data.quoteRef}</li>
    </ul>

    ${data.contractSigningUrl ? `
    <p style="margin: 25px 0;">
      <a href="${data.contractSigningUrl}" class="cta">Secure Your Savings Now</a>
    </p>
    ` : ''}

    <p>Have questions? Call me directly at <a href="tel:${data.salesPhone}">${data.salesPhone}</a> - I'm happy to help!</p>

    <p>Best regards,<br>The GhawdeX Team</p>

    <div class="footer">
      <p>GhawdeX Solar | 2,000+ installations | 25-year warranty</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Hi ${firstName},

I wanted to follow up on your solar quote from earlier this week.

Every month you wait, you're paying Enemalta approximately EUR ${Math.round(data.annualSavings / 12)} that could be going into your pocket instead.

Your Quote Summary:
- System: ${data.systemSize} kWp
- Annual Savings: EUR ${data.annualSavings.toLocaleString()}
- Quote Reference: ${data.quoteRef}

${data.contractSigningUrl ? `Ready to proceed? ${data.contractSigningUrl}` : ''}

Call me: ${data.salesPhone}

Best regards,
The GhawdeX Team
  `.trim();

  return { subject, html, text };
}

function generateFollowUp7dEmail(data: FollowUpData): EmailContent {
  const firstName = data.name.split(' ')[0];

  const subject = `${firstName}, your solar quote expires soon`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .urgent { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
    .cta { display: inline-block; background: #dc2626; color: #fff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <p>Hi ${firstName},</p>

    <p>This is a final reminder about your solar quote (${data.quoteRef}).</p>

    <div class="urgent">
      <strong>Important:</strong> Your quoted prices are only valid for 14 days. REWS 2025 grant allocations are also limited - once they're gone, they're gone.
    </div>

    <p>Over the next 25 years, this system would save you approximately <strong>EUR ${(data.annualSavings * 20).toLocaleString()}</strong>.</p>

    <p>If circumstances have changed or you have any concerns, I'd love to hear from you. Sometimes a quick call is all it takes to clear things up.</p>

    ${data.contractSigningUrl ? `
    <p style="margin: 25px 0;">
      <a href="${data.contractSigningUrl}" class="cta">Complete Your Order</a>
    </p>
    ` : ''}

    <p>Call: <a href="tel:${data.salesPhone}">${data.salesPhone}</a><br>
    WhatsApp: <a href="https://wa.me/35679055156">wa.me/35679055156</a></p>

    <p>Best regards,<br>The GhawdeX Team</p>

    <div class="footer">
      <p>GhawdeX Solar | Malta's #1 Solar Installer</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Hi ${firstName},

This is a final reminder about your solar quote (${data.quoteRef}).

IMPORTANT: Your quoted prices are only valid for 14 days. REWS 2025 grant allocations are also limited.

Over the next 25 years, this system would save you approximately EUR ${(data.annualSavings * 20).toLocaleString()}.

${data.contractSigningUrl ? `Complete your order: ${data.contractSigningUrl}` : ''}

Call: ${data.salesPhone}
WhatsApp: wa.me/35679055156

Best regards,
The GhawdeX Team
  `.trim();

  return { subject, html, text };
}

function generateContractReminderEmail(data: ContractReminderData): EmailContent {
  const firstName = data.name.split(' ')[0];

  const subject = `${firstName}, your GhawdeX contract is ready to sign`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .info-box { background: #f0fdf4; border: 1px solid #16a34a; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .cta { display: inline-block; background: #16a34a; color: #fff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <p>Hi ${firstName},</p>

    <p>Your solar installation contract is ready for signing. It only takes 5 minutes!</p>

    <div class="info-box">
      <strong>Your System:</strong> ${data.systemSize} kWp<br>
      <strong>Your Investment:</strong> EUR ${data.totalPrice.toLocaleString()}<br>
      <strong>Quote Reference:</strong> ${data.quoteRef}
    </div>

    <p style="text-align: center; margin: 30px 0;">
      <a href="${data.contractSigningUrl}" class="cta">Sign Contract Now</a>
    </p>

    <p><strong>What happens after you sign:</strong></p>
    <ol>
      <li>We process your REWS 2025 grant application</li>
      <li>We schedule your installation (within 14 days)</li>
      <li>You start saving from day one!</li>
    </ol>

    <p>Questions? We're here to help: +356 7905 5156</p>

    <p>Best regards,<br>The GhawdeX Team</p>

    <div class="footer">
      <p>This contract has been waiting ${data.daysWaiting} day${data.daysWaiting !== 1 ? 's' : ''}.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Hi ${firstName},

Your solar installation contract is ready for signing. It only takes 5 minutes!

Your System: ${data.systemSize} kWp
Your Investment: EUR ${data.totalPrice.toLocaleString()}
Quote Reference: ${data.quoteRef}

Sign now: ${data.contractSigningUrl}

What happens after you sign:
1. We process your REWS 2025 grant application
2. We schedule your installation (within 14 days)
3. You start saving from day one!

Questions? Call +356 7905 5156

Best regards,
The GhawdeX Team
  `.trim();

  return { subject, html, text };
}

function generateSessionRecoveryEmail(data: SessionRecoveryData): EmailContent {
  const name = data.name || 'there';
  const firstName = name.split(' ')[0];

  const subject = 'Your GhawdeX solar quote is waiting for you';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .progress-box { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .cta { display: inline-block; background: #16a34a; color: #fff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <p>Hi ${firstName},</p>

    <p>We noticed you started getting a solar quote but didn't finish. No worries - your progress has been saved!</p>

    <div class="progress-box">
      <strong>Your Progress:</strong> Step ${data.stepReached} of 6<br>
      ${data.systemSelected ? `<strong>System Selected:</strong> ${data.systemSelected}` : ''}
    </div>

    <p>Continue where you left off - it only takes 2 minutes to complete:</p>

    <p style="margin: 25px 0;">
      <a href="${data.resumeUrl}" class="cta">Continue My Quote</a>
    </p>

    <p>Or if you'd prefer, call us at +356 7905 5156 and we'll complete it together.</p>

    <p>Best regards,<br>The GhawdeX Team</p>

    <div class="footer">
      <p>GhawdeX Solar | Malta's #1 Solar Installer</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Hi ${firstName},

We noticed you started getting a solar quote but didn't finish. No worries - your progress has been saved!

Your Progress: Step ${data.stepReached} of 6
${data.systemSelected ? `System Selected: ${data.systemSelected}` : ''}

Continue where you left off: ${data.resumeUrl}

Or call us: +356 7905 5156

Best regards,
The GhawdeX Team
  `.trim();

  return { subject, html, text };
}

// Re-export individual template generator
export { generateLeadConfirmationEmail } from './lead-confirmation';
