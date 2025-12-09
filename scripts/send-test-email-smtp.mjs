/**
 * Send Test Email via Zoho Mail SMTP
 *
 * Usage: node scripts/send-test-email-smtp.mjs [email]
 */

import { readFileSync } from 'fs';
import { createTransport } from 'nodemailer';

// Load .env.local manually
const envFile = readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const ZOHO_MAIL_USER = env.ZOHO_MAIL_USER || env.ZOHO_FROM_EMAIL || 'admin@ghawdex.pro';
const ZOHO_MAIL_PASSWORD = env.ZOHO_MAIL_PASSWORD;

const TEST_EMAIL = process.argv[2] || 'admin@ghawdex.pro';
const TEST_NAME = 'Gozo Max';

// =============================================================================
// 24H EMAIL TEMPLATE (DARK THEME)
// =============================================================================

function generate24hEmail(data) {
  const firstName = data.name.split(' ')[0];
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

        <div class="cta-wrapper">
          <a href="https://get.ghawdex.pro" class="cta">View My Personalized Quote →</a>
        </div>

        <p class="reply-note">Questions? Hit reply - I'll personally answer within 2 hours.</p>

        <div class="contact-row">📞 <a href="tel:+356 7905 5156">+356 7905 5156</a></div>
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

  return { subject, html };
}

// =============================================================================
// SEND VIA ZOHO MAIL SMTP
// =============================================================================

async function sendViaZohoSMTP(toEmail, toName, subject, html) {
  if (!ZOHO_MAIL_PASSWORD) {
    console.error('ERROR: ZOHO_MAIL_PASSWORD not found in .env.local');
    console.log('Add it: ZOHO_MAIL_PASSWORD=your_app_password');
    return false;
  }

  const transporter = createTransport({
    host: 'smtp.zoho.eu',
    port: 465,
    secure: true,
    auth: {
      user: ZOHO_MAIL_USER,
      pass: ZOHO_MAIL_PASSWORD,
    },
  });

  try {
    const result = await transporter.sendMail({
      from: `"GhawdeX Solar" <${ZOHO_MAIL_USER}>`,
      to: `"${toName}" <${toEmail}>`,
      subject,
      html,
    });

    console.log('✓ Email sent! Message ID:', result.messageId);
    return true;
  } catch (err) {
    console.error('❌ SMTP Error:', err.message);
    return false;
  }
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('='.repeat(60));
  console.log('SEND TEST 24H EMAIL VIA ZOHO MAIL SMTP');
  console.log('='.repeat(60));
  console.log(`To: ${TEST_EMAIL}`);
  console.log(`Name: ${TEST_NAME}`);

  const testData = {
    name: TEST_NAME,
    systemSize: 5,
    annualSavings: 1800,
    netCost: 3125,
    totalPrice: 13000,
    grantAmount: 9875,
    pvGrant: 2750,
    batteryGrant: 7125,
    batterySize: 10,
    panelCount: 11,
    isGozo: true,
  };

  const { subject, html } = generate24hEmail(testData);
  console.log(`Subject: ${subject}\n`);

  const success = await sendViaZohoSMTP(TEST_EMAIL, TEST_NAME, subject, html);

  if (success) {
    console.log('\n' + '='.repeat(60));
    console.log('✅ SUCCESS!');
    console.log('='.repeat(60));
    console.log(`Check your inbox at: ${TEST_EMAIL}`);
  }
}

main().catch(console.error);
