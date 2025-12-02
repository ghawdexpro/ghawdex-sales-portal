import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Use service role key to bypass RLS for storage uploads
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Max file size: 10MB (proposals are typically small PDFs)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const leadName = formData.get('lead_name') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Only accept PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF files are accepted.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Generate unique filename with customer name if provided
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const safeName = leadName
      ? leadName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)
      : 'customer';
    const filename = `proposal_${safeName}_${timestamp}_${randomId}.pdf`;

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Upload to Supabase Storage (proposals bucket)
    const uploadResponse = await fetch(
      `${SUPABASE_URL}/storage/v1/object/proposals/${filename}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY,
          'Content-Type': 'application/pdf',
          'x-upsert': 'true',
        },
        body: arrayBuffer,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Supabase proposal upload error:', errorText);

      // Check if bucket doesn't exist
      if (errorText.includes('Bucket not found')) {
        return NextResponse.json(
          { error: 'Storage bucket not configured. Run the SQL migration first.' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to upload proposal' },
        { status: 500 }
      );
    }

    // Construct public URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/proposals/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
    });
  } catch (error) {
    console.error('Proposal upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
