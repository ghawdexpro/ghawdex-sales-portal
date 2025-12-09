import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = {};
readFileSync('.env.local', 'utf-8').split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data } = await supabase.from('leads').select('*').eq('email', 'ghawdex.pro@gmail.com').order('created_at', { ascending: false }).limit(1);

if (data?.[0]) {
  const l = data[0];
  console.log('\n✅ YES! Found lead:\n');
  console.log('Name:', l.name);
  console.log('ID:', l.id);
  console.log('Zoho ID:', l.zoho_lead_id || '❌ MISSING');
  console.log('Opted Out:', l.email_opted_out ? '❌ YES' : '✅ NO');
  console.log('\nBackoffice: https://bo.ghawdex.pro/dashboard/customers/' + l.id);
  console.log('\n' + (l.zoho_lead_id ? '✅ Can send email!' : '⚠️  Need Zoho Lead ID first'));
} else {
  console.log('❌ Not found');
}
