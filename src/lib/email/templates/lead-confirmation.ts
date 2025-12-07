/**
 * Lead Confirmation Email Template
 *
 * Sent immediately after lead submission with quote summary
 * and contract signing link.
 */

import type { LeadConfirmationData } from '../types';

const COMPANY_PHONE = '+356 7905 5156';
const COMPANY_EMAIL = 'info@ghawdex.pro';
const LOGO_URL = 'https://get.ghawdex.pro/logo.png';

/**
 * Generate lead confirmation email HTML
 */
export function generateLeadConfirmationEmail(data: LeadConfirmationData): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = data.name.split(' ')[0];
  const systemLabel = data.withBattery
    ? `${data.systemSize} kWp + ${data.batterySize} kWh Battery`
    : `${data.systemSize} kWp Solar System`;

  const subject = `Your GhawdeX Solar Quote is Ready - ${systemLabel}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Solar Quote</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; text-align: center; }
    .header img { height: 40px; }
    .header h1 { color: #fff; margin: 20px 0 0; font-size: 24px; }
    .content { padding: 30px; }
    .quote-box { background: #f8fafc; border-radius: 12px; padding: 24px; margin: 20px 0; border-left: 4px solid #f59e0b; }
    .quote-ref { color: #6b7280; font-size: 14px; margin-bottom: 10px; }
    .system-name { font-size: 22px; font-weight: 700; color: #1a1a2e; margin-bottom: 15px; }
    .stats { display: flex; flex-wrap: wrap; gap: 15px; }
    .stat { flex: 1; min-width: 120px; text-align: center; padding: 15px; background: #fff; border-radius: 8px; }
    .stat-value { font-size: 24px; font-weight: 700; color: #16a34a; }
    .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
    .highlight { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .highlight-value { font-size: 32px; font-weight: 700; color: #d97706; }
    .highlight-label { color: #92400e; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #fff !important; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .cta-button:hover { background: linear-gradient(135deg, #15803d 0%, #166534 100%); }
    .timeline { margin: 30px 0; }
    .timeline-item { display: flex; align-items: flex-start; margin-bottom: 15px; }
    .timeline-icon { width: 32px; height: 32px; background: #e0e7ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; flex-shrink: 0; }
    .timeline-icon.done { background: #dcfce7; }
    .timeline-text { flex: 1; }
    .timeline-title { font-weight: 600; color: #1a1a2e; }
    .timeline-desc { font-size: 14px; color: #6b7280; }
    .contact-box { background: #1a1a2e; color: #fff; padding: 25px; border-radius: 12px; margin: 20px 0; text-align: center; }
    .contact-box h3 { margin: 0 0 15px; }
    .contact-links { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; }
    .contact-link { color: #fff; text-decoration: none; display: flex; align-items: center; gap: 8px; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
    .guarantees { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin: 20px 0; }
    .guarantee { font-size: 12px; color: #16a34a; background: #dcfce7; padding: 6px 12px; border-radius: 20px; }
    @media (max-width: 480px) { .stats { flex-direction: column; } .stat { min-width: 100%; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${LOGO_URL}" alt="GhawdeX Solar" />
      <h1>Your Solar Quote is Ready!</h1>
    </div>

    <div class="content">
      <p>Hi ${firstName},</p>

      <p>Thank you for your interest in solar energy! Here's your personalized quote based on your property and energy consumption.</p>

      <div class="quote-box">
        <div class="quote-ref">Quote Reference: <strong>${data.quoteRef}</strong></div>
        <div class="system-name">${systemLabel}</div>

        <div class="stats">
          <div class="stat">
            <div class="stat-value">EUR ${data.totalPrice.toLocaleString()}</div>
            <div class="stat-label">Your Cost${data.paymentMethod === 'loan' ? '*' : ''}</div>
          </div>
          <div class="stat">
            <div class="stat-value">EUR ${data.annualSavings.toLocaleString()}</div>
            <div class="stat-label">Annual Savings</div>
          </div>
          <div class="stat">
            <div class="stat-value">${data.paybackYears} years</div>
            <div class="stat-label">Payback Period</div>
          </div>
        </div>

        ${data.paymentMethod === 'loan' && data.monthlyPayment ? `
        <p style="margin-top: 15px; font-size: 14px; color: #6b7280;">
          *With BOV Green Loan: <strong>EUR ${data.monthlyPayment.toFixed(2)}/month</strong>
        </p>
        ` : ''}
      </div>

      <div class="highlight">
        <div class="highlight-label">Your 25-Year Savings</div>
        <div class="highlight-value">EUR ${(data.annualSavings * 20).toLocaleString()}</div>
        <div style="font-size: 14px; color: #92400e;">That's money staying in YOUR pocket, not Enemalta's!</div>
      </div>

      ${data.contractSigningUrl ? `
      <div style="text-align: center;">
        <a href="${data.contractSigningUrl}" class="cta-button">
          Sign Contract & Start Saving
        </a>
        <p style="font-size: 14px; color: #6b7280;">Takes only 5 minutes. Secure online signing.</p>
      </div>
      ` : ''}

      <div class="timeline">
        <h3 style="margin-bottom: 20px;">What Happens Next?</h3>

        <div class="timeline-item">
          <div class="timeline-icon done">✓</div>
          <div class="timeline-text">
            <div class="timeline-title">Quote Generated</div>
            <div class="timeline-desc">Your personalized solar proposal is ready</div>
          </div>
        </div>

        <div class="timeline-item">
          <div class="timeline-icon">2</div>
          <div class="timeline-text">
            <div class="timeline-title">We'll Call You</div>
            <div class="timeline-desc">Our team will reach out within 24 hours to answer any questions</div>
          </div>
        </div>

        <div class="timeline-item">
          <div class="timeline-icon">3</div>
          <div class="timeline-text">
            <div class="timeline-title">Site Visit (Optional)</div>
            <div class="timeline-desc">Free roof assessment if needed for final design</div>
          </div>
        </div>

        <div class="timeline-item">
          <div class="timeline-icon">4</div>
          <div class="timeline-text">
            <div class="timeline-title">Sign & Pay Deposit</div>
            <div class="timeline-desc">Secure your REWS 2025 grant with 30% deposit</div>
          </div>
        </div>

        <div class="timeline-item">
          <div class="timeline-icon">5</div>
          <div class="timeline-text">
            <div class="timeline-title">Installation in 14 Days</div>
            <div class="timeline-desc">Professional installation by our certified team</div>
          </div>
        </div>
      </div>

      <div class="guarantees">
        <span class="guarantee">✓ 25-Year Warranty</span>
        <span class="guarantee">✓ 14-Day Installation</span>
        <span class="guarantee">✓ Grant Approved</span>
        <span class="guarantee">✓ MRA Licensed</span>
      </div>

      <div class="contact-box">
        <h3>Questions? We're Here to Help!</h3>
        <div class="contact-links">
          <a href="tel:${COMPANY_PHONE.replace(/\s/g, '')}" class="contact-link">
            📞 ${COMPANY_PHONE}
          </a>
          <a href="https://wa.me/35679055156?text=Hi!%20I%20have%20a%20question%20about%20my%20quote%20${data.quoteRef}" class="contact-link">
            💬 WhatsApp
          </a>
          <a href="mailto:${COMPANY_EMAIL}" class="contact-link">
            ✉️ ${COMPANY_EMAIL}
          </a>
        </div>
      </div>
    </div>

    <div class="footer">
      <p><strong>GhawdeX Solar</strong> | Malta's #1 Solar Installer</p>
      <p>2,000+ installations | 25-year warranty | 14-day installation</p>
      <p style="margin-top: 15px;">
        <a href="https://get.ghawdex.pro" style="color: #6b7280;">get.ghawdex.pro</a> |
        <a href="https://www.ghawdex.pro" style="color: #6b7280;">www.ghawdex.pro</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Hi ${firstName},

Your GhawdeX Solar Quote is Ready!

Quote Reference: ${data.quoteRef}
System: ${systemLabel}

YOUR QUOTE SUMMARY
------------------
Total Cost: EUR ${data.totalPrice.toLocaleString()}
Annual Savings: EUR ${data.annualSavings.toLocaleString()}
Payback Period: ${data.paybackYears} years
${data.paymentMethod === 'loan' && data.monthlyPayment ? `Monthly Payment: EUR ${data.monthlyPayment.toFixed(2)} (BOV Green Loan)` : ''}

25-YEAR SAVINGS: EUR ${(data.annualSavings * 20).toLocaleString()}

${data.contractSigningUrl ? `READY TO START SAVING?
Sign your contract here: ${data.contractSigningUrl}
` : ''}

WHAT HAPPENS NEXT?
1. ✓ Quote Generated - Done!
2. We'll call you within 24 hours
3. Optional site visit if needed
4. Sign contract & pay 30% deposit
5. Installation in 14 days

QUESTIONS?
Call: ${COMPANY_PHONE}
WhatsApp: wa.me/35679055156
Email: ${COMPANY_EMAIL}

--
GhawdeX Solar | Malta's #1 Solar Installer
2,000+ installations | 25-year warranty
https://get.ghawdex.pro
  `.trim();

  return { subject, html, text };
}
