/**
 * Send the 3 Follow-up Test Emails
 *
 * Run: node scripts/send-3-followups.mjs
 */

import { readFileSync } from 'fs';

// Load .env.local manually
const envFile = readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const ZEPTOMAIL_API_KEY = env.ZEPTOMAIL_API_KEY;
const TEST_EMAIL = 'admin@ghawdex.pro';
const TEST_NAME = 'Gozo Max';

// =============================================================================
// EMAIL STYLES
// =============================================================================

const COMPANY_PHONE = '+356 7905 5156';
const WHATSAPP_LINK = 'https://wa.me/35679055156';
const WEBSITE = 'https://get.ghawdex.pro';

function getBaseStyles() {
  return `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px 20px; border: 1px solid #e5e7eb; }
    .cta { display: inline-block; background: #16a34a; color: #ffffff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
    .cta:hover { background: #15803d; }
    .highlight { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; }
    .urgent { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
    ul { padding-left: 20px; }
    li { margin: 8px 0; }
  `;
}

function wrapEmail(content, preheader = '') {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${getBaseStyles()}</style>
  ${preheader ? `<span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>` : ''}
</head>
<body>
  ${content}
</body>
</html>
  `.trim();
}

// =============================================================================
// FOLLOW-UP TEMPLATES (the 3 we actually use)
// =============================================================================

function generateFollowUp24h(data) {
  const firstName = data.name.split(' ')[0];
  const subject = `[TEST] ${firstName}, any questions about your solar quote?`;

  const html = wrapEmail(`
    <div class="container">
      <div class="content">
        <p>Hi ${firstName},</p>

        <p>We noticed you requested a solar quote yesterday (ref: <strong>GX-TEST123</strong>) for a 10 kWp system.</p>

        <p>Do you have any questions I can help answer? Our team is ready to assist with:</p>

        <ul>
          <li>System sizing and roof suitability</li>
          <li>REWS 2025 grant application</li>
          <li>BOV financing options</li>
          <li>Installation timeline</li>
        </ul>

        <p>Your estimated annual savings: <strong>EUR 1,800</strong></p>

        <p style="margin: 25px 0;">
          <a href="${WEBSITE}" class="cta">Review & Sign Contract</a>
        </p>

        <p>Or just reply to this email, or call us directly: <a href="tel:${COMPANY_PHONE}">${COMPANY_PHONE}</a></p>

        <p>Best regards,<br>The GhawdeX Team</p>
      </div>
      <div class="footer">
        <p>GhawdeX Solar | Malta's #1 Solar Installer<br>
        <a href="${WEBSITE}">get.ghawdex.pro</a></p>
      </div>
    </div>
  `);

  return { subject, html };
}

function generateFollowUp72h(data) {
  const firstName = data.name.split(' ')[0];
  const subject = `[TEST] ${firstName}, don't miss your solar savings opportunity`;

  const html = wrapEmail(`
    <div class="container">
      <div class="content">
        <p>Hi ${firstName},</p>

        <p>I wanted to follow up on your solar quote from earlier this week.</p>

        <div class="urgent">
          <strong>Did you know?</strong> Every month you wait, you're paying Enemalta approximately EUR 150 that could be going into your pocket instead.
        </div>

        <p>With the REWS 2025 grant still available, now is the perfect time to lock in your savings. The grant covers a significant portion of your system cost.</p>

        <p><strong>Your Quote Summary:</strong></p>
        <ul>
          <li>System: 10 kWp</li>
          <li>Annual Savings: EUR 1,800</li>
          <li>Quote Reference: GX-TEST123</li>
        </ul>

        <p style="margin: 25px 0;">
          <a href="${WEBSITE}" class="cta">Secure Your Savings Now</a>
        </p>

        <p>Have questions? Call me directly at <a href="tel:${COMPANY_PHONE}">${COMPANY_PHONE}</a> - I'm happy to help!</p>

        <p>Best regards,<br>The GhawdeX Team</p>
      </div>
      <div class="footer">
        <p>GhawdeX Solar | 2,000+ installations | 25-year warranty</p>
      </div>
    </div>
  `);

  return { subject, html };
}

function generateFollowUp7d(data) {
  const firstName = data.name.split(' ')[0];
  const subject = `[TEST] ${firstName}, your solar quote expires soon`;

  const html = wrapEmail(`
    <div class="container">
      <div class="content">
        <p>Hi ${firstName},</p>

        <p>This is a final reminder about your solar quote (GX-TEST123).</p>

        <div class="urgent" style="background:#fee2e2;border-color:#dc2626;">
          <strong>Important:</strong> Your quoted prices are only valid for 14 days. REWS 2025 grant allocations are also limited - once they're gone, they're gone.
        </div>

        <p>Over the next 25 years, this system would save you approximately <strong>EUR 36,000</strong>.</p>

        <p>If circumstances have changed or you have any concerns, I'd love to hear from you. Sometimes a quick call is all it takes to clear things up.</p>

        <p style="margin: 25px 0;">
          <a href="${WEBSITE}" class="cta" style="background:#dc2626;">Complete Your Order</a>
        </p>

        <p>Call: <a href="tel:${COMPANY_PHONE}">${COMPANY_PHONE}</a><br>
        WhatsApp: <a href="${WHATSAPP_LINK}">wa.me/35679055156</a></p>

        <p>Best regards,<br>The GhawdeX Team</p>
      </div>
      <div class="footer">
        <p>GhawdeX Solar | Malta's #1 Solar Installer</p>
      </div>
    </div>
  `);

  return { subject, html };
}

// =============================================================================
// EMAIL SENDING
// =============================================================================

async function sendViaZeptoMail(to, subject, html) {
  if (!ZEPTOMAIL_API_KEY) {
    console.log(`  [SKIP] ZeptoMail not configured`);
    return false;
  }

  const response = await fetch('https://api.zeptomail.eu/v1.1/email', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': ZEPTOMAIL_API_KEY,
    },
    body: JSON.stringify({
      from: { address: 'admin@ghawdex.pro', name: 'GhawdeX Solar' },
      to: [{ email_address: { address: to, name: TEST_NAME } }],
      subject,
      htmlbody: html,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    console.log(`  Error: ${JSON.stringify(result)}`);
  }
  return response.ok;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('='.repeat(60));
  console.log('SENDING 3 FOLLOW-UP EMAILS TO:', TEST_EMAIL);
  console.log('='.repeat(60));

  if (!ZEPTOMAIL_API_KEY) {
    console.error('\nERROR: ZEPTOMAIL_API_KEY not found in .env.local');
    console.log('Please add it to send test emails.\n');
    process.exit(1);
  }

  const testData = { name: TEST_NAME };

  const emails = [
    { name: 'Follow-up 24h', generator: generateFollowUp24h },
    { name: 'Follow-up 72h', generator: generateFollowUp72h },
    { name: 'Follow-up 7d', generator: generateFollowUp7d },
  ];

  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    const { subject, html } = email.generator(testData);
    console.log(`\nSending: ${email.name}`);
    console.log(`  Subject: ${subject}`);

    try {
      const success = await sendViaZeptoMail(TEST_EMAIL, subject, html);

      if (success) {
        console.log(`  ✓ Sent successfully!`);
        sent++;
      } else {
        console.log(`  ✗ Failed to send`);
        failed++;
      }
    } catch (err) {
      console.log(`  ✗ Error: ${err.message}`);
      failed++;
    }

    // Small delay between emails
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`RESULTS: ${sent} sent, ${failed} failed`);
  console.log('='.repeat(60));
  console.log(`\nCheck your inbox at: ${TEST_EMAIL}`);
}

main().catch(console.error);
