#!/usr/bin/env node
/**
 * Migrate leads from Sales Portal DB to ghawdexpro's unified DB
 * Run: node scripts/migrate-leads.mjs
 */

const SOURCE_URL = "https://lccebuetwhezxpviyfrs.supabase.co";
const SOURCE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjY2VidWV0d2hlenhwdml5ZnJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzQ2MjYsImV4cCI6MjA4MDAxMDYyNn0.Zfl7pNWwhWcLbGnoFHk2twiTxNBMxubRNr7SMa_oKWQ";

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

async function insertLead(lead) {
  // Remove id to let target generate new UUID
  const { id, ...leadData } = lead;

  // Transform coordinates: JSONB → also populate lat/lng columns (target has both)
  if (leadData.coordinates && typeof leadData.coordinates === 'object') {
    leadData.coordinates_lat = leadData.coordinates.lat;
    leadData.coordinates_lng = leadData.coordinates.lng;
  }

  // Normalize source to match target DB constraint (only allows 'website')
  // Store original source in notes for traceability
  const originalSource = leadData.source || 'unknown';
  leadData.source = 'website';
  leadData.notes = leadData.notes
    ? `${leadData.notes}\n[Migrated from sales-portal, original source: ${originalSource}]`
    : `[Migrated from sales-portal, original source: ${originalSource}]`;

  const res = await fetch(`${TARGET_URL}/rest/v1/leads`, {
    method: 'POST',
    headers: {
      "apikey": TARGET_KEY,
      "Authorization": `Bearer ${TARGET_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    },
    body: JSON.stringify(leadData)
  });

  return res.json();
}

async function main() {
  console.log("=== Supabase Lead Migration ===\n");

  // Fetch source leads
  console.log("Fetching leads from Sales Portal...");
  const sourceLeads = await fetchLeads(SOURCE_URL, SOURCE_KEY);
  console.log(`Found ${sourceLeads.length} leads in source DB\n`);

  // Fetch existing target emails
  console.log("Fetching existing leads from target...");
  const targetLeads = await fetchLeads(TARGET_URL, TARGET_KEY);
  const existingEmails = new Set(targetLeads.map(l => l.email?.toLowerCase()).filter(Boolean));
  console.log(`Found ${targetLeads.length} existing leads in target DB\n`);

  // Migrate
  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const lead of sourceLeads) {
    const email = lead.email?.toLowerCase();

    // Skip if email already exists in target
    if (email && existingEmails.has(email)) {
      console.log(`SKIP: ${lead.name || 'No name'} (${email}) - already exists`);
      skipped++;
      continue;
    }

    try {
      const result = await insertLead(lead);
      if (result.error || result.message) {
        console.log(`ERROR: ${lead.name || 'No name'} - ${result.message || result.error}`);
        errors++;
      } else {
        console.log(`OK: ${lead.name || 'No name'} (${email || 'no email'}) -> ${result[0]?.id}`);
        migrated++;
        if (email) existingEmails.add(email); // Track to avoid duplicates within batch
      }
    } catch (e) {
      console.log(`ERROR: ${lead.name || 'No name'} - ${e.message}`);
      errors++;
    }
  }

  console.log(`\n=== Migration Complete ===`);
  console.log(`Migrated: ${migrated}`);
  console.log(`Skipped (duplicates): ${skipped}`);
  console.log(`Errors: ${errors}`);
}

main().catch(console.error);
