/**
 * Avatar Message API
 *
 * Endpoint for processing conversation messages and generating avatar responses.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionManager, ConversationEngine } from '@/lib/avatar';

// POST /api/avatar/message - Process user message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, message, event_type } = body;

    if (!session_id) {
      return NextResponse.json(
        { success: false, error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Get session
    const sessionManager = getSessionManager();
    const session = await sessionManager.getSession(session_id);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Initialize conversation engine with session
    const engine = new ConversationEngine(session);

    let response;

    switch (event_type) {
      case 'greeting':
        // Generate initial greeting
        response = {
          text: await engine.generateGreeting(),
          phase: session.current_phase,
          function_calls: [],
        };
        break;

      case 'silence':
        // Handle user silence
        response = {
          text: await engine.handleSilence(),
          phase: session.current_phase,
          function_calls: [],
        };
        break;

      case 'data_received':
        // Handle data submission from micro-app
        const { data_type, data } = body;
        response = {
          text: await engine.handleDataReceived(data_type, data),
          phase: engine.getState().phase,
          function_calls: [],
        };
        break;

      case 'message':
      default:
        // Process regular user message
        if (!message) {
          return NextResponse.json(
            { success: false, error: 'Message required' },
            { status: 400 }
          );
        }

        const result = await engine.processUserMessage(message);
        response = {
          text: result.response,
          phase: result.phase,
          function_calls: result.functionCalls,
          should_speak: result.shouldSpeak,
        };
        break;
    }

    // Update session with new conversation state
    await sessionManager.updateSession(session_id, {
      conversation_history: engine.getHistory(),
      current_phase: response.phase,
      collected_data: engine.getState().collected_data,
    });

    return NextResponse.json({
      success: true,
      response: response.text,
      phase: response.phase,
      function_calls: response.function_calls || [],
      should_speak: response.should_speak ?? true,
      state: engine.getState(),
    });
  } catch (error) {
    console.error('Failed to process message:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process message',
      },
      { status: 500 }
    );
  }
}
