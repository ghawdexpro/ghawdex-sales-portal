/**
 * Avatar Session API
 *
 * Endpoints for creating, retrieving, and managing avatar chat sessions.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getSessionManager,
  parsePrefillFromUrl,
  getDeviceInfo,
} from '@/lib/avatar';

// POST /api/avatar/session - Create new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { prefillData, source } = body;

    // Get device info from headers
    const deviceInfo = getDeviceInfo(request.headers);

    // Create session
    const sessionManager = getSessionManager();
    const session = await sessionManager.createSession({
      prefillData: prefillData || null,
      source: source || 'website',
      deviceInfo,
    });

    // Generate HeyGen access token
    const heygenToken = await generateHeyGenToken();

    return NextResponse.json({
      success: true,
      session_id: session.id,
      resume_token: session.resume_token,
      current_phase: session.current_phase,
      collected_data: session.collected_data,
      heygen: {
        token: heygenToken,
      },
    });
  } catch (error) {
    console.error('Failed to create session:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create session',
      },
      { status: 500 }
    );
  }
}

// GET /api/avatar/session?id=xxx or ?token=xxx - Get session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');
    const resumeToken = searchParams.get('token');

    const sessionManager = getSessionManager();
    let session;

    if (sessionId) {
      session = await sessionManager.getSession(sessionId);
    } else if (resumeToken) {
      session = await sessionManager.getSessionByResumeToken(resumeToken);
    } else {
      return NextResponse.json(
        { success: false, error: 'Session ID or resume token required' },
        { status: 400 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Generate new HeyGen token for resumed sessions
    const heygenToken = await generateHeyGenToken();

    return NextResponse.json({
      success: true,
      session,
      heygen: {
        token: heygenToken,
      },
    });
  } catch (error) {
    console.error('Failed to get session:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get session',
      },
      { status: 500 }
    );
  }
}

// PATCH /api/avatar/session - Update session
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, updates } = body;

    if (!session_id) {
      return NextResponse.json(
        { success: false, error: 'Session ID required' },
        { status: 400 }
      );
    }

    const sessionManager = getSessionManager();
    const session = await sessionManager.updateSession(session_id, updates);

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Failed to update session:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update session',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate HeyGen access token
 */
async function generateHeyGenToken(): Promise<string | null> {
  const apiKey = process.env.HEYGEN_API_KEY;

  if (!apiKey) {
    console.warn('HEYGEN_API_KEY not configured');
    return null;
  }

  try {
    const response = await fetch('https://api.heygen.com/v1/streaming.create_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('HeyGen token error:', error);
      return null;
    }

    const data = await response.json();
    return data.data?.token || null;
  } catch (error) {
    console.error('Failed to generate HeyGen token:', error);
    return null;
  }
}
