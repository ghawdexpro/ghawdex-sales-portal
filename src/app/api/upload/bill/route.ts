import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Use service role key to bypass RLS for storage uploads
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Max file size: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// Allowed file types (WebP removed - pdf-lib doesn't support it)
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
];

/**
 * Convert an image to PDF format (1:1 quality - image embedded at original dimensions)
 */
async function convertImageToPdf(
  imageBuffer: ArrayBuffer,
  mimeType: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Embed image based on type
  const image = mimeType === 'image/png'
    ? await pdfDoc.embedPng(imageBuffer)
    : await pdfDoc.embedJpg(imageBuffer);

  // Create page at exact image dimensions (1:1 quality)
  const page = pdfDoc.addPage([image.width, image.height]);
  page.drawImage(image, {
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
  });

  return pdfDoc.save();
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload JPG, PNG, or PDF.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 100MB.' },
        { status: 400 }
      );
    }

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Prepare final upload data
    let finalMimeType = file.type;
    let finalExtension = 'pdf';
    let uploadBody: Blob;

    // Convert images to PDF for unified format
    if (file.type.startsWith('image/')) {
      const pdfBytes = await convertImageToPdf(arrayBuffer, file.type);
      // Copy to new ArrayBuffer to ensure type compatibility
      const pdfBuffer = new ArrayBuffer(pdfBytes.length);
      new Uint8Array(pdfBuffer).set(pdfBytes);
      uploadBody = new Blob([pdfBuffer], { type: 'application/pdf' });
      finalMimeType = 'application/pdf';
    } else {
      // PDF pass-through
      uploadBody = new Blob([arrayBuffer], { type: file.type });
    }

    // Generate unique filename (always .pdf now)
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const filename = `bill_${timestamp}_${randomId}.${finalExtension}`;

    // Upload to Supabase Storage
    const uploadResponse = await fetch(
      `${SUPABASE_URL}/storage/v1/object/bills/${filename}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY,
          'Content-Type': finalMimeType,
          'x-upsert': 'true',
        },
        body: uploadBody,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Supabase upload error:', errorText);

      // Check if bucket doesn't exist
      if (errorText.includes('Bucket not found')) {
        return NextResponse.json(
          { error: 'Storage not configured. Please contact support.' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Construct public URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/bills/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
    });
  } catch (error) {
    console.error('Bill upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
