import { NextRequest, NextResponse } from 'next/server';

const BACKOFFICE_URL = process.env.BACKOFFICE_URL || 'https://bo.ghawdex.pro';
const PORTAL_SECRET = process.env.PORTAL_CONTRACT_SECRET;

/**
 * POST /api/analyze-bill
 *
 * Proxy to backoffice analyze-quick endpoint.
 * Analyzes uploaded bill files using Gemini and returns extracted data
 * for auto-filling the contact form.
 *
 * Body: { billFileUrls: string[] }
 * Returns: {
 *   success: boolean,
 *   name?: string,
 *   locality?: string,
 *   meterNumber?: string,
 *   armsAccount?: string,
 *   consumptionKwh?: number,
 *   rawAnalysis?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Validate configuration
    if (!PORTAL_SECRET) {
      console.error('[analyze-bill] PORTAL_CONTRACT_SECRET not configured');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { billFileUrls } = body as { billFileUrls: string[] };

    if (!billFileUrls || !Array.isArray(billFileUrls) || billFileUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: 'billFileUrls array is required' },
        { status: 400 }
      );
    }

    console.log('[analyze-bill] Analyzing', billFileUrls.length, 'file(s)');

    // Call backoffice analyze-quick endpoint with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await fetch(`${BACKOFFICE_URL}/api/bills/analyze-quick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Portal-Secret': PORTAL_SECRET,
        },
        body: JSON.stringify({ billFileUrls }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[analyze-bill] Backoffice error:', response.status, errorText);
        return NextResponse.json(
          { success: false, error: 'Bill analysis failed' },
          { status: response.status }
        );
      }

      const data = await response.json();

      console.log('[analyze-bill] Analysis complete:', {
        hasName: !!data.name,
        hasMeter: !!data.meterNumber,
        hasAccount: !!data.armsAccount,
      });

      // Return the analysis result
      return NextResponse.json({
        success: data.success ?? true,
        name: data.name || null,
        locality: data.locality || null,
        meterNumber: data.meterNumber || null,
        armsAccount: data.armsAccount || null,
        consumptionKwh: data.consumptionKwh || null,
        rawAnalysis: data.rawAnalysis || null,
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('[analyze-bill] Request timed out');
        return NextResponse.json(
          { success: false, error: 'Analysis timed out' },
          { status: 504 }
        );
      }

      throw fetchError;
    }

  } catch (error) {
    console.error('[analyze-bill] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
