#!/usr/bin/env node
/**
 * Migrate leads from Backoffice DB (kuoklfrqztafxtoghola) to ghawdexpro DB (epxeimwsheyttevwtjku)
 * Run: node scripts/migrate-backoffice-leads.mjs
 */

const SOURCE_URL = "https://kuoklfrqztafxtoghola.supabase.co";
const SOURCE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1b2tsZnJxenRhZnh0b2dob2xhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNTMzNDcsImV4cCI6MjA3OTYyOTM0N30.6ciVFXm3ckRgPbuO20BKaRTHkxXY8o_lWpCB6n_lXvQ";

const TARGET_URL = "https://epxeimwsheyttevwtjku.supabase.co";
const TARGET_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVweGVpbXdzaGV5dHRldnd0amt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMTA3MzcsImV4cCI6MjA3ODg4NjczN30.I_cQdlUy3fAXW6Gj-_EbML3p4wEarjA71MbN1Y4Wpx8";

async function fetchLeads(url, key) {
  const res = await fetch(`${url}/rest/v1/leads?select=*`, {
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`
    }
  });
  return res.json();
}

// Map backoffice fields to ghawdexpro fields
function mapLeadFields(lead) {
  return {
    // Core contact
    name: lead.name?.trim(),
    email: lead.email?.toLowerCase(),
    phone: lead.phone,

    // Address - map from backoffice format
    address: lead.address_billing || lead.raw_address_line1 || lead.bill_address,

    // System info
    system_size_kw: lead.system_size_kw || lead.system_size_kwp || lead.recommended_system_kwp,
    selected_system: lead.recommended_package,
    with_battery: lead.with_battery || false,
    battery_size_kwh: lead.battery_size_kwh || lead.battery_kwh,

    // Financials
    total_price: lead.total_price || lead.system_price,
    annual_savings: lead.annual_savings || lead.estimated_annual_savings_eur,
    monthly_payment: lead.monthly_payment,
    payment_method: lead.payment_method || lead.financing_type,
    loan_term: lead.loan_term || (lead.loan_term_years ? lead.loan_term_years * 12 : null),
    grant_path: lead.grant_path ?? true,

    // Consumption
    consumption_kwh: lead.average_monthly_consumption_kwh || lead.bill_consumption_kwh || lead.estimated_annual_kwh,
    monthly_bill: lead.average_monthly_bill || lead.bill_amount_eur || lead.current_bill,
    household_size: lead.household_size || lead.registered_persons,
    roof_area: lead.roof_area_m2 || lead.usable_area_m2,

    // Zoho - CRITICAL
    zoho_lead_id: lead.zoho_lead_id,

    // Metadata
    source: 'website', // Target DB constraint
    status: lead.status || 'new',
    google_maps_link: lead.google_maps_url,
    notes: lead.bill_ai_summary || null,

    // Timestamps
    created_at: lead.created_at,
    updated_at: lead.updated_at,
  };
}

async function upsertLead(lead) {
  const mappedLead = mapLeadFields(lead);

  // Remove null/undefined values
  Object.keys(mappedLead).forEach(key => {
    if (mappedLead[key] === null || mappedLead[key] === undefined) {
      delete mappedLead[key];
    }
  });

  const res = await fetch(`${TARGET_URL}/rest/v1/leads`, {
    method: 'POST',
    headers: {
      "apikey": TARGET_KEY,
      "Authorization": `Bearer ${TARGET_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    },
    body: JSON.stringify(mappedLead)
  });

  return res.json();
}

async function main() {
  console.log("=== Backoffice to ghawdexpro Lead Migration ===\n");

  // Fetch source leads
  console.log("Fetching leads from Backoffice DB (kuoklfrqztafxtoghola)...");
  const sourceLeads = await fetchLeads(SOURCE_URL, SOURCE_KEY);
  console.log(`Found ${sourceLeads.length} leads in source DB\n`);

  // Fetch existing target emails for deduplication
  console.log("Fetching existing leads from ghawdexpro DB...");
  const targetLeads = await fetchLeads(TARGET_URL, TARGET_KEY);
  const existingEmails = new Set(targetLeads.map(l => l.email?.toLowerCase()).filter(Boolean));
  const existingZohoIds = new Set(targetLeads.map(l => l.zoho_lead_id).filter(Boolean));
  console.log(`Found ${targetLeads.length} existing leads in target DB\n`);

  // Migrate
  let migrated = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const lead of sourceLeads) {
    const email = lead.email?.toLowerCase();
    const zohoId = lead.zoho_lead_id;

    // Skip test/garbage leads
    if (email && (email.includes('test') || email.includes('123') || email.includes('example.com') || email.includes('asasd'))) {
      console.log(`SKIP TEST: ${lead.name || 'No name'} (${email})`);
      skipped++;
      continue;
    }

    // Check if already exists
    const existsByEmail = email && existingEmails.has(email);
    const existsByZoho = zohoId && existingZohoIds.has(zohoId);

    if (existsByZoho) {
      // Update existing with Zoho ID to preserve the link
      try {
        const { id, ...updateData } = lead;
        const res = await fetch(`${TARGET_URL}/rest/v1/leads?zoho_lead_id=eq.${zohoId}`, {
          method: 'PATCH',
          headers: {
            "apikey": TARGET_KEY,
            "Authorization": `Bearer ${TARGET_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
          },
          body: JSON.stringify({ zoho_lead_id: zohoId })
        });
        console.log(`UPDATE ZOHO: ${lead.name} (${email}) - zoho_id: ${zohoId}`);
        updated++;
      } catch (e) {
        console.log(`ERROR UPDATE: ${lead.name} - ${e.message}`);
        errors++;
      }
    } else if (existsByEmail) {
      // Update existing by email - add zoho_lead_id if we have it
      if (zohoId) {
        try {
          const res = await fetch(`${TARGET_URL}/rest/v1/leads?email=eq.${encodeURIComponent(email)}`, {
            method: 'PATCH',
            headers: {
              "apikey": TARGET_KEY,
              "Authorization": `Bearer ${TARGET_KEY}`,
              "Content-Type": "application/json",
              "Prefer": "return=representation"
            },
            body: JSON.stringify({ zoho_lead_id: zohoId })
          });
          console.log(`UPDATE EMAIL: ${lead.name} (${email}) - added zoho_id: ${zohoId}`);
          updated++;
          existingZohoIds.add(zohoId);
        } catch (e) {
          console.log(`ERROR: ${lead.name} - ${e.message}`);
          errors++;
        }
      } else {
        console.log(`SKIP DUP: ${lead.name} (${email}) - already exists`);
        skipped++;
      }
    } else {
      // Create new lead
      try {
        const result = await upsertLead(lead);
        if (result.error || result.message) {
          console.log(`ERROR: ${lead.name} - ${result.message || result.error}`);
          errors++;
        } else {
          console.log(`NEW: ${lead.name} (${email || 'no email'}) -> ${result[0]?.id}`);
          migrated++;
          if (email) existingEmails.add(email);
          if (zohoId) existingZohoIds.add(zohoId);
        }
      } catch (e) {
        console.log(`ERROR: ${lead.name} - ${e.message}`);
        errors++;
      }
    }
  }

  console.log(`\n=== Migration Complete ===`);
  console.log(`New: ${migrated}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
}

main().catch(console.error);
