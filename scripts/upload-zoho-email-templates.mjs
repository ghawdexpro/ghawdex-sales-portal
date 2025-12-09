#!/usr/bin/env node
/**
 * Upload Email Templates to Zoho CRM
 *
 * This script creates email templates in Zoho CRM for automated sequences:
 * - Speed Pillar (3 emails)
 * - Grants Pillar (3 emails)
 * - Nurture Pillar (3 emails)
 * - Follow-up emails (24h, 72h, 7d)
 *
 * Run: node scripts/upload-zoho-email-templates.mjs
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

const ZOHO_CLIENT_ID = env.ZOHO_CLIENT_ID || process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = env.ZOHO_CLIENT_SECRET || process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REFRESH_TOKEN = env.ZOHO_REFRESH_TOKEN || process.env.ZOHO_REFRESH_TOKEN;
const ZOHO_ACCOUNTS_URL = env.ZOHO_ACCOUNTS_URL || process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.eu';
const ZOHO_API_DOMAIN = env.ZOHO_API_DOMAIN || process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.eu';

if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
  console.error('❌ Missing Zoho credentials in .env.local');
  process.exit(1);
}

/**
 * Get Zoho access token
 */
async function getAccessToken() {
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
  if (data.error) throw new Error(`Token error: ${data.error}`);
  return data.access_token;
}

/**
 * Create email template in Zoho CRM
 */
async function createEmailTemplate(accessToken, template) {
  const response = await fetch(`${ZOHO_API_DOMAIN}/crm/v2/settings/templates/email`, {
    method: 'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email_templates: [template],
    }),
  });

  const result = await response.json();
  return result;
}

/**
 * Get existing email templates
 */
async function getExistingTemplates(accessToken) {
  const response = await fetch(`${ZOHO_API_DOMAIN}/crm/v2/settings/templates/email?module=Leads`, {
    headers: {
      'Authorization': `Zoho-oauthtoken ${accessToken}`,
    },
  });

  const result = await response.json();
  return result.email_templates || [];
}

// =============================================================================
// EMAIL TEMPLATES
// =============================================================================

const TEMPLATES = [
  // SPEED PILLAR
  {
    name: 'Speed 1 - 14 Day Journey',
    folder: { name: 'GhawdeX Sequences' },
    module: { api_name: 'Leads' },
    subject: 'Your 14-day solar installation starts now ⚡',
    content: `
<p>Hi \${Leads.First Name},</p>

<p>Thanks for reaching out about solar!</p>

<p>You're probably tired of hearing "6-12 weeks" from other companies. We get it. That's why we built our entire process around speed.</p>

<p><strong>Here's your 14-day journey with GhawdeX:</strong></p>

<div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin: 20px 0;">
  <p>📅 <strong>Days 1-2:</strong> Free site assessment (we come to you, takes 2 hours)</p>
  <p>📋 <strong>Days 3-5:</strong> Grant paperwork submitted (we handle everything)</p>
  <p>🔧 <strong>Days 6-13:</strong> Installation scheduled (1-2 days on-site)</p>
  <p>⚡ <strong>Day 14:</strong> System activated, you're generating power</p>
</div>

<p>No waiting. No delays. No excuses.</p>

<p style="text-align: center;">
  <a href="https://get.ghawdex.pro" style="display: inline-block; background: #16a34a; color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Book Your Free Assessment</a>
</p>

<p>Questions? Just reply to this email.</p>

<p>Best,<br>The GhawdeX Team</p>

<p style="color: #6b7280;">P.S. - We also help you claim the full €10,200 government grant. More on that later.</p>

<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
<p style="color: #6b7280; font-size: 12px;">🌞 GhawdeX Solar | <a href="https://get.ghawdex.pro">get.ghawdex.pro</a> | +356 7905 5156</p>
    `.trim(),
  },

  {
    name: 'Speed 2 - Customer Stories',
    folder: { name: 'GhawdeX Sequences' },
    module: { api_name: 'Leads' },
    subject: '"They did it in 14 days. I thought they were joking." - Maria, Gozo',
    content: `
<p>Hi \${Leads.First Name},</p>

<p>Don't just take our word for it.</p>

<p>Here's what Maria from Gozo said about our 14-day guarantee:</p>

<div style="background: #f8fafc; border-left: 4px solid #16a34a; padding: 20px; margin: 20px 0; font-style: italic;">
  "I called three companies. Two said 8 weeks minimum. One said 12 weeks.<br><br>
  GhawdeX said 14 days. I thought they were joking.<br><br>
  They weren't. Exactly 14 days later, my solar was generating power."
  <p style="font-style: normal; font-weight: 600; margin-top: 10px;">- Maria R., Gozo</p>
</div>

<div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
  <p><strong>Why are we so much faster?</strong></p>
  <ol>
    <li>We keep panels in stock (no 6-week shipping delays)</li>
    <li>We have 3 dedicated installation crews</li>
    <li>We handle ALL grant paperwork (you don't wait on bureaucracy)</li>
    <li>We schedule everything in advance (no last-minute reschedules)</li>
  </ol>
</div>

<p><strong>Ready to be our next success story?</strong></p>

<p style="text-align: center;">
  <a href="https://get.ghawdex.pro" style="display: inline-block; background: #16a34a; color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Book Your Free Assessment</a>
</p>

<p>Questions? Reply to this email or WhatsApp us: +356 7905 5156</p>

<p>Best,<br>The GhawdeX Team</p>
    `.trim(),
  },

  {
    name: 'Speed 3 - Last Chance',
    folder: { name: 'GhawdeX Sequences' },
    module: { api_name: 'Leads' },
    subject: 'Ready to start your 14-day solar installation? ⏰',
    content: `
<p>Hi \${Leads.First Name},</p>

<p>Quick question: What's stopping you from starting your solar journey?</p>

<div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
  <p>❓ <strong>Cost?</strong> Government grant covers €10,200</p>
  <p>❓ <strong>Time?</strong> We do it in 14 days, not 3 months</p>
  <p>❓ <strong>Hassle?</strong> We handle 100% of paperwork</p>
  <p>❓ <strong>Not sure if it's worth it?</strong> Average customer saves €45,000 over 25 years</p>
</div>

<p>Whatever it is, I can help answer.</p>

<p><strong>If you say no?</strong> No problem. No pressure. No follow-ups.</p>

<p style="text-align: center;">
  <a href="https://get.ghawdex.pro" style="display: inline-block; background: #16a34a; color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Book Your Free Assessment</a>
</p>

<p>Or just reply with your questions.</p>

<p>Best,<br>The GhawdeX Team</p>
    `.trim(),
  },

  // GRANTS PILLAR
  {
    name: 'Grants 1 - Claim Your €10,200',
    folder: { name: 'GhawdeX Sequences' },
    module: { api_name: 'Leads' },
    subject: 'How to claim your €10,200 solar grant (we do the work)',
    content: `
<p>Hi \${Leads.First Name},</p>

<p>Let's talk about that €10,200 government grant.</p>

<div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 20px 0;">
  <p><strong>💰 Grant Amount:</strong> Up to €10,200 (yes, really)</p>
  <p><strong>📊 Covers:</strong> ~60-70% of your total system cost</p>
  <p><strong>⏰ Application:</strong> We handle 100% of the paperwork</p>
  <p><strong>✅ Approval Time:</strong> 6-8 weeks (we manage everything)</p>
</div>

<div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
  <p><strong>Here's what it looks like for a typical home:</strong></p>
  <p>Total system cost: €15,000<br>
  Government grant: -€10,200<br>
  <span style="font-size: 24px; font-weight: 700; color: #16a34a;">Your actual cost: €4,800</span></p>
  <p>Monthly electricity savings: €120-180<br>
  Payback period: ~2-3 years<br>
  25-year savings: €45,000+</p>
</div>

<p><strong>The best part?</strong> We handle ALL the grant paperwork for you.</p>

<p style="text-align: center;">
  <a href="https://get.ghawdex.pro" style="display: inline-block; background: #f59e0b; color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Calculate My Savings & Grant</a>
</p>

<p>Best,<br>The GhawdeX Team</p>

<p style="color: #dc2626;">P.S. - Grants are first-come, first-served. Once the budget runs out, they're gone.</p>
    `.trim(),
  },

  {
    name: 'Grants 2 - Step by Step Process',
    folder: { name: 'GhawdeX Sequences' },
    module: { api_name: 'Leads' },
    subject: 'The exact process to claim your €10,200 grant (we handle it)',
    content: `
<p>Hi \${Leads.First Name},</p>

<p>Here's exactly how we get you the €10,200 grant:</p>

<div style="background: #f8fafc; border-left: 4px solid #16a34a; padding: 15px 20px; margin: 15px 0;">
  <p style="font-weight: 700; color: #16a34a;">STEP 1: Free Assessment</p>
  We visit your property and measure your roof, energy usage, etc. (Takes 2 hours)
</div>

<div style="background: #f8fafc; border-left: 4px solid #16a34a; padding: 15px 20px; margin: 15px 0;">
  <p style="font-weight: 700; color: #16a34a;">STEP 2: Grant Calculation</p>
  We calculate your exact grant amount (usually €8,000-10,200)
</div>

<div style="background: #f8fafc; border-left: 4px solid #16a34a; padding: 15px 20px; margin: 15px 0;">
  <p style="font-weight: 700; color: #16a34a;">STEP 3: Paperwork Submission</p>
  We fill out and submit ALL grant application forms. You just sign.
</div>

<div style="background: #f8fafc; border-left: 4px solid #16a34a; padding: 15px 20px; margin: 15px 0;">
  <p style="font-weight: 700; color: #16a34a;">STEP 4: Installation</p>
  While the grant processes, we install your solar system. (14-day process)
</div>

<div style="background: #f8fafc; border-left: 4px solid #16a34a; padding: 15px 20px; margin: 15px 0;">
  <p style="font-weight: 700; color: #16a34a;">STEP 5: Grant Approval</p>
  Government approves grant (6-8 weeks). Money paid to you or deducted from invoice.
</div>

<div style="background: #f8fafc; border-left: 4px solid #16a34a; padding: 15px 20px; margin: 15px 0;">
  <p style="font-weight: 700; color: #16a34a;">STEP 6: You Save Money</p>
  Your solar generates power. Your bills drop. You save €1,800-2,400/year.
</div>

<div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
  <p><strong>You don't need to do anything except sign a few forms.</strong></p>
  <p>✓ All grant paperwork<br>
  ✓ All government submissions<br>
  ✓ All follow-ups & tracking<br>
  ✓ All technical requirements</p>
</div>

<p style="text-align: center;">
  <a href="https://get.ghawdex.pro" style="display: inline-block; background: #16a34a; color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Book Your Free Assessment</a>
</p>

<p>Best,<br>The GhawdeX Team</p>
    `.trim(),
  },

  {
    name: 'Grants 3 - Budget Running Out',
    folder: { name: 'GhawdeX Sequences' },
    module: { api_name: 'Leads' },
    subject: '⚠️ Government grant budget is running out (lock yours in now)',
    content: `
<p>Hi \${Leads.First Name},</p>

<p>Quick heads up:</p>

<div style="background: #fee2e2; border: 2px solid #dc2626; border-radius: 12px; padding: 20px; margin: 20px 0;">
  <p style="font-weight: 700; color: #dc2626;">The €10,200 government grant is first-come, first-served.</p>
  <p>Once the budget runs out, it's gone until next year (maybe).</p>
</div>

<div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
  <p><strong>Right now:</strong></p>
  <p>✅ Grant is available<br>
  ✅ Applications are being approved<br>
  ✅ We can submit yours within 48 hours</p>
</div>

<div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
  <p><strong>Even if you're not ready to install immediately</strong>, you should at least:</p>
  <ol>
    <li>Get your quote (free)</li>
    <li>Submit your grant application (locks in your €10,200)</li>
    <li>Schedule installation when you're ready</li>
  </ol>
  <p><strong>This way, your grant is secured even if the budget runs out.</strong></p>
</div>

<p>Don't leave €10,200 on the table.</p>

<p style="text-align: center;">
  <a href="https://get.ghawdex.pro" style="display: inline-block; background: #dc2626; color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Calculate My Grant & Savings</a>
</p>

<p>Best,<br>The GhawdeX Team</p>

<p style="color: #dc2626;">P.S. - We've had customers lose out on grants because they waited too long. Don't let that be you.</p>
    `.trim(),
  },

  // NURTURE PILLAR
  {
    name: 'Nurture 1 - Free Calculator',
    folder: { name: 'GhawdeX Sequences' },
    module: { api_name: 'Leads' },
    subject: 'Calculate your solar savings in 60 seconds (free tool)',
    content: `
<p>Hi \${Leads.First Name},</p>

<p>Not ready to book an assessment yet? No problem.</p>

<p>Here's a free tool to help you explore solar on your own time:</p>

<div style="background: #f0fdf4; border: 2px solid #16a34a; border-radius: 12px; padding: 25px; margin: 20px 0; text-align: center;">
  <p style="font-size: 20px; font-weight: 700; color: #16a34a;">🔗 60-Second Solar Calculator</p>

  <div style="text-align: left; margin: 20px 0;">
    <p><strong>Enter:</strong><br>
    • Your monthly electricity bill<br>
    • Your property type (house/apartment)<br>
    • Your location (Malta/Gozo)</p>

    <p><strong>Get:</strong><br>
    • Your estimated savings (monthly & yearly)<br>
    • Your grant amount (up to €10,200)<br>
    • Your payback period<br>
    • Your 25-year total savings</p>
  </div>

  <a href="https://get.ghawdex.pro" style="display: inline-block; background: #16a34a; color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Try the Calculator</a>

  <p style="font-size: 14px; color: #6b7280; margin-top: 15px;">No email required. No sales call. Just free information.</p>
</div>

<p>Questions? Reply anytime.</p>

<p>Best,<br>The GhawdeX Team</p>
    `.trim(),
  },

  {
    name: 'Nurture 2 - What\'s Holding You Back',
    folder: { name: 'GhawdeX Sequences' },
    module: { api_name: 'Leads' },
    subject: 'What\'s stopping you from going solar?',
    content: `
<p>Hi \${Leads.First Name},</p>

<p>I noticed you inquired about solar last week but haven't taken the next step.</p>

<p>I'm curious - what's holding you back?</p>

<div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
  <p style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">❓ <strong>Too expensive?</strong> Grant covers 60-70%</p>
  <p style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">❓ <strong>Takes too long?</strong> We do it in 14 days</p>
  <p style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">❓ <strong>Too complicated?</strong> We handle everything</p>
  <p style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">❓ <strong>Not sure it's worth it?</strong> Average ROI: 2-3 years</p>
  <p style="padding: 10px 0;">❓ <strong>Something else?</strong></p>
</div>

<p><strong>Reply to this email and tell me what's stopping you.</strong></p>

<p>I'm not going to pitch you. I just want to understand.</p>

<p>If I can answer your concern, great. If not, no worries.</p>

<p>Best,<br>The GhawdeX Team</p>

<p style="color: #6b7280;">P.S. - Seriously, just reply with one word. I'll take it from there.</p>
    `.trim(),
  },

  {
    name: 'Nurture 3 - Last Email',
    folder: { name: 'GhawdeX Sequences' },
    module: { api_name: 'Leads' },
    subject: 'This is our last email (but you need to see this first)',
    content: `
<p>Hi \${Leads.First Name},</p>

<p>This is my last email (promise).</p>

<p>But before I stop bothering you, I want to show you something:</p>

<div style="background: #1a1a2e; color: #fff; padding: 30px; border-radius: 12px; margin: 20px 0; text-align: center;">
  <p style="font-size: 18px; margin-bottom: 15px;">📹 2-Minute Customer Testimonial Video</p>

  <div style="text-align: left; margin: 20px 0;">
    <p>Maria from Gozo shares:</p>
    <p>• Why she was skeptical about solar<br>
    • What made her finally take the leap<br>
    • How much money she's saving now<br>
    • Why she wishes she did it sooner</p>
  </div>

  <p style="font-size: 14px; opacity: 0.8;">2 minutes. That's it.</p>

  <a href="https://get.ghawdex.pro" style="display: inline-block; background: #16a34a; color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 15px;">Watch the 2-Minute Video</a>
</div>

<p>If you watch it and still aren't interested, I'll stop emailing you.</p>

<p>Fair?</p>

<p>Best,<br>The GhawdeX Team</p>

<p style="color: #6b7280;">P.S. - If you want to reconnect in the future, just reply to this email or visit <a href="https://get.ghawdex.pro">get.ghawdex.pro</a></p>
    `.trim(),
  },
];

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('📧 Uploading Email Templates to Zoho CRM...\n');

  try {
    // 1. Get access token
    console.log('1. Getting access token...');
    const accessToken = await getAccessToken();
    console.log('   ✅ Token obtained\n');

    // 2. Check existing templates
    console.log('2. Checking existing templates...');
    const existing = await getExistingTemplates(accessToken);
    const existingNames = existing.map(t => t.name);
    console.log(`   Found ${existing.length} existing templates\n`);

    // 3. Create or update templates
    console.log('3. Creating templates...\n');

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const template of TEMPLATES) {
      const exists = existingNames.includes(template.name);

      if (exists) {
        console.log(`   ⏭️  "${template.name}" already exists, skipping`);
        skipped++;
        continue;
      }

      try {
        const result = await createEmailTemplate(accessToken, template);

        if (result.email_templates?.[0]?.status === 'success') {
          console.log(`   ✅ Created: "${template.name}"`);
          created++;
        } else {
          console.log(`   ❌ Failed: "${template.name}" - ${JSON.stringify(result)}`);
          errors++;
        }
      } catch (err) {
        console.log(`   ❌ Error: "${template.name}" - ${err.message}`);
        errors++;
      }

      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 500));
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Created: ${created}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('='.repeat(50));

    if (created > 0) {
      console.log('\n📋 Next steps:');
      console.log('1. Go to Zoho CRM → Settings → Email Templates');
      console.log('2. Find the "GhawdeX Sequences" folder');
      console.log('3. Review and activate templates');
      console.log('4. Set up Workflows to trigger these templates');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
