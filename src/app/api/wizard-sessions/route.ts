import { NextRequest, NextResponse } from 'next/server';
import {
  createWizardSession,
  getWizardSessionByToken,
  updateWizardSession,
  markSessionCompleted,
  markSessionConvertedToLead,
  getWizardSessionStats,
  getWizardDropoffAnalysis,
  getAbandonedSessions,
  markAbandonedSessions,
} from '@/lib/wizard-session';

// POST: Create new wizard session or update existing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_token, action, ...data } = body;

    if (!session_token) {
      return NextResponse.json(
        { error: 'session_token is required' },
        { status: 400 }
      );
    }

    // Check for existing session
    let session = await getWizardSessionByToken(session_token);

    if (session) {
      // Update existing session
      const updated = await updateWizardSession(session.id!, data);
      return NextResponse.json({
        success: true,
        session: updated,
        is_new: false,
      });
    } else {
      // Create new session
      const newSession = await createWizardSession(session_token, data);
      return NextResponse.json({
        success: true,
        session: newSession,
        is_new: true,
      });
    }
  } catch (error) {
    console.error('Wizard session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: Update wizard session
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, action, ...updates } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      );
    }

    // Handle special actions
    if (action === 'complete') {
      const result = await markSessionCompleted(session_id);
      return NextResponse.json({ success: result });
    }

    if (action === 'convert_to_lead') {
      if (!updates.lead_id) {
        return NextResponse.json(
          { error: 'lead_id is required for convert_to_lead action' },
          { status: 400 }
        );
      }
      const result = await markSessionConvertedToLead(session_id, updates.lead_id);
      return NextResponse.json({ success: result });
    }

    // Regular update
    const session = await updateWizardSession(session_id, updates);

    if (!session) {
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Wizard session update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET: Get session by token or analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const analytics = searchParams.get('analytics');
    const abandoned = searchParams.get('abandoned');

    // Get session by token
    if (token) {
      const session = await getWizardSessionByToken(token);
      if (!session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ session });
    }

    // Get analytics
    if (analytics === 'stats') {
      const stats = await getWizardSessionStats();
      return NextResponse.json({ stats });
    }

    if (analytics === 'dropoff') {
      const dropoff = await getWizardDropoffAnalysis();
      return NextResponse.json({ dropoff });
    }

    // Get abandoned sessions
    if (abandoned === 'true') {
      const minStep = searchParams.get('min_step');
      const limit = searchParams.get('limit');
      const hasAddress = searchParams.get('has_address');

      const sessions = await getAbandonedSessions({
        minStep: minStep ? parseInt(minStep) : undefined,
        limit: limit ? parseInt(limit) : 50,
        hasAddress: hasAddress === 'true',
      });

      return NextResponse.json({ sessions });
    }

    return NextResponse.json(
      { error: 'Provide token, analytics, or abandoned parameter' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Wizard session fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
