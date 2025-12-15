/**
 * Portal Upgrade Campaign - Cold Lead Reactivation
 *
 * SAFETY: Dry-run by default. Will NOT send emails unless explicitly confirmed.
 *
 * Usage:
 *   node scripts/send-portal-upgrade-campaign.mjs --dry-run        # Preview only (DEFAULT)
 *   node scripts/send-portal-upgrade-campaign.mjs --test-email X   # Send test to specific email
 *   node scripts/send-portal-upgrade-campaign.mjs --send           # ACTUALLY SEND (requires confirmation)
 *   node scripts/send-portal-upgrade-campaign.mjs --send --limit 5 # Send to first 5 leads only
 */

import { readFileSync } from 'fs';
import crypto from 'crypto';

// =============================================================================
// CONFIG
// =============================================================================

const PORTAL_BASE_URL = 'https://get.ghawdex.pro';
const UNSUBSCRIBE_BASE_URL = 'https://get.ghawdex.pro/api/unsubscribe';
const SUPABASE_PROJECT = 'epxeimwsheyttevwtjku';
const DELAY_BETWEEN_EMAILS_MS = 2000; // 2 seconds

// =============================================================================
// LOAD ENV
// =============================================================================

const env = {};
try {
  readFileSync('.env.local', 'utf-8').split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
  });
} catch (e) {
  console.error('ERROR: Could not read .env.local');
  process.exit(1);
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || `https://${SUPABASE_PROJECT}.supabase.co`;
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const UNSUBSCRIBE_SECRET = env.UNSUBSCRIBE_SECRET || env.HMAC_SECRET || 'ghawdex-unsubscribe-2024';

// Zoho CRM credentials
const ZOHO_CLIENT_ID = env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = env.ZOHO_CLIENT_SECRET;
const ZOHO_REFRESH_TOKEN = env.ZOHO_REFRESH_TOKEN;
const ZOHO_API_DOMAIN = env.ZOHO_API_DOMAIN || 'https://www.zohoapis.eu';
const ZOHO_ACCOUNTS_URL = env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.eu';
const ZOHO_FROM_EMAIL = env.ZOHO_FROM_EMAIL || env.ZOHO_SENDER_EMAIL || 'info@ghawdex.pro';

// =============================================================================
// PARSE CLI ARGS
// =============================================================================

const args = process.argv.slice(2);
const isDryRun = !args.includes('--send');
const testEmail = args.includes('--test-email') ? args[args.indexOf('--test-email') + 1] : null;
const limitIndex = args.indexOf('--limit');
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : null;

// =============================================================================
// HELPERS
// =============================================================================

function generateHmacToken(leadId) {
  return crypto
    .createHmac('sha256', UNSUBSCRIBE_SECRET)
    .update(leadId)
    .digest('hex')
    .substring(0, 32);
}

function buildPortalUrl(lead) {
  const params = new URLSearchParams();
  if (lead.name) params.set('name', lead.name);
  if (lead.email) params.set('email', lead.email);
  if (lead.phone) params.set('phone', lead.phone);
  if (lead.zoho_lead_id) params.set('zoho_id', lead.zoho_lead_id);
  return `${PORTAL_BASE_URL}/?${params.toString()}`;
}

function buildUnsubscribeUrl(leadId) {
  const token = generateHmacToken(leadId);
  return `${UNSUBSCRIBE_BASE_URL}?lead=${leadId}&token=${token}`;
}

function isGozoLocation(lead) {
  const locality = (lead.locality || '').toLowerCase();
  const gozoLocalities = ['gozo', 'victoria', 'rabat', 'xaghra', 'gharb', 'xewkija', 'sannat', 'munxar', 'nadur', 'qala', 'zebbug'];
  return gozoLocalities.some(g => locality.includes(g));
}

// =============================================================================
// SUPABASE QUERIES
// =============================================================================

async function fetchEligibleLeads() {
  const apiKey = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;

  // Query leads who:
  // - Have email
  // - Have NOT opted out
  // - Have NEVER been contacted (first_contact_at IS NULL)
  // - Exclude test emails (containing '123' or 'test')
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/leads?select=id,name,email,phone,locality,zoho_lead_id,created_at,email_opted_out,first_contact_at&email_opted_out=eq.false&first_contact_at=is.null&email=not.ilike.*test*&email=not.ilike.*123*&order=created_at.desc`,
    {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase query failed: ${error}`);
  }

  return response.json();
}

async function logCommunication(leadId, status, externalId = null) {
  const apiKey = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;

  const record = {
    lead_id: leadId,
    channel: 'email',
    type: 'portal-upgrade',
    status: status,
    external_id: externalId,
    metadata: { campaign: 'portal-upgrade-reactivation', sent_at: new Date().toISOString() },
  };

  const response = await fetch(`${SUPABASE_URL}/rest/v1/communications`, {
    method: 'POST',
    headers: {
      'apikey': apiKey,
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(record),
  });

  return response.ok;
}

async function updateLeadFirstContact(leadId) {
  const apiKey = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;

  const response = await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${leadId}`, {
    method: 'PATCH',
    headers: {
      'apikey': apiKey,
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ first_contact_at: new Date().toISOString() }),
  });

  return response.ok;
}

// =============================================================================
// EMAIL TEMPLATE (inline to avoid import issues)
// =============================================================================

function generatePortalUpgradeEmail(data) {
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
          <a href="https://wa.me/35679055156" class="whatsapp-link">WhatsApp us: +356 7905 5156</a>
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

Questions? WhatsApp us: +356 7905 5156

Your solar is waiting,
The GhawdeX Team

---
GhawdeX Solar | 14-Day Installation Guarantee | get.ghawdex.pro
${data.unsubscribeUrl ? `Unsubscribe: ${data.unsubscribeUrl}` : ''}
  `.trim();

  return { subject, html, text };
}

// =============================================================================
// ZOHO CRM EMAIL SENDING
// =============================================================================

let cachedAccessToken = null;
let tokenExpiry = 0;

async function getZohoAccessToken() {
  // Return cached token if still valid
  if (cachedAccessToken && Date.now() < tokenExpiry) {
    return cachedAccessToken;
  }

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
  if (!data.access_token) {
    throw new Error(`Failed to get Zoho token: ${JSON.stringify(data)}`);
  }

  cachedAccessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // Refresh 1 min early
  return cachedAccessToken;
}

async function sendEmailViaZoho(zohoLeadId, toEmail, subject, html) {
  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
    throw new Error('Zoho CRM credentials not configured');
  }

  const token = await getZohoAccessToken();

  const response = await fetch(`${ZOHO_API_DOMAIN}/crm/v2/Leads/${zohoLeadId}/actions/send_mail`, {
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
        to: [{ email: toEmail }],
        subject,
        content: html,
        mail_format: 'html',
      }],
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(result));
  }

  // Check for Zoho-specific errors
  if (result.data && result.data[0] && result.data[0].code === 'SUCCESS') {
    return result.data[0].details?.id || 'sent';
  }

  if (result.data && result.data[0] && result.data[0].code !== 'SUCCESS') {
    throw new Error(result.data[0].message || result.data[0].code);
  }

  return 'sent';
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('PORTAL UPGRADE CAMPAIGN - Cold Lead Reactivation');
  console.log('='.repeat(70));

  // Safety check for credentials
  if (!SUPABASE_ANON_KEY && !SUPABASE_SERVICE_KEY) {
    console.error('\nERROR: No Supabase credentials found in .env.local');
    process.exit(1);
  }

  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
    console.error('\nERROR: Zoho CRM credentials not found in .env.local');
    console.error('Required: ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN');
    process.exit(1);
  }

  // Handle test email mode - find lead by email in Supabase first
  if (testEmail) {
    console.log(`\n[TEST MODE] Looking up lead for: ${testEmail}`);

    // Find the lead in Supabase to get Zoho ID
    const apiKey = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/leads?email=eq.${encodeURIComponent(testEmail)}&select=id,name,email,phone,locality,zoho_lead_id&limit=1`,
      {
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );
    const leads = await response.json();

    if (!leads || leads.length === 0) {
      console.error(`\nERROR: No lead found with email: ${testEmail}`);
      console.log('The lead must exist in Supabase with a zoho_lead_id to receive emails.');
      process.exit(1);
    }

    const lead = leads[0];
    if (!lead.zoho_lead_id) {
      console.error(`\nERROR: Lead found but has no zoho_lead_id`);
      console.log('The lead must be synced to Zoho CRM first.');
      process.exit(1);
    }

    console.log(`Found lead: ${lead.name} (Zoho ID: ${lead.zoho_lead_id})`);

    const testData = {
      name: lead.name || 'there',
      portalUrl: buildPortalUrl(lead),
      unsubscribeUrl: buildUnsubscribeUrl(lead.id),
      isGozo: isGozoLocation(lead),
    };

    const { subject, html } = generatePortalUpgradeEmail(testData);

    try {
      await sendEmailViaZoho(lead.zoho_lead_id, lead.email, subject, html);
      console.log('\nTest email sent successfully via Zoho CRM!');
      console.log(`Check inbox: ${testEmail}`);
    } catch (err) {
      console.error(`\nFailed to send: ${err.message}`);
    }
    return;
  }

  // Fetch eligible leads
  console.log('\nFetching eligible leads from Supabase...');
  let leads;
  try {
    leads = await fetchEligibleLeads();
  } catch (err) {
    console.error(`\nFailed to fetch leads: ${err.message}`);
    process.exit(1);
  }

  // Apply limit if specified
  if (limit && limit > 0) {
    leads = leads.slice(0, limit);
  }

  console.log(`\nFound ${leads.length} eligible leads${limit ? ` (limited to ${limit})` : ''}`);

  if (leads.length === 0) {
    console.log('No eligible leads to contact.');
    return;
  }

  // DRY RUN MODE (DEFAULT)
  if (isDryRun) {
    console.log('\n' + '-'.repeat(70));
    console.log('DRY RUN MODE - No emails will be sent');
    console.log('-'.repeat(70));
    console.log('\nEligible leads preview:\n');

    leads.forEach((lead, i) => {
      const daysOld = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24));
      const isGozo = isGozoLocation(lead);
      console.log(`  ${i + 1}. ${lead.name || 'Unknown'}`);
      console.log(`     Email: ${lead.email}`);
      console.log(`     Phone: ${lead.phone || 'N/A'}`);
      console.log(`     Location: ${lead.locality || 'Unknown'}${isGozo ? ' (GOZO)' : ''}`);
      console.log(`     Age: ${daysOld} days old`);
      console.log(`     Portal URL: ${buildPortalUrl(lead)}`);
      console.log('');
    });

    console.log('-'.repeat(70));
    console.log('To actually send emails, run with --send flag:');
    console.log('  node scripts/send-portal-upgrade-campaign.mjs --send');
    console.log('  node scripts/send-portal-upgrade-campaign.mjs --send --limit 5');
    console.log('-'.repeat(70));
    return;
  }

  // SEND MODE - Requires explicit confirmation
  console.log('\n' + '!'.repeat(70));
  console.log('WARNING: You are about to send REAL emails to REAL customers!');
  console.log('!'.repeat(70));
  console.log(`\nTotal leads to contact: ${leads.length}`);
  console.log('\nPress Ctrl+C NOW to abort, or wait 5 seconds to continue...\n');

  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('Starting campaign...\n');

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    const progress = `[${i + 1}/${leads.length}]`;

    if (!lead.email) {
      console.log(`${progress} SKIP: ${lead.name || 'Unknown'} - No email`);
      skipped++;
      continue;
    }

    if (!lead.zoho_lead_id) {
      console.log(`${progress} SKIP: ${lead.name || 'Unknown'} - No Zoho ID`);
      skipped++;
      continue;
    }

    const portalUrl = buildPortalUrl(lead);
    const unsubscribeUrl = buildUnsubscribeUrl(lead.id);
    const isGozo = isGozoLocation(lead);

    const emailData = {
      name: lead.name || 'there',
      portalUrl,
      unsubscribeUrl,
      isGozo,
    };

    const { subject, html } = generatePortalUpgradeEmail(emailData);

    try {
      console.log(`${progress} Sending to: ${lead.name || 'Unknown'} <${lead.email}>`);

      const messageId = await sendEmailViaZoho(lead.zoho_lead_id, lead.email, subject, html);

      // Log communication
      await logCommunication(lead.id, 'sent', messageId);

      // Update first_contact_at
      await updateLeadFirstContact(lead.id);

      console.log(`${progress} SENT`);
      sent++;

      // Rate limiting
      if (i < leads.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_EMAILS_MS));
      }
    } catch (err) {
      console.log(`${progress} FAILED: ${err.message}`);
      await logCommunication(lead.id, 'failed', null);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('CAMPAIGN COMPLETE');
  console.log('='.repeat(70));
  console.log(`  Sent:    ${sent}`);
  console.log(`  Failed:  ${failed}`);
  console.log(`  Skipped: ${skipped}`);
  console.log('='.repeat(70) + '\n');
}

main().catch(console.error);
