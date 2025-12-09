import { createClient } from '@supabase/supabase-js';
import { sendFollowUpEmail } from '../src/lib/email/index.js';
import { readFileSync } from 'fs';
import crypto from 'crypto';

// Load env
const env = {};
readFileSync('.env.local', 'utf-8').split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Find lead
const { data: leads } = await supabase
  .from('leads')
  .select('*')
  .eq('email', 'admin@ghawdex.pro')
  .order('created_at', { ascending: false })
  .limit(1);

if (!leads || leads.length === 0) {
  console.log('❌ Lead not found with email: admin@ghawdex.pro');
  process.exit(1);
}

const lead = leads[0];
console.log('\n✅ Found lead:', lead.name);
console.log('Email:', lead.email);
console.log('Zoho Lead ID:', lead.zoho_lead_id);

if (!lead.zoho_lead_id) {
  console.log('\n❌ Cannot send - no Zoho Lead ID');
  console.log('Create lead in Zoho CRM first');
  process.exit(1);
}

// Generate HMAC token
function generateToken(leadId) {
  const secret = env.PORTAL_CONTRACT_SECRET || env.CRON_SECRET;
  const timestamp = Date.now().toString();
  const payload = `${leadId}:${timestamp}`;
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex').substring(0, 16);
  return Buffer.from(payload).toString('base64url') + '.' + hmac;
}

const token = generateToken(lead.id);
const backofficeUrl = env.BACKOFFICE_URL || 'https://bo.ghawdex.pro';
const portalUrl = env.NEXT_PUBLIC_PORTAL_URL || 'https://get.ghawdex.pro';

const emailData = {
  name: lead.name,
  quoteRef: `GX-${lead.id.slice(0, 8).toUpperCase()}`,
  systemSize: lead.system_size_kw || 5,
  batterySize: lead.battery_size_kwh || 10,
  annualSavings: lead.annual_savings || 1800,
  totalPrice: lead.total_price || 13000,
  grantAmount: lead.grant_amount || 9875,
  netCost: (lead.total_price || 13000) - (lead.grant_amount || 9875),
  pvGrant: 2750,
  batteryGrant: (lead.is_gozo ?? true) ? 7125 : 6000,
  isGozo: lead.is_gozo ?? true,
  panelCount: 11,
  contractSigningUrl: `${backofficeUrl}/sign/lead/${lead.id}?t=${token}`,
  unsubscribeUrl: `${portalUrl}/api/unsubscribe?lead=${lead.id}&token=${token}`,
  salesPhone: '+356 7905 5156',
};

const templates = ['follow-up-24h', 'follow-up-48h', 'follow-up-72h', 'follow-up-7d'];

console.log('\n📧 Sending all 4 emails to:', lead.email);
console.log('');

for (const template of templates) {
  console.log(`Sending ${template}...`);

  const result = await sendFollowUpEmail(lead.zoho_lead_id, template, emailData);

  if (result.success) {
    console.log(`  ✅ Sent! Message ID: ${result.messageId}`);

    // Log to communications
    await supabase.from('communications').insert({
      lead_id: lead.id,
      channel: 'email',
      direction: 'outbound',
      template_used: template,
      status: 'sent',
      subject: `Test: ${template}`,
      external_message_id: result.messageId,
    });
  } else {
    console.log(`  ❌ Failed: ${result.error}`);
  }

  // Wait 2 seconds between emails
  await new Promise(resolve => setTimeout(resolve, 2000));
}

console.log('\n✅ All 4 emails sent to admin@ghawdex.pro via Zoho CRM!');
console.log('Check your inbox for:');
console.log('  1. Day 1: GOLD Quote Reveal');
console.log('  2. Day 2: Social Proof (installations)');
console.log('  3. Day 3: RED Urgency (money lost)');
console.log('  4. Day 7: Final Notice (soft close)');
