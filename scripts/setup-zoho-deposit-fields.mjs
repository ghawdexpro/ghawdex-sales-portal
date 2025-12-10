#!/usr/bin/env node

/**
 * Automated Zoho CRM Custom Field Setup
 * Creates deposit tracking fields for battery-only premium package
 *
 * Run: node scripts/setup-zoho-deposit-fields.mjs
 */

const ZOHO_API_BASE = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.eu';
const ZOHO_ACCOUNTS_URL = process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.eu';

// Get Zoho access token using refresh token
async function getZohoAccessToken() {
  const response = await fetch(
    `${ZOHO_ACCOUNTS_URL}/oauth/v2/token?` +
    `refresh_token=${process.env.ZOHO_REFRESH_TOKEN}&` +
    `client_id=${process.env.ZOHO_CLIENT_ID}&` +
    `client_secret=${process.env.ZOHO_CLIENT_SECRET}&` +
    `grant_type=refresh_token`,
    { method: 'POST' }
  );

  const data = await response.json();
  return data.access_token;
}

async function createCustomField(accessToken, fieldConfig) {
  const response = await fetch(`${ZOHO_API_BASE}/crm/v2/settings/fields?module=Leads`, {
    method: 'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: [fieldConfig]
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error(`❌ Failed to create field: ${fieldConfig.field_label}`);
    console.error(JSON.stringify(result, null, 2));
    return false;
  }

  console.log(`✅ Created field: ${fieldConfig.field_label}`);
  return true;
}

async function setupDepositFields() {
  console.log('🚀 Setting up Zoho CRM deposit tracking fields...\n');

  // Get access token
  const accessToken = await getZohoAccessToken();

  if (!accessToken) {
    console.error('❌ Failed to get Zoho access token');
    process.exit(1);
  }

  // Define custom fields for deposit tracking
  // Using exact Zoho API v8 schema from official docs
  const customFields = [
    {
      field_label: 'Deposit Amount',
      api_name: 'Deposit_Amount',
      data_type: 'currency',
      length: 16,
      decimal_place: 2,
      tooltip: {
        name: 'Info Icon',
        value: 'Min €799 deposit (30% or €799, whichever higher)',
      },
      currency: {
        rounding_option: 'normal',
        precision: 2,
      },
    },
    {
      field_label: 'Deposit Paid',
      api_name: 'Deposit_Paid',
      data_type: 'boolean',
      tooltip: {
        name: 'Info Icon',
        value: 'Has customer paid the initial deposit?',
      },
    },
    {
      field_label: 'Deposit Paid Date',
      api_name: 'Deposit_Paid_Date',
      data_type: 'date',
      tooltip: {
        name: 'Info Icon',
        value: 'When was the deposit received?',
      },
    },
    {
      field_label: 'Remaining Payment',
      api_name: 'Remaining_Payment_Amount',
      data_type: 'currency',
      length: 16,
      decimal_place: 2,
      tooltip: {
        name: 'Info Icon',
        value: 'Part 2 payment due when grant assigned',
      },
      currency: {
        rounding_option: 'normal',
        precision: 2,
      },
    },
    {
      field_label: 'Part 2 Paid',
      api_name: 'Remaining_Payment_Paid',
      data_type: 'boolean',
      tooltip: {
        name: 'Info Icon',
        value: 'Has Part 2 payment been received?',
      },
    },
    {
      field_label: 'Emergency Backup',
      api_name: 'Emergency_Backup_Included',
      data_type: 'boolean',
      tooltip: {
        name: 'Info Icon',
        value: '€350 whole house backup protection',
      },
    },
    {
      field_label: 'Payment Structure',
      api_name: 'Payment_Structure',
      data_type: 'picklist',
      pick_list_values: [
        { display_value: '2-Part (Deposit + Grant)', actual_value: '2-part' },
        { display_value: 'Full Payment', actual_value: 'full' },
        { display_value: 'BOV Financing', actual_value: 'financing' },
      ],
      tooltip: {
        name: 'Info Icon',
        value: 'How is customer paying?',
      },
    },
  ];

  // Create fields one by one
  let successCount = 0;
  let failCount = 0;

  for (const field of customFields) {
    const success = await createCustomField(accessToken, field);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // Rate limiting: wait 500ms between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n📊 RESULTS:');
  console.log(`✅ Successfully created: ${successCount} fields`);
  console.log(`❌ Failed to create: ${failCount} fields`);

  if (failCount > 0) {
    console.log('\n⚠️  Some fields may already exist or require manual setup in Zoho CRM UI');
  }

  console.log('\n🎉 Zoho CRM deposit tracking setup complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Log into Zoho CRM and verify fields appear in Leads module');
  console.log('2. Drag fields into Lead Details layout for visibility');
  console.log('3. Create Smart Filter: "Awaiting Deposit" (Deposit_Paid = false)');
  console.log('4. Set up automation: When Deposit_Paid = true → Send thank you email');
}

// Run setup
setupDepositFields().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
