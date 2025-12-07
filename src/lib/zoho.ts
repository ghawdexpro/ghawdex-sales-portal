// Zoho CRM API client for direct lead creation/updates

/**
 * Normalize phone number for consistent matching
 * Handles Malta phone formats: +356 7912 3456, 356-79123456, 79123456, etc.
 */
export function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  let normalized = phone.replace(/\D/g, '');

  // If starts with 356, keep it; otherwise add 356 for Malta numbers
  if (!normalized.startsWith('356') && normalized.length === 8) {
    normalized = '356' + normalized;
  }

  return normalized;
}

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
  google_maps_link?: string | null;
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
  grant_type?: string;
  grant_amount?: number | null;
  proposal_file_url?: string | null;
  notes?: string | null;
  // Additional fields for sales team
  consumption_kwh?: number | null;
  monthly_payment?: number | null;
  roof_area?: number | null;
  household_size?: number | null;
  selected_system?: string | null;
  bill_file_url?: string | null;
  grant_path?: boolean;
  social_provider?: string | null;
  coordinates?: { lat: number; lng: number } | null;
  // Equipment details
  panel_brand?: string | null;
  panel_model?: string | null;
  panel_count?: number | null;
  panel_wattage?: number | null;
  inverter_brand?: string | null;
  inverter_model?: string | null;
  battery_brand?: string | null;
  battery_model?: string | null;
}

interface ZohoUpdateOptions {
  isHotLead?: boolean;  // Set Lead_Status to "Hot - Qualified"
}

export interface ZohoLeadSearchResult {
  id: string;
  type: 'lead' | 'contact';
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
function mapToZohoFields(lead: ZohoLeadData, options?: ZohoUpdateOptions): Record<string, unknown> {
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
    Google_Maps_URL: lead.google_maps_link || undefined,
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
    Grant_Type: lead.grant_type || undefined,
    Grant_Amount_EUR: lead.grant_amount || undefined,
    Quote_PDF_URL: lead.proposal_file_url || undefined,
    Grant_Path: lead.grant_path ?? undefined,
    Social_Provider: lead.social_provider || undefined,
    Install_Coordinates: lead.coordinates ? `${lead.coordinates.lat},${lead.coordinates.lng}` : undefined,
    // Equipment details
    Panel_Brand: lead.panel_brand || undefined,
    Panel_Model: lead.panel_model || undefined,
    Panel_Count: lead.panel_count || undefined,
    Panel_Wattage: lead.panel_wattage || undefined,
    Inverter_Brand: lead.inverter_brand || undefined,
    Inverter_Model: lead.inverter_model || undefined,
    Battery_Brand: lead.battery_brand || undefined,
    Battery_Model: lead.battery_model || undefined,
    // Hot lead status - set when Facebook lead completes wizard
    Lead_Status: options?.isHotLead ? 'Hot - Qualified' : undefined,
    // Customer notes
    Description: lead.notes || undefined,
    // Additional fields for sales team (mapped to existing Zoho fields)
    Monthly_Consumption_kWh: lead.consumption_kwh || undefined,
    Monthly_Payment_EUR: lead.monthly_payment || undefined,
    Available_Area_sqm: lead.roof_area || undefined,
    Household_Size: lead.household_size || undefined,
    Recommended_Package: lead.selected_system || undefined,
    Bill_Images_URL: lead.bill_file_url || undefined,
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
  apiDomain: string,
  options?: ZohoUpdateOptions
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
          ...mapToZohoFields(lead, options),
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
 * @param options.isHotLead - Set Lead_Status to "Hot - Qualified" for Facebook leads that complete wizard
 */
export async function updateZohoLead(
  zohoLeadId: string,
  lead: ZohoLeadData,
  options?: ZohoUpdateOptions
): Promise<boolean> {
  try {
    const accessToken = await getAccessToken();
    const apiDomain = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.eu';

    const zohoData = {
      ...mapToZohoFields(lead, options),
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
      return await updateContactByEmail(lead, accessToken, apiDomain, options);
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
 * @param options.isHotLead - Set Lead_Status to "Hot - Qualified" for Facebook leads
 */
export async function createOrUpdateZohoLead(
  lead: ZohoLeadData,
  options?: ZohoUpdateOptions
): Promise<string | null> {
  // Check if Zoho is configured
  if (!process.env.ZOHO_CLIENT_ID || !process.env.ZOHO_REFRESH_TOKEN) {
    console.log('Zoho CRM not configured, skipping');
    return null;
  }

  if (lead.zoho_lead_id) {
    // Update existing lead
    const success = await updateZohoLead(lead.zoho_lead_id, lead, options);
    return success ? lead.zoho_lead_id : null;
  } else {
    // Create new lead
    return await createZohoLead(lead);
  }
}

/**
 * Search for existing lead in Zoho CRM by multiple criteria
 * Priority: zoho_lead_id > email > phone > name
 * Also checks Contacts module in case lead was converted
 */
export async function findExistingZohoLead(criteria: {
  zoho_lead_id?: string | null;
  email?: string;
  phone?: string;
  name?: string;
}): Promise<ZohoLeadSearchResult | null> {
  // Check if Zoho is configured
  if (!process.env.ZOHO_CLIENT_ID || !process.env.ZOHO_REFRESH_TOKEN) {
    console.log('Zoho CRM not configured, skipping search');
    return null;
  }

  try {
    const accessToken = await getAccessToken();
    const apiDomain = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.eu';

    // 1. If we have zoho_lead_id, verify it exists
    if (criteria.zoho_lead_id) {
      try {
        const response = await fetch(
          `${apiDomain}/crm/v2/Leads/${criteria.zoho_lead_id}`,
          {
            headers: { 'Authorization': `Zoho-oauthtoken ${accessToken}` },
          }
        );
        if (response.ok) {
          console.log('Found existing lead by zoho_id:', criteria.zoho_lead_id);
          return { id: criteria.zoho_lead_id, type: 'lead' };
        }
      } catch {
        // Lead may have been converted or deleted, continue searching
        console.log('Lead ID not found, searching by other criteria...');
      }
    }

    // 2. Search by email in Leads
    if (criteria.email) {
      try {
        const emailSearch = await fetch(
          `${apiDomain}/crm/v2/Leads/search?email=${encodeURIComponent(criteria.email)}`,
          {
            headers: { 'Authorization': `Zoho-oauthtoken ${accessToken}` },
          }
        );
        const emailResult = await emailSearch.json();
        if (emailResult.data?.[0]?.id) {
          console.log('Found existing lead by email:', criteria.email);
          return { id: emailResult.data[0].id, type: 'lead' };
        }
      } catch {
        console.log('Email search failed, continuing...');
      }
    }

    // 3. Search by phone in Leads
    if (criteria.phone) {
      try {
        // Normalize phone for search
        const normalizedPhone = normalizePhone(criteria.phone);
        const phoneSearch = await fetch(
          `${apiDomain}/crm/v2/Leads/search?phone=${encodeURIComponent(normalizedPhone)}`,
          {
            headers: { 'Authorization': `Zoho-oauthtoken ${accessToken}` },
          }
        );
        const phoneResult = await phoneSearch.json();
        if (phoneResult.data?.[0]?.id) {
          console.log('Found existing lead by phone:', criteria.phone);
          return { id: phoneResult.data[0].id, type: 'lead' };
        }

        // Also try with original phone format
        if (normalizedPhone !== criteria.phone) {
          const originalPhoneSearch = await fetch(
            `${apiDomain}/crm/v2/Leads/search?phone=${encodeURIComponent(criteria.phone)}`,
            {
              headers: { 'Authorization': `Zoho-oauthtoken ${accessToken}` },
            }
          );
          const originalResult = await originalPhoneSearch.json();
          if (originalResult.data?.[0]?.id) {
            console.log('Found existing lead by original phone format:', criteria.phone);
            return { id: originalResult.data[0].id, type: 'lead' };
          }
        }
      } catch {
        console.log('Phone search failed, continuing...');
      }
    }

    // 4. Search by name using COQL (last resort, less reliable)
    if (criteria.name && criteria.name.trim().length > 2) {
      try {
        const nameParts = criteria.name.trim().split(' ');
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : criteria.name;
        // Escape single quotes in name
        const escapedLastName = lastName.replace(/'/g, "\\'");

        const coqlSearch = await fetch(`${apiDomain}/crm/v2/coql`, {
          method: 'POST',
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            select_query: `SELECT id FROM Leads WHERE Last_Name = '${escapedLastName}' LIMIT 1`
          }),
        });
        const coqlResult = await coqlSearch.json();
        if (coqlResult.data?.[0]?.id) {
          console.log('Found existing lead by name:', criteria.name);
          return { id: coqlResult.data[0].id, type: 'lead' };
        }
      } catch {
        console.log('Name search failed, continuing...');
      }
    }

    // 5. Check Contacts module (in case lead was converted)
    if (criteria.email) {
      try {
        const contactSearch = await fetch(`${apiDomain}/crm/v2/coql`, {
          method: 'POST',
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            select_query: `SELECT id FROM Contacts WHERE Email = '${criteria.email}'`
          }),
        });
        const contactResult = await contactSearch.json();
        if (contactResult.data?.[0]?.id) {
          console.log('Found existing contact (converted lead) by email:', criteria.email);
          return { id: contactResult.data[0].id, type: 'contact' };
        }
      } catch {
        console.log('Contact search failed');
      }
    }

    console.log('No existing lead/contact found in Zoho CRM');
    return null;
  } catch (error) {
    console.error('Error searching for existing Zoho lead:', error);
    return null;
  }
}
