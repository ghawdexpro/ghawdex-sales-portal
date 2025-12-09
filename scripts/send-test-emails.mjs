/**
 * Send Test Emails
 *
 * Sends all marketing sequence emails to a test address for review.
 * Run: node scripts/send-test-emails.mjs
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

const ZOHO_CLIENT_ID = env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = env.ZOHO_CLIENT_SECRET;
const ZOHO_REFRESH_TOKEN = env.ZOHO_REFRESH_TOKEN;
const ZOHO_ACCOUNTS_URL = env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.eu';
const ZOHO_API_DOMAIN = env.ZOHO_API_DOMAIN || 'https://www.zohoapis.eu';
const ZEPTOMAIL_API_KEY = env.ZEPTOMAIL_API_KEY;

const TEST_EMAIL = 'admin@ghawdex.pro';
const TEST_NAME = 'Gozo Max';

// =============================================================================
// EMAIL TEMPLATES (copied from marketing-sequences.ts)
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
// SPEED PILLAR TEMPLATES
// =============================================================================

function generateSpeedEmail1(data) {
  const firstName = data.name.split(' ')[0];
  const subject = '[TEST] Your 14-day solar installation starts now';

  const html = wrapEmail(`
    <div class="container">
      <div class="header">
        <h1 style="margin:0;font-size:24px;">Your Solar Journey Begins!</h1>
        <p style="margin:10px 0 0;opacity:0.9;">14-Day Installation Guarantee</p>
      </div>
      <div class="content">
        <p>Hi ${firstName},</p>

        <p>Thank you for your interest in going solar! While other companies take 6-12 weeks, we guarantee your installation in <strong>just 14 days</strong>.</p>

        <div class="highlight">
          <strong>Why 14 Days Matters:</strong>
          <ul>
            <li>Start saving on electricity immediately</li>
            <li>Lock in current grant rates (${data.isGozo ? 'Gozo gets priority!' : 'before they change'})</li>
            <li>No months of waiting and uncertainty</li>
          </ul>
        </div>

        <p>Here's what happens next:</p>
        <ol>
          <li><strong>Day 1-2:</strong> We finalize your system design</li>
          <li><strong>Day 3-5:</strong> Equipment arrives at your property</li>
          <li><strong>Day 6-10:</strong> Professional installation</li>
          <li><strong>Day 11-14:</strong> Grid connection & you're generating!</li>
        </ol>

        <p style="text-align:center;">
          <a href="${WEBSITE}" class="cta">Get Your Free Quote</a>
        </p>

        <p>Questions? Call us at <a href="tel:${COMPANY_PHONE}">${COMPANY_PHONE}</a> or <a href="${WHATSAPP_LINK}">WhatsApp</a>.</p>

        <p>Best regards,<br><strong>The GhawdeX Team</strong></p>
      </div>
      <div class="footer">
        <p>GhawdeX Solar | Malta's Fastest Solar Installer</p>
        <p><a href="${WEBSITE}">get.ghawdex.pro</a> | ${COMPANY_PHONE}</p>
      </div>
    </div>
  `, '14 days from quote to power generation - guaranteed!');

  return { subject, html };
}

function generateSpeedEmail2(data) {
  const firstName = data.name.split(' ')[0];
  const subject = '[TEST] "They did it in 14 days" - Real customer stories';

  const html = wrapEmail(`
    <div class="container">
      <div class="header">
        <h1 style="margin:0;font-size:24px;">Real Results, Real Fast</h1>
      </div>
      <div class="content">
        <p>Hi ${firstName},</p>

        <p>Don't just take our word for it. Here's what our customers say about our 14-day guarantee:</p>

        <div class="highlight">
          <p><em>"I couldn't believe it. From signing to generating power in exactly 12 days. Other companies quoted me 2-3 months!"</em></p>
          <p style="text-align:right;margin:0;"><strong>- Maria, ${data.isGozo ? 'Victoria' : 'Mosta'}</strong></p>
        </div>

        <div class="highlight">
          <p><em>"The team was professional and fast. My neighbours are jealous - they're still waiting for their installer after 8 weeks."</em></p>
          <p style="text-align:right;margin:0;"><strong>- Joseph, ${data.isGozo ? 'Xaghra' : 'Sliema'}</strong></p>
        </div>

        <p><strong>Why are we faster?</strong></p>
        <ul>
          <li>Local stock - no waiting for imports</li>
          <li>Dedicated installation teams</li>
          <li>Streamlined permit process</li>
          <li>25+ years of Malta experience</li>
        </ul>

        <p style="text-align:center;">
          <a href="${WEBSITE}" class="cta">Join Our Happy Customers</a>
        </p>

        <p>Best regards,<br><strong>The GhawdeX Team</strong></p>
      </div>
      <div class="footer">
        <p>GhawdeX Solar | 2,000+ Installations Completed</p>
      </div>
    </div>
  `);

  return { subject, html };
}

function generateSpeedEmail3(data) {
  const firstName = data.name.split(' ')[0];
  const subject = '[TEST] Last chance: Start your 14-day countdown';

  const html = wrapEmail(`
    <div class="container">
      <div class="header" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);">
        <h1 style="margin:0;font-size:24px;">Time-Sensitive Opportunity</h1>
      </div>
      <div class="content">
        <p>Hi ${firstName},</p>

        <div class="urgent">
          <strong>Important:</strong> Our installation calendar is filling up fast. To guarantee your 14-day installation, you need to act soon.
        </div>

        <p>Every week you wait:</p>
        <ul>
          <li>You pay Enemalta instead of saving</li>
          <li>Grant funds get allocated to others</li>
          <li>Installation slots fill up</li>
        </ul>

        <p><strong>This week's availability:</strong></p>
        <p style="font-size:18px;text-align:center;padding:15px;background:#f0fdf4;border-radius:8px;">
          Only <strong style="color:#16a34a;font-size:24px;">3 slots</strong> left for 14-day installation
        </p>

        <p style="text-align:center;">
          <a href="${WEBSITE}" class="cta" style="background:#dc2626;">Reserve Your Slot Now</a>
        </p>

        <p>Or call us directly: <a href="tel:${COMPANY_PHONE}">${COMPANY_PHONE}</a></p>

        <p>Best regards,<br><strong>The GhawdeX Team</strong></p>
      </div>
      <div class="footer">
        <p>GhawdeX Solar | Don't Wait, Generate!</p>
      </div>
    </div>
  `);

  return { subject, html };
}

// =============================================================================
// GRANTS PILLAR TEMPLATES
// =============================================================================

function generateGrantsEmail1(data) {
  const firstName = data.name.split(' ')[0];
  const subject = '[TEST] How to claim your EUR 10,200 solar grant';

  const html = wrapEmail(`
    <div class="container">
      <div class="header">
        <h1 style="margin:0;font-size:24px;">EUR 10,200 Grant Available</h1>
        <p style="margin:10px 0 0;opacity:0.9;">REWS 2025 Solar Scheme</p>
      </div>
      <div class="content">
        <p>Hi ${firstName},</p>

        <p>Did you know you could receive up to <strong>EUR 10,200</strong> towards your solar installation? The Malta REWS 2025 grant scheme is now open!</p>

        <div class="highlight">
          <strong>Grant Breakdown:</strong>
          <ul>
            <li><strong>Solar panels:</strong> EUR 600/kWp (up to EUR 3,000)</li>
            <li><strong>Battery storage:</strong> 80% covered (up to EUR 7,200)</li>
            <li><strong>Total possible:</strong> EUR 10,200</li>
          </ul>
        </div>

        <p><strong>Who qualifies?</strong></p>
        <ul>
          <li>Maltese residents with a valid ID card</li>
          <li>Property owners (apartments qualify too!)</li>
          <li>First-come, first-served basis</li>
        </ul>

        <p>${data.isGozo ? '<strong>Gozo residents get priority processing!</strong>' : ''}</p>

        <p style="text-align:center;">
          <a href="${WEBSITE}" class="cta">Calculate Your Grant</a>
        </p>

        <p>Best regards,<br><strong>The GhawdeX Team</strong></p>
      </div>
      <div class="footer">
        <p>GhawdeX Solar | We Handle All Paperwork</p>
      </div>
    </div>
  `);

  return { subject, html };
}

function generateGrantsEmail2(data) {
  const firstName = data.name.split(' ')[0];
  const subject = '[TEST] Step-by-step: How we get you EUR 10,200';

  const html = wrapEmail(`
    <div class="container">
      <div class="header">
        <h1 style="margin:0;font-size:24px;">We Handle Everything</h1>
      </div>
      <div class="content">
        <p>Hi ${firstName},</p>

        <p>Worried about grant paperwork? Don't be. Here's exactly how we make it easy:</p>

        <div class="highlight">
          <strong>Step 1: Free Quote (Today)</strong>
          <p style="margin:5px 0 0;">We calculate your exact grant amount based on your roof and energy needs.</p>
        </div>

        <div class="highlight">
          <strong>Step 2: We Submit Everything</strong>
          <p style="margin:5px 0 0;">Our team handles all REWS paperwork - you just sign.</p>
        </div>

        <div class="highlight">
          <strong>Step 3: Installation</strong>
          <p style="margin:5px 0 0;">14-day professional installation by certified technicians.</p>
        </div>

        <div class="highlight">
          <strong>Step 4: Grant Disbursed</strong>
          <p style="margin:5px 0 0;">Grant amount deducted from your final payment.</p>
        </div>

        <p><strong>Your out-of-pocket cost:</strong> Often as low as EUR 2,000-4,000 after grants!</p>

        <p style="text-align:center;">
          <a href="${WEBSITE}" class="cta">See Your Real Cost</a>
        </p>

        <p>Best regards,<br><strong>The GhawdeX Team</strong></p>
      </div>
      <div class="footer">
        <p>GhawdeX Solar | Grant Experts Since 2015</p>
      </div>
    </div>
  `);

  return { subject, html };
}

function generateGrantsEmail3(data) {
  const firstName = data.name.split(' ')[0];
  const subject = '[TEST] Grant budget update: Act now';

  const html = wrapEmail(`
    <div class="container">
      <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
        <h1 style="margin:0;font-size:24px;">Grant Fund Update</h1>
      </div>
      <div class="content">
        <p>Hi ${firstName},</p>

        <div class="urgent">
          <strong>Budget Alert:</strong> The REWS 2025 grant fund is being allocated faster than previous years. Don't miss out on your EUR 10,200.
        </div>

        <p><strong>What happens when grants run out?</strong></p>
        <ul>
          <li>You pay full price (EUR 8,000-15,000 more)</li>
          <li>Wait until 2026 scheme (if there is one)</li>
          <li>Miss current electricity savings</li>
        </ul>

        <p><strong>Secure your grant today:</strong></p>
        <ol>
          <li>Get your free quote (2 minutes)</li>
          <li>We reserve your grant allocation</li>
          <li>Installation within 14 days</li>
        </ol>

        <p style="text-align:center;">
          <a href="${WEBSITE}" class="cta" style="background:#f59e0b;">Lock In Your Grant</a>
        </p>

        <p>Questions? <a href="tel:${COMPANY_PHONE}">${COMPANY_PHONE}</a></p>

        <p>Best regards,<br><strong>The GhawdeX Team</strong></p>
      </div>
      <div class="footer">
        <p>GhawdeX Solar | Helping Malta Go Solar</p>
      </div>
    </div>
  `);

  return { subject, html };
}

// =============================================================================
// NURTURE PILLAR TEMPLATES
// =============================================================================

function generateNurtureEmail1(data) {
  const firstName = data.name.split(' ')[0];
  const subject = '[TEST] Free tool: Calculate your solar savings in 60 seconds';

  const html = wrapEmail(`
    <div class="container">
      <div class="header">
        <h1 style="margin:0;font-size:24px;">How Much Could You Save?</h1>
      </div>
      <div class="content">
        <p>Hi ${firstName},</p>

        <p>Curious about solar but not sure if it's right for you? Our free calculator shows you exactly what you'd save.</p>

        <div class="highlight">
          <strong>In 60 seconds, you'll know:</strong>
          <ul>
            <li>Your estimated annual savings</li>
            <li>How much grant you qualify for</li>
            <li>System size for your home</li>
            <li>Payback period</li>
          </ul>
        </div>

        <p><strong>No commitment, no sales pressure.</strong> Just honest numbers based on Malta electricity rates.</p>

        <p style="text-align:center;">
          <a href="${WEBSITE}" class="cta">Calculate My Savings</a>
        </p>

        <p>Typical Malta household savings: <strong>EUR 1,200-2,400/year</strong></p>

        <p>Best regards,<br><strong>The GhawdeX Team</strong></p>
      </div>
      <div class="footer">
        <p>GhawdeX Solar | Honest Solar Advice</p>
      </div>
    </div>
  `);

  return { subject, html };
}

function generateNurtureEmail2(data) {
  const firstName = data.name.split(' ')[0];
  const subject = "[TEST] Quick question: What's holding you back?";

  const html = wrapEmail(`
    <div class="container">
      <div class="header">
        <h1 style="margin:0;font-size:24px;">We're Here to Help</h1>
      </div>
      <div class="content">
        <p>Hi ${firstName},</p>

        <p>We noticed you haven't taken the next step with solar yet. That's completely fine - it's a big decision!</p>

        <p><strong>Is it one of these concerns?</strong></p>

        <div class="highlight">
          <strong>"It's too expensive"</strong>
          <p style="margin:5px 0 0;">With EUR 10,200 in grants, most systems cost EUR 2,000-4,000 out of pocket. Plus, BOV financing available.</p>
        </div>

        <div class="highlight">
          <strong>"My roof isn't suitable"</strong>
          <p style="margin:5px 0 0;">90% of Malta roofs work for solar. Flat, pitched, even shaded roofs have solutions.</p>
        </div>

        <div class="highlight">
          <strong>"I'm renting / apartment"</strong>
          <p style="margin:5px 0 0;">Apartment owners can install on common areas. We handle building committee approvals.</p>
        </div>

        <div class="highlight">
          <strong>"Not sure it's worth it"</strong>
          <p style="margin:5px 0 0;">Average payback: 3-4 years. Then 20+ years of free electricity.</p>
        </div>

        <p>Reply to this email with your concern, and I'll personally address it.</p>

        <p>Best regards,<br><strong>The GhawdeX Team</strong></p>
      </div>
      <div class="footer">
        <p>GhawdeX Solar | No Question Too Small</p>
      </div>
    </div>
  `);

  return { subject, html };
}

function generateNurtureEmail3(data) {
  const firstName = data.name.split(' ')[0];
  const subject = '[TEST] Last message (but you need to see this)';

  const html = wrapEmail(`
    <div class="container">
      <div class="header">
        <h1 style="margin:0;font-size:24px;">One Final Thought</h1>
      </div>
      <div class="content">
        <p>Hi ${firstName},</p>

        <p>This is my last email about solar (I promise!). But before I go, consider this:</p>

        <div class="highlight">
          <p style="font-size:18px;margin:0;"><strong>Every month without solar, you're giving Enemalta EUR 100-200</strong> that could be staying in your pocket.</p>
        </div>

        <p>Over 25 years (the lifespan of solar panels), that's:</p>
        <ul>
          <li><strong>EUR 30,000 - 60,000</strong> in electricity costs</li>
          <li>Gone. To Enemalta.</li>
        </ul>

        <p>Or, you could invest EUR 2,000-4,000 today (after grants) and keep that money.</p>

        <p><strong>The math is simple. The decision is yours.</strong></p>

        <p style="text-align:center;">
          <a href="${WEBSITE}" class="cta">Get My Free Quote</a>
        </p>

        <p>Whenever you're ready, we're here.</p>

        <p>Best regards,<br><strong>The GhawdeX Team</strong></p>

        <p style="font-size:12px;color:#6b7280;">P.S. Even if you're not ready now, bookmark our site. Grant rates change yearly.</p>
      </div>
      <div class="footer">
        <p>GhawdeX Solar | Malta's Solar Experts</p>
      </div>
    </div>
  `);

  return { subject, html };
}

// =============================================================================
// FOLLOW-UP TEMPLATES
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

async function getZohoAccessToken() {
  const response = await fetch(`${ZOHO_ACCOUNTS_URL}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      refresh_token: ZOHO_REFRESH_TOKEN,
    }),
  });

  const data = await response.json();
  if (data.error || !data.access_token) {
    throw new Error(`Token refresh failed: ${data.error || 'No access token'}`);
  }
  return data.access_token;
}

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
  return response.ok;
}

async function sendViaZohoMail(accessToken, to, subject, html) {
  // Try using Zoho Mail API to send standalone email
  const response = await fetch(`${ZOHO_API_DOMAIN}/crm/v2/functions/send_mail/actions/execute?auth_type=apikey`, {
    method: 'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: to,
      subject: subject,
      content: html,
    }),
  });

  return response.ok;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('='.repeat(60));
  console.log('SENDING TEST EMAILS TO:', TEST_EMAIL);
  console.log('='.repeat(60));

  const testData = { name: TEST_NAME, isGozo: true };

  const emails = [
    { name: 'Speed 1', generator: generateSpeedEmail1 },
    { name: 'Speed 2', generator: generateSpeedEmail2 },
    { name: 'Speed 3', generator: generateSpeedEmail3 },
    { name: 'Grants 1', generator: generateGrantsEmail1 },
    { name: 'Grants 2', generator: generateGrantsEmail2 },
    { name: 'Grants 3', generator: generateGrantsEmail3 },
    { name: 'Nurture 1', generator: generateNurtureEmail1 },
    { name: 'Nurture 2', generator: generateNurtureEmail2 },
    { name: 'Nurture 3', generator: generateNurtureEmail3 },
    { name: 'Follow-up 24h', generator: generateFollowUp24h },
    { name: 'Follow-up 72h', generator: generateFollowUp72h },
    { name: 'Follow-up 7d', generator: generateFollowUp7d },
  ];

  let accessToken;
  try {
    accessToken = await getZohoAccessToken();
    console.log('✓ Zoho access token obtained\n');
  } catch (err) {
    console.error('✗ Failed to get Zoho token:', err.message);
    console.log('Trying ZeptoMail instead...\n');
  }

  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    const { subject, html } = email.generator(testData);
    console.log(`Sending: ${email.name}`);
    console.log(`  Subject: ${subject}`);

    try {
      // Try ZeptoMail first (better for standalone emails)
      let success = await sendViaZeptoMail(TEST_EMAIL, subject, html);

      if (success) {
        console.log(`  ✓ Sent via ZeptoMail`);
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
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`RESULTS: ${sent} sent, ${failed} failed`);
  console.log('='.repeat(60));

  if (failed > 0 && !ZEPTOMAIL_API_KEY) {
    console.log('\nNote: ZeptoMail API key not configured.');
    console.log('To send test emails, either:');
    console.log('1. Add ZEPTOMAIL_API_KEY to .env.local');
    console.log('2. Or I can output the HTML files for manual review');
  }
}

main().catch(console.error);
