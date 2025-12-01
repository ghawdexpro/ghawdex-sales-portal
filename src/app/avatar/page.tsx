'use client';

/**
 * HeyGen Avatar Chat Page
 *
 * Main entry point for the interactive avatar consultation.
 * Handles session creation, HeyGen avatar streaming, and conversation flow.
 */

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskType,
  VoiceEmotion,
} from '@heygen/streaming-avatar';

// ============================================================================
// Types
// ============================================================================

interface SessionData {
  session_id: string;
  resume_token: string;
  current_phase: string;
  heygen: {
    token: string | null;
  };
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ============================================================================
// Avatar Chat Component (wrapped in Suspense)
// ============================================================================

function AvatarChatContent() {
  const searchParams = useSearchParams();

  // State
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [currentPhase, setCurrentPhase] = useState('greeting');
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'fair' | 'poor'>('good');

  // Refs
  const avatarRef = useRef<StreamingAvatar | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // ============================================================================
  // Session Initialization
  // ============================================================================

  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check for resume token
      const resumeToken = searchParams.get('token');

      // Check for prefill params
      const prefillData = {
        name: searchParams.get('name'),
        email: searchParams.get('email'),
        phone: searchParams.get('phone'),
        zoho_lead_id: searchParams.get('zoho_id'),
        address: searchParams.get('address'),
        source: searchParams.get('source') || 'website',
      };

      const hasPrefilledData = Object.values(prefillData).some(v => v !== null);

      let sessionData: SessionData;

      if (resumeToken) {
        // Resume existing session
        const response = await fetch(`/api/avatar/session?token=${resumeToken}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to resume session');
        }

        sessionData = {
          session_id: data.session.id,
          resume_token: data.session.resume_token,
          current_phase: data.session.current_phase,
          heygen: data.heygen,
        };
      } else {
        // Create new session
        const response = await fetch('/api/avatar/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prefillData: hasPrefilledData ? prefillData : null,
            source: prefillData.source,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to create session');
        }

        sessionData = data;
      }

      setSession(sessionData);
      setCurrentPhase(sessionData.current_phase);

      // Initialize HeyGen avatar if token available
      if (sessionData.heygen.token) {
        await initializeAvatar(sessionData.heygen.token);
      } else {
        console.warn('HeyGen token not available - running in demo mode');
      }
    } catch (err) {
      console.error('Session initialization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // HeyGen Avatar Initialization
  // ============================================================================

  const initializeAvatar = async (token: string) => {
    try {
      const avatar = new StreamingAvatar({ token });
      avatarRef.current = avatar;

      // Set up event handlers
      avatar.on(StreamingEvents.STREAM_READY, (event) => {
        console.log('Avatar stream ready');
        setIsConnected(true);

        // Attach video stream
        if (videoRef.current && event.detail) {
          videoRef.current.srcObject = event.detail;
          videoRef.current.play().catch(console.error);
        }
      });

      avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log('Avatar stream disconnected');
        setIsConnected(false);
      });

      avatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
        setIsTalking(true);
      });

      avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        setIsTalking(false);
      });

      avatar.on(StreamingEvents.USER_START, () => {
        setIsListening(true);
      });

      avatar.on(StreamingEvents.USER_STOP, () => {
        setIsListening(false);
      });

      // Start avatar session
      const sessionConfig = await avatar.createStartAvatar({
        avatarName: 'Hayden_20241025', // Default public avatar
        quality: AvatarQuality.High,
        voice: {
          voiceId: 'en-US-GuyNeural',
          rate: 1.0,
          emotion: VoiceEmotion.FRIENDLY,
        },
        language: 'en',
      });

      console.log('Avatar session created:', sessionConfig);

      // Start voice chat mode
      await avatar.startVoiceChat();

      // Get initial greeting
      await requestGreeting();
    } catch (err) {
      console.error('Avatar initialization error:', err);
      setError('Failed to connect to avatar. Please refresh and try again.');
    }
  };

  // ============================================================================
  // Conversation Handling
  // ============================================================================

  const requestGreeting = async () => {
    if (!session) return;

    try {
      const response = await fetch('/api/avatar/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.session_id,
          event_type: 'greeting',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentPhase(data.phase);
        addMessage('assistant', data.response);

        // Make avatar speak
        if (avatarRef.current) {
          await avatarRef.current.speak({
            text: data.response,
            taskType: TaskType.REPEAT,
          });
        }
      }
    } catch (err) {
      console.error('Greeting error:', err);
    }
  };

  const sendMessage = useCallback(async (message: string) => {
    if (!session) return;

    addMessage('user', message);

    try {
      const response = await fetch('/api/avatar/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.session_id,
          event_type: 'message',
          message,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentPhase(data.phase);
        addMessage('assistant', data.response);

        // Make avatar speak
        if (avatarRef.current && data.should_speak) {
          await avatarRef.current.speak({
            text: data.response,
            taskType: TaskType.REPEAT,
          });
        }
      }
    } catch (err) {
      console.error('Message error:', err);
    }
  }, [session]);

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages(prev => [...prev, { role, content, timestamp: new Date() }]);
  };

  // ============================================================================
  // Control Functions
  // ============================================================================

  const handleInterrupt = async () => {
    if (avatarRef.current) {
      await avatarRef.current.interrupt();
    }
  };

  const handleEndSession = async () => {
    if (avatarRef.current) {
      await avatarRef.current.stopAvatar();
    }
    // Could redirect to summary page or wizard
    window.location.href = '/';
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-700">Connecting to your solar consultant...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={initializeSession}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100">
      {/* Header */}
      <header className="bg-white shadow-sm p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo/Ghawdex engineering logo.svg"
              alt="GhawdeX"
              className="h-8"
            />
            <span className="text-lg font-semibold text-gray-900">
              AI Solar Consultation
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Connection status */}
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Phase indicator */}
            <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
              {formatPhase(currentPhase)}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Avatar video */}
          <div className="lg:col-span-2">
            <div className="bg-black rounded-2xl overflow-hidden aspect-video relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Talking indicator */}
              {isTalking && (
                <div className="absolute bottom-4 left-4 px-3 py-1 bg-green-500 text-white rounded-full text-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  Speaking...
                </div>
              )}

              {/* Listening indicator */}
              {isListening && (
                <div className="absolute bottom-4 right-4 px-3 py-1 bg-blue-500 text-white rounded-full text-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  Listening...
                </div>
              )}

              {/* Demo mode overlay */}
              {!session?.heygen.token && (
                <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center">
                  <div className="text-center text-white p-8">
                    <div className="text-6xl mb-4">🎭</div>
                    <h3 className="text-xl font-bold mb-2">Demo Mode</h3>
                    <p className="text-gray-300">
                      HeyGen API key not configured.<br />
                      Avatar streaming is disabled.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="mt-4 flex items-center justify-center gap-4">
              <button
                onClick={handleInterrupt}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                disabled={!isTalking}
              >
                ⏸️ Interrupt
              </button>

              <button
                onClick={handleEndSession}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
              >
                End Session
              </button>
            </div>
          </div>

          {/* Chat transcript */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col h-[500px] lg:h-auto">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-900">Conversation</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <p className="text-gray-500 text-center text-sm">
                  Conversation will appear here...
                </p>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-xl ${
                      msg.role === 'user'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs opacity-60 mt-1">
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Text input (for debugging/fallback) */}
            <div className="p-4 border-t">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const input = form.elements.namedItem('message') as HTMLInputElement;
                  if (input.value.trim()) {
                    sendMessage(input.value.trim());
                    input.value = '';
                  }
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  name="message"
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Info cards */}
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl shadow">
            <div className="text-2xl mb-2">🎤</div>
            <h4 className="font-semibold text-gray-900">Voice Chat</h4>
            <p className="text-sm text-gray-600">
              Just speak naturally - your consultant understands and responds in real-time.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow">
            <div className="text-2xl mb-2">📱</div>
            <h4 className="font-semibold text-gray-900">Mobile Links</h4>
            <p className="text-sm text-gray-600">
              Links will be sent to your phone for location sharing and bill uploads.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow">
            <div className="text-2xl mb-2">⏸️</div>
            <h4 className="font-semibold text-gray-900">Pause Anytime</h4>
            <p className="text-sm text-gray-600">
              Need to step away? Your progress can be saved with a resume link.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function AvatarChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-700">Loading...</p>
        </div>
      </div>
    }>
      <AvatarChatContent />
    </Suspense>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatPhase(phase: string): string {
  const labels: Record<string, string> = {
    greeting: 'Getting Started',
    location: 'Property Location',
    waiting_location: 'Waiting for Location',
    bill: 'Electricity Bill',
    waiting_bill: 'Waiting for Bill',
    consumption: 'Energy Analysis',
    system_recommendation: 'System Options',
    system_selection: 'Choosing System',
    financing: 'Payment Options',
    contact: 'Contact Details',
    summary: 'Review & Summary',
    contract: 'Contract',
    waiting_signature: 'Awaiting Signature',
    completed: 'Complete!',
    paused: 'Paused',
    human_handoff: 'Team Callback',
  };

  return labels[phase] || phase;
}
