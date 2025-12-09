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

  // Calculate values with defaults for external leads
  const netCost = data.netCost || 3125;
  const totalPrice = data.totalPrice || 13000;
  const grantAmount = data.grantAmount || 9875;
  const pvGrant = data.pvGrant || 2750;
  const batteryGrant = data.batteryGrant || 7125;
  const batterySize = data.batterySize || 10;
  const panelCount = data.panelCount || 11;
  const monthlySavings = data.monthlySavings || Math.round(data.annualSavings / 12);
  const lifetimeSavings = data.lifetimeSavings || data.annualSavings * 25;
  const isGozo = data.isGozo ?? true;

  const subject = `${firstName}, your €${netCost.toLocaleString()} solar quote is ready to review`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #0a0a0a; }
    .wrapper { background: #0a0a0a; padding: 20px 0; }
    .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; }
    .header { padding: 30px 30px 20px; text-align: center; border-bottom: 2px solid #ce1126; }
    .logo { font-size: 24px; font-weight: 700; margin: 0; }
    .logo-red { color: #ce1126; }
    .logo-white { color: #ffffff; }
    .tagline { font-size: 12px; color: #fbbf24; text-transform: uppercase; letter-spacing: 1px; margin: 8px 0 0; }
    .content { padding: 30px; color: #a0a0a0; }
    .greeting { color: #ffffff; font-size: 16px; margin: 0 0 20px; }
    .hero-box { background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.05)); border: 2px solid rgba(251, 191, 36, 0.3); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; }
    .hero-label { font-size: 12px; color: #fbbf24; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px; }
    .hero-number { font-size: 48px; font-weight: 700; color: #fbbf24; margin: 0; letter-spacing: -2px; }
    .hero-sub { font-size: 14px; color: #a0a0a0; margin: 8px 0 0; }
    .hero-tagline { font-size: 15px; color: #ffffff; margin: 15px 0 0; }
    .headline { font-size: 18px; color: #ffffff; font-weight: 600; margin: 25px 0 20px; line-height: 1.4; }
    .spec-box { background: #252525; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .spec-title { font-size: 13px; color: #fbbf24; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px; font-weight: 600; }
    .spec-row { font-size: 14px; color: #a0a0a0; margin: 8px 0; }
    .spec-row strong { color: #ffffff; }
    .grant-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .grant-table td { padding: 10px 0; font-size: 14px; color: #a0a0a0; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .grant-table td:last-child { text-align: right; color: #ffffff; }
    .grant-total td { border-bottom: none; font-weight: 700; font-size: 16px; }
    .grant-total td:last-child { color: #22c55e; }
    .savings-list { margin: 20px 0; }
    .savings-item { font-size: 14px; color: #a0a0a0; margin: 8px 0; }
    .savings-item strong { color: #ffffff; }
    .cta-wrapper { text-align: center; margin: 30px 0; }
    .cta { display: inline-block; background: #ce1126; color: #ffffff !important; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; }
    .reply-note { font-size: 14px; color: #a0a0a0; margin: 25px 0; }
    .contact-row { font-size: 14px; margin: 15px 0; }
    .contact-row a { color: #fbbf24; text-decoration: none; }
    .signature { color: #ffffff; margin: 25px 0 0; font-size: 15px; }
    .footer { padding: 25px 30px; border-top: 1px solid rgba(255,255,255,0.08); text-align: center; }
    .footer-text { font-size: 12px; color: #6b6b6b; margin: 0; }
    .footer-text a { color: #fbbf24; text-decoration: none; }
    @media only screen and (max-width: 480px) {
      .content { padding: 20px; }
      .hero-number { font-size: 36px; }
      .cta { padding: 14px 30px; font-size: 15px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <p class="logo"><span class="logo-red">Ghawdex</span> <span class="logo-white">Solar</span></p>
        <p class="tagline">Your Custom Solar Proposal</p>
      </div>

      <div class="content">
        <p class="greeting">Hi ${firstName},</p>

        <p style="color: #a0a0a0; margin: 0 0 20px;">Your solar + battery quote${isGozo ? ' for Gozo' : ''} is ready.</p>

        <div class="hero-box">
          <p class="hero-label">Your Total Investment</p>
          <p class="hero-number">€${netCost.toLocaleString()}</p>
          <p class="hero-sub">after €${grantAmount.toLocaleString()} in grants</p>
          <p class="hero-tagline">That's less than 2 years of electricity bills.</p>
        </div>

        <p class="headline">While others quote 3 months, you'll be generating power in 14 days.</p>

        <div class="spec-box">
          <p class="spec-title">Your System: ${data.systemSize} kWp + ${batterySize} kWh Battery</p>
          <p class="spec-row">• ${panelCount} × Huawei 455W panels</p>
          <p class="spec-row">• Huawei LUNA2000 battery (${batterySize} kWh)</p>
          <p class="spec-row">• 7,500 kWh/year production</p>
          <p class="spec-row">• <strong>Installation: 14 days (guaranteed)</strong></p>
        </div>

        <div class="spec-box">
          <p class="spec-title">Grant Breakdown (we handle ALL paperwork)</p>
          <table class="grant-table">
            <tr><td>System Cost</td><td>€${totalPrice.toLocaleString()}</td></tr>
            <tr><td>PV Grant (50%)</td><td>-€${pvGrant.toLocaleString()}</td></tr>
            <tr><td>Battery Grant (${isGozo ? '95%' : '80%'}${isGozo ? ' Gozo' : ''})</td><td>-€${batteryGrant.toLocaleString()}</td></tr>
            <tr class="grant-total"><td>YOU PAY</td><td>€${netCost.toLocaleString()}</td></tr>
          </table>
        </div>

        <div class="savings-list">
          <p class="spec-title">Your Savings</p>
          <p class="savings-item">• <strong>€${data.annualSavings.toLocaleString()}/year</strong> (€${monthlySavings}/month back in your pocket)</p>
          <p class="savings-item">• Payback: Under 2 years</p>
          <p class="savings-item">• 25-year total: <strong>€${lifetimeSavings.toLocaleString()}</strong></p>
        </div>

        ${data.contractSigningUrl ? `
        <div class="cta-wrapper">
          <a href="${data.contractSigningUrl}" class="cta">View My Personalized Quote →</a>
        </div>
        ` : ''}

        <p class="reply-note">Questions? Hit reply - I'll personally answer within 2 hours.</p>

        <div class="contact-row">📞 <a href="tel:${data.salesPhone}">${data.salesPhone}</a></div>
        <div class="contact-row">💬 <a href="https://wa.me/35679055156">WhatsApp us</a></div>

        <p class="signature">Talk soon,<br><strong>The GhawdeX Team</strong></p>
      </div>

      <div class="footer">
        <p class="footer-text">GhawdeX Solar | 14-Day Installation Guarantee | <a href="https://get.ghawdex.pro">get.ghawdex.pro</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Hi ${firstName},

Your solar + battery quote${isGozo ? ' for Gozo' : ''} is ready.

YOUR TOTAL INVESTMENT: €${netCost.toLocaleString()}
(after €${grantAmount.toLocaleString()} in grants)

That's less than 2 years of electricity bills.

While others quote 3 months, you'll be generating power in 14 days.

YOUR SYSTEM: ${data.systemSize} kWp + ${batterySize} kWh Battery
• ${panelCount} × Huawei 455W panels
• Huawei LUNA2000 battery (${batterySize} kWh)
• 7,500 kWh/year production
• Installation: 14 days (guaranteed)

GRANT BREAKDOWN (we handle ALL paperwork):
System Cost: €${totalPrice.toLocaleString()}
PV Grant (50%): -€${pvGrant.toLocaleString()}
Battery Grant (${isGozo ? '95%' : '80%'}): -€${batteryGrant.toLocaleString()}
YOU PAY: €${netCost.toLocaleString()}

YOUR SAVINGS:
• €${data.annualSavings.toLocaleString()}/year (€${monthlySavings}/month back in your pocket)
• Payback: Under 2 years
• 25-year total: €${lifetimeSavings.toLocaleString()}

${data.contractSigningUrl ? `View your personalized quote: ${data.contractSigningUrl}` : ''}

Questions? Hit reply - I'll personally answer within 2 hours.

📞 ${data.salesPhone}
💬 wa.me/35679055156

Talk soon,
The GhawdeX Team

---
GhawdeX Solar | 14-Day Installation Guarantee | get.ghawdex.pro
  `.trim();

  return { subject, html, text };
}

function generateFollowUp72hEmail(data: FollowUpData): EmailContent {
  const firstName = data.name.split(' ')[0];

  // Calculate values with defaults
  const netCost = data.netCost || 3125;
  const grantAmount = data.grantAmount || 9875;
  const monthlySavings = data.monthlySavings || Math.round(data.annualSavings / 12);
  const lifetimeSavings = data.lifetimeSavings || data.annualSavings * 25;
  const moneyLostIn3Days = monthlySavings * 3 / 30; // ~€150 for 3 days

  const subject = `💰 ${firstName}, you've paid ARMS €${Math.round(moneyLostIn3Days)} since your quote arrived`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #0a0a0a; }
    .wrapper { background: #0a0a0a; padding: 20px 0; }
    .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; }
    .header { padding: 30px 30px 20px; text-align: center; border-bottom: 2px solid #ce1126; }
    .logo { font-size: 24px; font-weight: 700; margin: 0; }
    .logo-red { color: #ce1126; }
    .logo-white { color: #ffffff; }
    .tagline { font-size: 12px; color: #ce1126; text-transform: uppercase; letter-spacing: 1px; margin: 8px 0 0; }
    .content { padding: 30px; color: #a0a0a0; }
    .greeting { color: #ffffff; font-size: 16px; margin: 0 0 20px; }
    .pain-box { background: linear-gradient(135deg, rgba(206, 17, 38, 0.15), rgba(206, 17, 38, 0.05)); border: 2px solid rgba(206, 17, 38, 0.4); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; }
    .pain-label { font-size: 12px; color: #ce1126; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px; }
    .pain-number { font-size: 48px; font-weight: 700; color: #ce1126; margin: 0; letter-spacing: -2px; }
    .pain-sub { font-size: 14px; color: #a0a0a0; margin: 8px 0 0; }
    .section-title { font-size: 14px; color: #ffffff; font-weight: 600; margin: 25px 0 15px; text-transform: uppercase; letter-spacing: 0.5px; }
    .math-box { background: #252525; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .math-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 14px; }
    .math-row:last-child { border-bottom: none; }
    .math-row span:first-child { color: #a0a0a0; }
    .math-row span:last-child { color: #ffffff; }
    .math-total { font-weight: 700; font-size: 16px; }
    .math-total span:last-child { color: #22c55e; }
    .testimonial-box { background: rgba(251, 191, 36, 0.08); border-left: 4px solid #fbbf24; border-radius: 0 8px 8px 0; padding: 20px; margin: 25px 0; }
    .testimonial-text { font-size: 15px; color: #ffffff; font-style: italic; margin: 0 0 10px; line-height: 1.5; }
    .testimonial-author { font-size: 13px; color: #fbbf24; font-style: normal; }
    .quote-valid { font-size: 14px; color: #a0a0a0; margin: 20px 0; }
    .quote-valid strong { color: #ffffff; }
    .cta-wrapper { text-align: center; margin: 30px 0; }
    .cta { display: inline-block; background: #ce1126; color: #ffffff !important; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; }
    .cta-secondary { display: inline-block; background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #fbbf24 !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px; margin-top: 12px; }
    .contact-row { font-size: 14px; margin: 15px 0; }
    .contact-row a { color: #fbbf24; text-decoration: none; }
    .signature { color: #ffffff; margin: 25px 0 0; font-size: 15px; }
    .footer { padding: 25px 30px; border-top: 1px solid rgba(255,255,255,0.08); text-align: center; }
    .footer-text { font-size: 12px; color: #6b6b6b; margin: 0; }
    .footer-text a { color: #fbbf24; text-decoration: none; }
    @media only screen and (max-width: 480px) {
      .content { padding: 20px; }
      .pain-number { font-size: 36px; }
      .cta { padding: 14px 30px; font-size: 15px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <p class="logo"><span class="logo-red">Ghawdex</span> <span class="logo-white">Solar</span></p>
        <p class="tagline">Your Quote Expires Soon</p>
      </div>

      <div class="content">
        <p class="greeting">${firstName},</p>

        <p style="color: #a0a0a0; margin: 0 0 20px;">Since we sent your quote 3 days ago:</p>

        <div class="pain-box">
          <p class="pain-label">You've Paid ARMS</p>
          <p class="pain-number">€${Math.round(moneyLostIn3Days)}</p>
          <p class="pain-sub">That's ~€${Math.round(monthlySavings / 30)}/day. Gone.</p>
        </div>

        <p class="section-title">The Maths (no BS, just numbers)</p>

        <div class="math-box">
          <div class="math-row"><span>Your current ARMS bill</span><span>~€${data.annualSavings.toLocaleString()}/year</span></div>
          <div class="math-row"><span>With solar</span><span>~€0-200/year</span></div>
          <div class="math-row math-total"><span>YOUR SAVINGS</span><span>€${data.annualSavings.toLocaleString()}/year</span></div>
          <div class="math-row"><span>Over 25 years</span><span>€${lifetimeSavings.toLocaleString()}</span></div>
        </div>

        <div class="testimonial-box">
          <p class="testimonial-text">"I waited 6 months to decide. That cost me €${monthlySavings * 6}. Don't be like me."</p>
          <p class="testimonial-author">— Maria, Gozo (recent GhawdeX customer)</p>
        </div>

        <p class="quote-valid">
          Your quote (<strong>${data.quoteRef}</strong>) is still valid.<br>
          Net cost: <strong>€${netCost.toLocaleString()}</strong> after €${grantAmount.toLocaleString()} in grants.
        </p>

        ${data.contractSigningUrl ? `
        <div class="cta-wrapper">
          <a href="${data.contractSigningUrl}" class="cta">Lock In This Price →</a>
          <br>
          <a href="${data.contractSigningUrl}" class="cta-secondary">Schedule a 15-Min Call</a>
        </div>
        ` : ''}

        <div class="contact-row">📞 <a href="tel:${data.salesPhone}">${data.salesPhone}</a></div>
        <div class="contact-row">💬 <a href="https://wa.me/35679055156">WhatsApp us</a></div>

        <p class="signature">The longer you wait, the more you pay ARMS.<br><br>Your call,<br><strong>The GhawdeX Team</strong></p>
      </div>

      <div class="footer">
        <p class="footer-text">GhawdeX Solar | 14-Day Installation Guarantee | <a href="https://get.ghawdex.pro">get.ghawdex.pro</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
${firstName},

Since we sent your quote 3 days ago:

YOU'VE PAID ARMS: €${Math.round(moneyLostIn3Days)}
That's ~€${Math.round(monthlySavings / 30)}/day. Gone.

THE MATHS (no BS, just numbers):
Your current ARMS bill: ~€${data.annualSavings.toLocaleString()}/year
With solar: ~€0-200/year
YOUR SAVINGS: €${data.annualSavings.toLocaleString()}/year
Over 25 years: €${lifetimeSavings.toLocaleString()}

"I waited 6 months to decide. That cost me €${monthlySavings * 6}. Don't be like me."
— Maria, Gozo (recent GhawdeX customer)

Your quote (${data.quoteRef}) is still valid.
Net cost: €${netCost.toLocaleString()} after €${grantAmount.toLocaleString()} in grants.

${data.contractSigningUrl ? `Lock in this price: ${data.contractSigningUrl}` : ''}

📞 ${data.salesPhone}
💬 wa.me/35679055156

The longer you wait, the more you pay ARMS.

Your call,
The GhawdeX Team

---
GhawdeX Solar | 14-Day Installation Guarantee | get.ghawdex.pro
  `.trim();

  return { subject, html, text };
}

function generateFollowUp7dEmail(data: FollowUpData): EmailContent {
  const firstName = data.name.split(' ')[0];

  // Calculate values with defaults
  const netCost = data.netCost || 3125;
  const grantAmount = data.grantAmount || 9875;
  const batterySize = data.batterySize || 10;
  const lifetimeSavings = data.lifetimeSavings || data.annualSavings * 25;
  const weeklyLoss = data.weeklyCost || Math.round(data.annualSavings / 52);

  const subject = `${firstName}, before I close your solar file...`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #0a0a0a; }
    .wrapper { background: #0a0a0a; padding: 20px 0; }
    .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; }
    .header { padding: 30px 30px 20px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .logo { font-size: 24px; font-weight: 700; margin: 0; }
    .logo-red { color: #ce1126; }
    .logo-white { color: #ffffff; }
    .tagline { font-size: 12px; color: #6b6b6b; text-transform: uppercase; letter-spacing: 1px; margin: 8px 0 0; }
    .content { padding: 30px; color: #a0a0a0; }
    .greeting { color: #ffffff; font-size: 16px; margin: 0 0 20px; }
    .intro { color: #a0a0a0; margin: 0 0 25px; font-size: 15px; }
    .countdown-box { background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)); border: 1px solid rgba(206, 17, 38, 0.4); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; }
    .countdown-label { font-size: 12px; color: #ce1126; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px; }
    .countdown-number { font-size: 42px; font-weight: 700; color: #ffffff; margin: 0; letter-spacing: -1px; }
    .countdown-sub { font-size: 13px; color: #6b6b6b; margin: 10px 0 0; }
    .section-title { font-size: 13px; color: #6b6b6b; text-transform: uppercase; letter-spacing: 1px; margin: 25px 0 15px; }
    .summary-box { background: #252525; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 14px; }
    .summary-row:last-child { border-bottom: none; }
    .summary-row span:first-child { color: #6b6b6b; }
    .summary-row span:last-child { color: #a0a0a0; }
    .summary-highlight span:last-child { color: #ffffff; font-weight: 600; }
    .choice-box { background: #252525; border-radius: 8px; padding: 20px; margin: 25px 0; }
    .choice-title { font-size: 15px; color: #ffffff; font-weight: 600; margin: 0 0 15px; }
    .choice-row { font-size: 14px; margin: 10px 0; }
    .choice-bad { color: #6b6b6b; }
    .choice-good { color: #22c55e; }
    .cta-wrapper { text-align: center; margin: 30px 0; }
    .cta { display: inline-block; background: #ce1126; color: #ffffff !important; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; }
    .snooze-box { background: rgba(34, 197, 94, 0.08); border-left: 3px solid #22c55e; border-radius: 0 8px 8px 0; padding: 20px; margin: 25px 0; }
    .snooze-title { font-size: 14px; color: #ffffff; font-weight: 600; margin: 0 0 12px; }
    .snooze-text { font-size: 13px; color: #a0a0a0; margin: 0 0 15px; line-height: 1.6; }
    .snooze-options { font-size: 13px; color: #6b6b6b; margin: 0; }
    .snooze-options strong { color: #fbbf24; }
    .contact-row { font-size: 14px; margin: 12px 0; }
    .contact-row a { color: #fbbf24; text-decoration: none; }
    .signature { color: #ffffff; margin: 25px 0 0; font-size: 15px; }
    .ps-note { font-size: 13px; color: #ce1126; margin: 20px 0 0; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.06); }
    .footer { padding: 25px 30px; border-top: 1px solid rgba(255,255,255,0.08); text-align: center; }
    .footer-text { font-size: 12px; color: #4b4b4b; margin: 0; }
    .footer-text a { color: #6b6b6b; text-decoration: none; }
    @media only screen and (max-width: 480px) {
      .content { padding: 20px; }
      .countdown-number { font-size: 36px; }
      .cta { padding: 14px 30px; font-size: 15px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <p class="logo"><span class="logo-red">Ghawdex</span> <span class="logo-white">Solar</span></p>
        <p class="tagline">Final Notice</p>
      </div>

      <div class="content">
        <p class="greeting">${firstName},</p>

        <p class="intro">This is my final message about your solar quote.<br>No more emails after this.</p>

        <div class="countdown-box">
          <p class="countdown-label">Quote Expires In</p>
          <p class="countdown-number">7 DAYS</p>
          <p class="countdown-sub">After that, we'll need to re-quote (prices may change)</p>
        </div>

        <p class="section-title">Quick Summary</p>

        <div class="summary-box">
          <div class="summary-row"><span>Quote Ref</span><span>${data.quoteRef}</span></div>
          <div class="summary-row"><span>System</span><span>${data.systemSize} kWp + ${batterySize} kWh</span></div>
          <div class="summary-row summary-highlight"><span>Net Cost</span><span>€${netCost.toLocaleString()}</span></div>
          <div class="summary-row"><span>Annual Savings</span><span>€${data.annualSavings.toLocaleString()}/year</span></div>
          <div class="summary-row"><span>Installation</span><span>14 days (guaranteed)</span></div>
        </div>

        <div class="choice-box">
          <p class="choice-title">Your Choice</p>
          <p class="choice-row choice-bad">❌ Keep paying ARMS €${weeklyLoss}/week forever</p>
          <p class="choice-row choice-good">✅ Start saving €${data.annualSavings.toLocaleString()}/year in 14 days</p>
        </div>

        ${data.contractSigningUrl ? `
        <div class="cta-wrapper">
          <a href="${data.contractSigningUrl}" class="cta">I'm Ready - Let's Talk →</a>
        </div>
        ` : ''}

        <div class="snooze-box">
          <p class="snooze-title">Not ready right now?</p>
          <p class="snooze-text">That's genuinely okay. Reply with:</p>
          <p class="snooze-options">
            • <strong>"not now"</strong> - I'll close your file<br>
            • <strong>"3 months"</strong> - I'll check back then<br>
            • <strong>"call me"</strong> - Let's discuss your questions
          </p>
          <p class="snooze-text" style="margin-top: 12px;">No hard feelings. We're here when you're ready.</p>
        </div>

        <div class="contact-row">📞 <a href="tel:${data.salesPhone}">${data.salesPhone}</a></div>
        <div class="contact-row">💬 <a href="https://wa.me/35679055156">WhatsApp us</a></div>

        <p class="signature">Whatever you decide,<br><strong>The GhawdeX Team</strong></p>

        <p class="ps-note">P.S. Every week you wait = €${weeklyLoss} more to ARMS.</p>
      </div>

      <div class="footer">
        <p class="footer-text">GhawdeX Solar | <a href="https://get.ghawdex.pro">get.ghawdex.pro</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
${firstName},

This is my final message about your solar quote.
No more emails after this.

QUOTE EXPIRES IN: 7 DAYS
After that, we'll need to re-quote (prices may change)

QUICK SUMMARY:
Quote Ref: ${data.quoteRef}
System: ${data.systemSize} kWp + ${batterySize} kWh
Net Cost: €${netCost.toLocaleString()}
Annual Savings: €${data.annualSavings.toLocaleString()}/year
Installation: 14 days (guaranteed)

YOUR CHOICE:
❌ Keep paying ARMS €${weeklyLoss}/week forever
✅ Start saving €${data.annualSavings.toLocaleString()}/year in 14 days

${data.contractSigningUrl ? `I'm ready - let's talk: ${data.contractSigningUrl}` : ''}

NOT READY RIGHT NOW? That's genuinely okay.
Reply with:
• "not now" - I'll close your file
• "3 months" - I'll check back then
• "call me" - Let's discuss your questions

No hard feelings. We're here when you're ready.

📞 ${data.salesPhone}
💬 wa.me/35679055156

Whatever you decide,
The GhawdeX Team

P.S. Every week you wait = €${weeklyLoss} more to ARMS.

---
GhawdeX Solar | get.ghawdex.pro
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
