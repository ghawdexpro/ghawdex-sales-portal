/**
 * Find lead by email in Zoho CRM and send all 4 follow-up emails
 * Usage: node scripts/send-4-emails-auto.mjs admin@ghawdex.pro
 */

import { readFileSync } from 'fs';
import crypto from 'crypto';

const EMAIL = process.argv[2] || 'admin@ghawdex.pro';

// Load env
const env = {};
readFileSync('.env.local', 'utf-8').split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const ZOHO_CLIENT_ID = env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = env.ZOHO_CLIENT_SECRET;
const ZOHO_REFRESH_TOKEN = env.ZOHO_REFRESH_TOKEN;
const ZOHO_API_DOMAIN = env.ZOHO_API_DOMAIN || 'https://www.zohoapis.eu';
const ZOHO_ACCOUNTS_URL = env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.eu';
const ZOHO_FROM_EMAIL = env.ZOHO_FROM_EMAIL || 'admin@ghawdex.pro';

// Get access token
async function getAccessToken() {
  const response = await fetch(`${ZOHO_ACCOUNTS_URL}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: ZOHO_REFRESH_TOKEN,
      client_id: ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  if (!data.access_token) throw new Error('Failed to get Zoho token');
  return data.access_token;
}

// Search for lead by email
async function findLeadByEmail(email) {
  const token = await getAccessToken();

  console.log(`🔍 Searching Zoho CRM for: ${email}...`);

  const response = await fetch(
    `${ZOHO_API_DOMAIN}/crm/v2/Leads/search?email=${encodeURIComponent(email)}`,
    {
      headers: { 'Authorization': `Zoho-oauthtoken ${token}` },
    }
  );

  const result = await response.json();

  if (result.data && result.data.length > 0) {
    console.log(`✅ Found lead: ${result.data[0].Full_Name || result.data[0].Last_Name}`);
    return result.data[0].id;
  }

  console.log('❌ Lead not found in Zoho CRM');
  return null;
}

// Send email via Zoho CRM
async function sendEmail(leadId, template, subject, html) {
  const token = await getAccessToken();

  const response = await fetch(`${ZOHO_API_DOMAIN}/crm/v2/Leads/${leadId}/actions/send_mail`, {
    method: 'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: [{
        from: {
          user_name: 'GhawdeX Solar',
          email: ZOHO_FROM_EMAIL,
        },
        subject,
        content: html,
        mail_format: 'html',
      }],
    }),
  });

  const result = await response.json();
  return response.ok;
}

// Import templates from the compiled email library
import { generateEmailFromTemplate } from '../src/lib/email/templates/index.ts';

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('SENDING ALL 4 FOLLOW-UP EMAILS VIA ZOHO CRM');
  console.log('='.repeat(70));

  // Find lead in Zoho
  const zohoLeadId = await findLeadByEmail(EMAIL);

  if (!zohoLeadId) {
    console.log('\n⚠️  Lead not found in Zoho CRM');
    console.log('Create the lead in Zoho first, or send via standalone email');
    process.exit(1);
  }

  console.log(`\n📧 Sending to Zoho Lead ID: ${zohoLeadId}\n`);

  // Email data
  const emailData = {
    name: 'Gozo Max',
    quoteRef: 'GX-TEST001',
    systemSize: 5,
    batterySize: 10,
    annualSavings: 1800,
    totalPrice: 13000,
    grantAmount: 9875,
    netCost: 3125,
    pvGrant: 2750,
    batteryGrant: 7125,
    isGozo: true,
    panelCount: 11,
    contractSigningUrl: 'https://bo.ghawdex.pro/sign/lead/test',
    unsubscribeUrl: 'https://get.ghawdex.pro/api/unsubscribe?lead=test&token=test',
    salesPhone: '+356 7905 5156',
  };

  const templates = [
    { key: 'follow-up-24h', name: 'Day 1: GOLD Quote Reveal' },
    { key: 'follow-up-48h', name: 'Day 2: Social Proof' },
    { key: 'follow-up-72h', name: 'Day 3: RED Urgency' },
    { key: 'follow-up-7d', name: 'Day 7: Final Notice' },
  ];

  for (const template of templates) {
    console.log(`📨 Sending ${template.name}...`);

    try {
      const { subject, html } = generateEmailFromTemplate(template.key, emailData);
      const success = await sendEmail(zohoLeadId, template.key, subject, html);

      if (success) {
        console.log(`   ✅ Sent!`);
      } else {
        console.log(`   ❌ Failed`);
      }

      // Wait 1 second between emails
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ ALL 4 EMAILS SENT!');
  console.log('Check your inbox: ' + EMAIL);
  console.log('='.repeat(70) + '\n');
}

main().catch(console.error);
