/**
 * Portal Upgrade Email Template
 *
 * For cold lead reactivation campaign - leads who expressed interest
 * but were never contacted. Highlights the upgraded get.ghawdex.pro portal.
 */

export interface PortalUpgradeData {
  name: string;
  portalUrl: string;        // Pre-filled portal link
  unsubscribeUrl?: string;  // HMAC-secured opt-out
  isGozo?: boolean;
}

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const COMPANY_PHONE = '+356 7905 5156';
const WHATSAPP_LINK = 'https://wa.me/35679055156';

/**
 * Generate Portal Upgrade email for cold lead reactivation
 */
export function generatePortalUpgradeEmail(data: PortalUpgradeData): EmailContent {
  const firstName = data.name?.split(' ')[0]?.trim() || 'there';
  const isGozo = data.isGozo ?? false;

  const subject = `${firstName}, your roof analysis is ready - 5 min to see it`;

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
    .tagline { font-size: 12px; color: #22c55e; text-transform: uppercase; letter-spacing: 1px; margin: 8px 0 0; }
    .content { padding: 30px; color: #a0a0a0; }
    .greeting { color: #ffffff; font-size: 16px; margin: 0 0 20px; }
    .intro { margin: 0 0 20px; font-size: 15px; line-height: 1.7; }
    .intro strong { color: #ffffff; }
    .hero-box { background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05)); border: 2px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; }
    .hero-title { font-size: 20px; font-weight: 700; color: #22c55e; margin: 0 0 8px; }
    .hero-sub { font-size: 14px; color: #a0a0a0; margin: 0; }
    .features { margin: 25px 0; }
    .feature-row { display: flex; align-items: flex-start; margin: 12px 0; }
    .feature-check { color: #22c55e; margin-right: 10px; font-size: 16px; flex-shrink: 0; }
    .feature-text { font-size: 14px; color: #a0a0a0; }
    .feature-text strong { color: #ffffff; }
    .social-proof { background: #252525; border-radius: 8px; padding: 16px 20px; margin: 25px 0; font-size: 14px; color: #a0a0a0; }
    .social-proof strong { color: #ffffff; }
    .grant-note { font-size: 14px; color: #fbbf24; margin: 20px 0; }
    .cta-wrapper { text-align: center; margin: 30px 0; }
    .cta { display: inline-block; background: linear-gradient(135deg, #22c55e, #16a34a); color: #ffffff !important; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; }
    .cta-note { font-size: 13px; color: #6b6b6b; margin: 12px 0 0; }
    .whatsapp-box { background: rgba(37, 211, 102, 0.1); border: 1px solid rgba(37, 211, 102, 0.3); border-radius: 8px; padding: 16px 20px; margin: 25px 0; text-align: center; }
    .whatsapp-text { font-size: 14px; color: #a0a0a0; margin: 0 0 8px; }
    .whatsapp-link { color: #25d366; font-weight: 600; text-decoration: none; font-size: 15px; }
    .signature { color: #ffffff; margin: 25px 0 0; font-size: 15px; }
    .footer { padding: 25px 30px; border-top: 1px solid rgba(255,255,255,0.08); text-align: center; }
    .footer-text { font-size: 12px; color: #4b4b4b; margin: 0; }
    .footer-text a { color: #6b6b6b; text-decoration: none; }
    @media only screen and (max-width: 480px) {
      .content { padding: 20px; }
      .cta { padding: 14px 30px; font-size: 15px; }
      .hero-title { font-size: 18px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <p class="logo"><span class="logo-red">Ghawdex</span> <span class="logo-white">Solar</span></p>
        <p class="tagline">Our Portal Just Got Smarter</p>
      </div>

      <div class="content">
        <p class="greeting">Hi ${firstName},</p>

        <p class="intro">You showed interest in solar. We've been busy.</p>

        <p class="intro">Our new portal just launched - and it's <strong>faster than anything else in Malta</strong>.</p>

        <div class="hero-box">
          <p class="hero-title">0 to Proposal in 5 Minutes</p>
          <p class="hero-sub">Our AI analyzes your roof, calculates your grants, and shows you exactly what you'll save.</p>
        </div>

        <div class="features">
          <div class="feature-row">
            <span class="feature-check">&#10003;</span>
            <span class="feature-text"><strong>5 minutes</strong>: Full proposal with multiple scenarios to compare</span>
          </div>
          <div class="feature-row">
            <span class="feature-check">&#10003;</span>
            <span class="feature-text"><strong>Google Solar API</strong>: Satellite data analyzes your exact roof</span>
          </div>
          <div class="feature-row">
            <span class="feature-check">&#10003;</span>
            <span class="feature-text"><strong>No site visit needed</strong>: See your numbers before anyone comes</span>
          </div>
          <div class="feature-row">
            <span class="feature-check">&#10003;</span>
            <span class="feature-text"><strong>&euro;799 deposit, 100% refundable</strong>: Change your mind, get your money back</span>
          </div>
        </div>

        <div class="social-proof">
          <strong>50,000+</strong> Maltese homeowners already went solar. Most waited 6-12 weeks.<br>
          <strong>We install in 14 days.</strong>
        </div>

        <p class="grant-note">Your &euro;10,200 grant eligibility is still valid${isGozo ? ' (Gozo gets 95% battery grant!)' : ''}.</p>

        <div class="cta-wrapper">
          <a href="${data.portalUrl}" class="cta">See Your Proposal &rarr;</a>
          <p class="cta-note">No calls. No pressure. Just your numbers.</p>
        </div>

        <div class="whatsapp-box">
          <p class="whatsapp-text">Questions? We're one message away.</p>
          <a href="${WHATSAPP_LINK}" class="whatsapp-link">WhatsApp us: ${COMPANY_PHONE}</a>
        </div>

        <p class="signature">Your solar is waiting,<br><strong>The GhawdeX Team</strong></p>
      </div>

      <div class="footer">
        <p class="footer-text">GhawdeX Solar | 14-Day Installation Guarantee | <a href="https://get.ghawdex.pro">get.ghawdex.pro</a></p>
        ${data.unsubscribeUrl ? `<p class="footer-text" style="margin-top: 10px;"><a href="${data.unsubscribeUrl}">Unsubscribe</a></p>` : ''}
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Hi ${firstName},

You showed interest in solar. We've been busy.

Our new portal just launched - and it's faster than anything else in Malta.

0 TO PROPOSAL IN 5 MINUTES
Our AI analyzes your roof, calculates your grants, and shows you exactly what you'll save.

Here's what's different:
- 5 minutes: Full proposal with multiple scenarios to compare
- Google Solar API: Satellite data analyzes your exact roof
- No site visit needed: See your numbers before anyone comes
- 799 deposit, 100% refundable: Change your mind, get your money back

50,000+ Maltese homeowners already went solar. Most waited 6-12 weeks.
We install in 14 days.

Your 10,200 grant eligibility is still valid${isGozo ? ' (Gozo gets 95% battery grant!)' : ''}.

See Your Proposal: ${data.portalUrl}

No calls. No pressure. Just your numbers.

Questions? WhatsApp us: ${COMPANY_PHONE}

Your solar is waiting,
The GhawdeX Team

---
GhawdeX Solar | 14-Day Installation Guarantee | get.ghawdex.pro
${data.unsubscribeUrl ? `Unsubscribe: ${data.unsubscribeUrl}` : ''}
  `.trim();

  return { subject, html, text };
}
