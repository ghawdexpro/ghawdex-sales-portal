// Zoho CRM API client for direct lead creation/updates

interface ZohoTokenResponse {
  access_token: string;
  expires_in: number;
  api_domain: string;
  token_type: string;
  error?: string;
}

interface ZohoLeadData {
  name: string;
  email: string;
  phone: string;
  address?: string;
  system_size_kw?: number | null;
  total_price?: number | null;
  annual_savings?: number | null;
  payment_method?: string | null;
  loan_term?: number | null;
  with_battery?: boolean;
  battery_size_kwh?: number | null;
  monthly_bill?: number | null;
  source?: string;
  zoho_lead_id?: string | null;
}

// Cache for access token
let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Get a valid access token, refreshing if needed
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 300000) {
    return cachedAccessToken;
  }

  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const accountsUrl = process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.eu';

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Zoho CRM credentials not configured');
  }

  const response = await fetch(`${accountsUrl}/oauth/v2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  const data: ZohoTokenResponse = await response.json();

  if (data.error || !data.access_token) {
    throw new Error(`Zoho token refresh failed: ${data.error || 'No access token'}`);
  }

  cachedAccessToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;

  return data.access_token;
}

/**
 * Map our lead data to Zoho CRM fields
 */
function mapToZohoFields(lead: ZohoLeadData): Record<string, unknown> {
  // Split full name into first and last
  const nameParts = lead.name.trim().split(' ');
  const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : '';
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : lead.name;

  return {
    First_Name: firstName || undefined,
    Last_Name: lastName,
    Email: lead.email,
    Phone: lead.phone,
    Street: lead.address || undefined,
    System_Size: lead.system_size_kw || undefined,
    Quote_Amount: lead.total_price || undefined,
    Annual_Savings: lead.annual_savings || undefined,
    Payment_Method: lead.payment_method || undefined,
    Loan_Term: lead.loan_term || undefined,
    With_Battery: lead.with_battery || false,
    Battery_Size: lead.battery_size_kwh || undefined,
    Monthly_Bill: lead.monthly_bill || undefined,
    Portal_Source: lead.source || 'sales-portal',
    Lead_Source: 'Sales Portal',
  };
}

/**
 * Create a new lead in Zoho CRM
 */
export async function createZohoLead(lead: ZohoLeadData): Promise<string | null> {
  try {
    const accessToken = await getAccessToken();
    const apiDomain = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.eu';

    const zohoData = mapToZohoFields(lead);

    const response = await fetch(`${apiDomain}/crm/v2/Leads`, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [zohoData],
        trigger: ['workflow'], // Trigger any Zoho workflows
      }),
    });

    const result = await response.json();

    if (result.data?.[0]?.status === 'success') {
      const zohoLeadId = result.data[0].details.id;
      console.log('Zoho lead created:', zohoLeadId);
      return zohoLeadId;
    } else {
      console.error('Zoho lead creation failed:', result);
      return null;
    }
  } catch (error) {
    console.error('Zoho CRM error:', error);
    return null;
  }
}

/**
 * Search for Contact by email and update it (used when Lead was converted)
 */
async function updateContactByEmail(
  lead: ZohoLeadData,
  accessToken: string,
  apiDomain: string
): Promise<boolean> {
  try {
    // Search for Contact by email using COQL
    const searchResponse = await fetch(`${apiDomain}/crm/v2/coql`, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        select_query: `SELECT id FROM Contacts WHERE Email = '${lead.email}'`
      }),
    });

    const searchResult = await searchResponse.json();

    if (!searchResult.data?.[0]?.id) {
      console.log('No Contact found with email:', lead.email);
      return false;
    }

    const contactId = searchResult.data[0].id;
    console.log('Found Contact (converted lead):', contactId);

    // Update the Contact
    const updateResponse = await fetch(`${apiDomain}/crm/v2/Contacts/${contactId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [{
          ...mapToZohoFields(lead),
          id: contactId,
        }],
        trigger: ['workflow'],
      }),
    });

    const updateResult = await updateResponse.json();

    if (updateResult.data?.[0]?.status === 'success') {
      console.log('Zoho Contact updated (converted lead):', contactId);
      return true;
    }

    console.error('Zoho Contact update failed:', updateResult);
    return false;
  } catch (error) {
    console.error('Error updating Contact:', error);
    return false;
  }
}

/**
 * Update an existing lead in Zoho CRM
 * Falls back to Contact update if Lead was converted
 */
export async function updateZohoLead(zohoLeadId: string, lead: ZohoLeadData): Promise<boolean> {
  try {
    const accessToken = await getAccessToken();
    const apiDomain = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.eu';

    const zohoData = {
      ...mapToZohoFields(lead),
      id: zohoLeadId,
    };

    const response = await fetch(`${apiDomain}/crm/v2/Leads`, {
      method: 'PUT',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [zohoData],
        trigger: ['workflow'],
      }),
    });

    const result = await response.json();

    // Success - Lead still exists
    if (result.data?.[0]?.status === 'success') {
      console.log('Zoho lead updated:', zohoLeadId);
      return true;
    }

    // Check if Lead was converted (record not found)
    const errorCode = result.data?.[0]?.code || result.code;
    if (errorCode === 'INVALID_DATA' || errorCode === 'INVALID_MODULE' || result.status === 'error') {
      console.log('Lead may have been converted, searching for Contact by email...');
      return await updateContactByEmail(lead, accessToken, apiDomain);
    }

    console.error('Zoho lead update failed:', result);
    return false;
  } catch (error) {
    console.error('Zoho CRM update error:', error);
    return false;
  }
}

/**
 * Create or update a lead in Zoho CRM based on whether zoho_lead_id exists
 */
export async function createOrUpdateZohoLead(lead: ZohoLeadData): Promise<string | null> {
  // Check if Zoho is configured
  if (!process.env.ZOHO_CLIENT_ID || !process.env.ZOHO_REFRESH_TOKEN) {
    console.log('Zoho CRM not configured, skipping');
    return null;
  }

  if (lead.zoho_lead_id) {
    // Update existing lead
    const success = await updateZohoLead(lead.zoho_lead_id, lead);
    return success ? lead.zoho_lead_id : null;
  } else {
    // Create new lead
    return await createZohoLead(lead);
  }
}
