/**
 * Unsubscribe API Endpoint
 *
 * Handles email opt-out requests from follow-up emails.
 * Updates both Supabase (primary CRM) and Zoho CRM (parallel sync).
 *
 * GET /api/unsubscribe?lead={leadId}&token={hmacToken}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Lazy-initialized Supabase client
let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabase;
}

/**
 * Validate HMAC token (same algorithm as email-sequences cron)
 */
function validateUnsubscribeToken(leadId: string, token: string): boolean {
  const secret = process.env.PORTAL_CONTRACT_SECRET || process.env.CRON_SECRET;
  if (!secret || !token) return false;

  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [encodedPayload, providedHmac] = parts;
    const payload = Buffer.from(encodedPayload, 'base64url').toString();
    const payloadParts = payload.split(':');

    if (payloadParts.length !== 2) return false;
    const [payloadLeadId, timestamp] = payloadParts;

    // Verify lead ID matches
    if (payloadLeadId !== leadId) return false;

    // Verify timestamp is not too old (7 days max)
    const tokenTime = parseInt(timestamp);
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (now - tokenTime > sevenDays) return false;

    // Verify HMAC
    const expectedHmac = crypto.createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
      .substring(0, 16);

    return providedHmac === expectedHmac;
  } catch {
    return false;
  }
}

/**
 * Update Zoho CRM lead to mark as unsubscribed
 */
async function updateZohoOptOut(zohoLeadId: string): Promise<boolean> {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const apiDomain = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.eu';
  const accountsUrl = process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.eu';

  if (!clientId || !clientSecret || !refreshToken) {
    console.log('[Unsubscribe] Zoho not configured, skipping sync');
    return false;
  }

  try {
    // Get access token
    const tokenResponse = await fetch(`${accountsUrl}/oauth/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      console.error('[Unsubscribe] Failed to get Zoho token');
      return false;
    }

    // Update lead with Email_Opt_Out
    const updateResponse = await fetch(`${apiDomain}/crm/v2/Leads/${zohoLeadId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Zoho-oauthtoken ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [{
          id: zohoLeadId,
          Email_Opt_Out: true,
        }],
      }),
    });

    const updateResult = await updateResponse.json();
    console.log('[Unsubscribe] Zoho update result:', JSON.stringify(updateResult));
    return updateResponse.ok;
  } catch (error) {
    console.error('[Unsubscribe] Zoho update error:', error);
    return false;
  }
}

/**
 * Generate confirmation HTML page
 */
function generateConfirmationPage(success: boolean, name?: string): string {
  const firstName = name?.split(' ')[0] || 'there';

  if (success) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribed - GhawdeX Solar</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #0a0a0a; color: #ededed; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { max-width: 500px; margin: 0 auto; padding: 40px 20px; text-align: center; }
    .logo { font-size: 28px; font-weight: 700; margin-bottom: 30px; }
    .logo-red { color: #ce1126; }
    .logo-white { color: #ffffff; }
    .icon { font-size: 64px; margin-bottom: 20px; }
    h1 { font-size: 24px; margin: 0 0 15px; color: #ffffff; }
    p { color: #a0a0a0; margin: 0 0 20px; }
    .note { background: #1a1a1a; border-radius: 8px; padding: 20px; margin: 25px 0; }
    .note p { margin: 0; font-size: 14px; }
    a { color: #fbbf24; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <p class="logo"><span class="logo-red">Ghawdex</span> <span class="logo-white">Solar</span></p>
    <div class="icon">&#9989;</div>
    <h1>You've been unsubscribed</h1>
    <p>Hi ${firstName}, you won't receive any more follow-up emails from us.</p>
    <div class="note">
      <p>Changed your mind? Just reply to any previous email or contact us at <a href="tel:+35679055156">+356 7905 5156</a></p>
    </div>
    <p><a href="https://ghawdex.pro">Return to ghawdex.pro</a></p>
  </div>
</body>
</html>
    `.trim();
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribe Failed - GhawdeX Solar</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #0a0a0a; color: #ededed; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { max-width: 500px; margin: 0 auto; padding: 40px 20px; text-align: center; }
    .logo { font-size: 28px; font-weight: 700; margin-bottom: 30px; }
    .logo-red { color: #ce1126; }
    .logo-white { color: #ffffff; }
    .icon { font-size: 64px; margin-bottom: 20px; }
    h1 { font-size: 24px; margin: 0 0 15px; color: #ffffff; }
    p { color: #a0a0a0; margin: 0 0 20px; }
    .note { background: #1a1a1a; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 3px solid #ce1126; }
    .note p { margin: 0; font-size: 14px; }
    a { color: #fbbf24; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <p class="logo"><span class="logo-red">Ghawdex</span> <span class="logo-white">Solar</span></p>
    <div class="icon">&#10060;</div>
    <h1>Something went wrong</h1>
    <p>We couldn't process your unsubscribe request. The link may have expired.</p>
    <div class="note">
      <p>To unsubscribe, please contact us directly at <a href="mailto:admin@ghawdex.pro">admin@ghawdex.pro</a> or call <a href="tel:+35679055156">+356 7905 5156</a></p>
    </div>
    <p><a href="https://ghawdex.pro">Return to ghawdex.pro</a></p>
  </div>
</body>
</html>
  `.trim();
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const leadId = searchParams.get('lead');
  const token = searchParams.get('token');

  console.log('[Unsubscribe] Request for lead:', leadId);

  // Validate parameters
  if (!leadId || !token) {
    return new NextResponse(generateConfirmationPage(false), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Validate HMAC token
  if (!validateUnsubscribeToken(leadId, token)) {
    console.log('[Unsubscribe] Invalid token for lead:', leadId);
    return new NextResponse(generateConfirmationPage(false), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  try {
    // Get lead info first
    const { data: lead, error: fetchError } = await getSupabase()
      .from('leads')
      .select('id, name, email, zoho_lead_id, email_opted_out')
      .eq('id', leadId)
      .single();

    if (fetchError || !lead) {
      console.error('[Unsubscribe] Lead not found:', leadId);
      return new NextResponse(generateConfirmationPage(false), {
        status: 404,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Check if already opted out
    if (lead.email_opted_out) {
      console.log('[Unsubscribe] Lead already opted out:', leadId);
      return new NextResponse(generateConfirmationPage(true, lead.name), {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Update Supabase
    const { error: updateError } = await getSupabase()
      .from('leads')
      .update({
        email_opted_out: true,
        email_opted_out_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (updateError) {
      console.error('[Unsubscribe] Supabase update error:', updateError);
      return new NextResponse(generateConfirmationPage(false), {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    console.log('[Unsubscribe] Supabase updated for lead:', leadId);

    // Log to communications table
    await getSupabase().from('communications').insert({
      lead_id: leadId,
      channel: 'email',
      direction: 'inbound',
      template_used: 'unsubscribe',
      status: 'completed',
      subject: 'Unsubscribed from emails',
      content: 'Lead clicked unsubscribe link',
    }).then(res => {
      if (res.error) console.warn('[Unsubscribe] Failed to log communication:', res.error);
    });

    // Sync to Zoho CRM (parallel, don't block on failure)
    if (lead.zoho_lead_id) {
      updateZohoOptOut(lead.zoho_lead_id).then(success => {
        console.log('[Unsubscribe] Zoho sync:', success ? 'success' : 'failed');
      });
    }

    return new NextResponse(generateConfirmationPage(true, lead.name), {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('[Unsubscribe] Error:', error);
    return new NextResponse(generateConfirmationPage(false), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}
