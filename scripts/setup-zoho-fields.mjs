/**
 * Setup Zoho CRM custom fields for Google Maps Link
 * Run with: node scripts/setup-zoho-fields.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env.local manually
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;
const ZOHO_ACCOUNTS_URL = process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.eu';
const ZOHO_API_DOMAIN = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.eu';

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
  if (!data.access_token) {
    throw new Error(`Token refresh failed: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

async function getExistingFields(accessToken) {
  const response = await fetch(`${ZOHO_API_DOMAIN}/crm/v2/settings/fields?module=Leads`, {
    headers: { 'Authorization': `Zoho-oauthtoken ${accessToken}` },
  });
  const data = await response.json();
  return data.fields || [];
}

async function createField(accessToken, fieldConfig) {
  const response = await fetch(`${ZOHO_API_DOMAIN}/crm/v2/settings/fields?module=Leads`, {
    method: 'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields: [fieldConfig] }),
  });
  const data = await response.json();
  return data;
}

async function main() {
  console.log('🔧 Setting up Zoho CRM fields...\n');

  if (!ZOHO_CLIENT_ID || !ZOHO_REFRESH_TOKEN) {
    console.error('❌ Zoho credentials not configured in environment');
    process.exit(1);
  }

  // Get access token
  console.log('1. Getting access token...');
  const accessToken = await getAccessToken();
  console.log('   ✅ Token obtained\n');

  // Get existing fields
  console.log('2. Fetching existing Leads fields...');
  const fields = await getExistingFields(accessToken);
  console.log(`   Found ${fields.length} fields\n`);

  // Check for Google_Maps_Link field
  const googleMapsField = fields.find(f =>
    f.api_name === 'Google_Maps_Link' ||
    f.field_label?.toLowerCase().includes('google maps')
  );

  if (googleMapsField) {
    console.log('✅ Google_Maps_Link field already exists:');
    console.log(`   - API Name: ${googleMapsField.api_name}`);
    console.log(`   - Label: ${googleMapsField.field_label}`);
    console.log(`   - Type: ${googleMapsField.data_type}`);
    console.log(`   - ID: ${googleMapsField.id}`);
  } else {
    console.log('3. Creating Google_Maps_Link field...');

    const result = await createField(accessToken, {
      field_label: 'Google Maps Link',
      data_type: 'website',  // URL field type in Zoho
      length: 500,
      visible: true,
      read_only: false,
      api_name: 'Google_Maps_Link',
    });

    if (result.fields?.[0]?.status === 'success') {
      console.log('   ✅ Field created successfully!');
      console.log(`   - ID: ${result.fields[0].details.id}`);
    } else {
      console.log('   ⚠️  Field creation response:', JSON.stringify(result, null, 2));
      console.log('\n   Note: If you see "FIELD_NOT_EDITABLE" error, the field might need');
      console.log('   to be created manually in Zoho CRM Settings > Modules > Leads.');
    }
  }

  // List all URL-type fields for reference
  console.log('\n📋 All URL-type fields in Leads module:');
  const urlFields = fields.filter(f => f.data_type === 'website');
  if (urlFields.length === 0) {
    console.log('   (none found)');
  } else {
    urlFields.forEach(f => {
      console.log(`   - ${f.field_label} (${f.api_name})`);
    });
  }

  // Check for our other custom fields
  console.log('\n📋 Checking for other Sales Portal custom fields:');
  const customFieldNames = [
    'Google_Maps_Link',
    'Install_Coordinates',
    'System_Size',
    'Quote_Amount',
    'Grant_Type',
    'Grant_Amount_EUR',
    'Monthly_Bill',
    'Panel_Brand',
    'Battery_Size',
  ];

  for (const apiName of customFieldNames) {
    const field = fields.find(f => f.api_name === apiName);
    if (field) {
      console.log(`   ✅ ${apiName}: exists (${field.data_type})`);
    } else {
      console.log(`   ❌ ${apiName}: NOT FOUND`);
    }
  }

  console.log('\n✅ Done!');
}

main().catch(console.error);
