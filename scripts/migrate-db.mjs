import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lccebuetwhezxpviyfrs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjY2VidWV0d2hlenhwdml5ZnJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQzNDYyNiwiZXhwIjoyMDgwMDEwNjI2fQ.rYBPHTCSLZMtYCa-YfjlIQoDTxA1Bkd6sUy8gVqst-w'
);

console.log('Running database migrations...');

// Test connection first
const { data: testData, error: testError } = await supabase.from('leads').select('id').limit(1);
if (testError) {
  console.error('Connection test failed:', testError.message);
  process.exit(1);
}
console.log('Connection OK');

// Check if columns already exist by trying to select them
const { error: checkError } = await supabase.from('leads').select('grant_type').limit(1);

if (checkError && checkError.message.includes('does not exist')) {
  console.log('Columns do not exist yet. Please run the following SQL in Supabase Dashboard:');
  console.log(`
-- Run in Supabase Dashboard > SQL Editor

ALTER TABLE leads ADD COLUMN IF NOT EXISTS grant_type TEXT DEFAULT 'pv_only';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS grant_amount NUMERIC DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS proposal_file_url TEXT;

-- Create proposals storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('proposals', 'proposals', true)
ON CONFLICT (id) DO NOTHING;
`);
  process.exit(1);
} else if (checkError) {
  console.error('Unexpected error:', checkError.message);
  process.exit(1);
} else {
  console.log('✅ Columns already exist! Migration not needed.');
}

// Check proposals bucket
const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
if (bucketsError) {
  console.error('Failed to check buckets:', bucketsError.message);
} else {
  const proposalsBucket = buckets?.find(b => b.name === 'proposals');
  if (proposalsBucket) {
    console.log('✅ Proposals bucket exists');
  } else {
    console.log('⚠️ Proposals bucket does not exist. Create it in Supabase Dashboard > Storage');
  }
}
