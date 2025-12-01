/**
 * Hayden Avatar Chat - Main Entry Point
 *
 * Exports all avatar chat system components for easy importing.
 */

// Types
export * from './types';

// Configuration
export {
  ENV,
  HAYDEN_AVATAR,
  DEFAULT_SESSION_CONFIG,
  GEMINI_CONFIG,
  SYSTEM_PROMPT,
  AVATAR_TOOLS,
  CONVERSATION_CONFIG,
  LINK_TEMPLATES,
  MESSAGE_TEMPLATES,
  PHASE_TOOLS,
  getToolsForPhase,
} from './config';

// Conversation Engine
export { ConversationEngine, PHASE_PROMPTS } from './conversation-engine';

// Session Manager
export {
  SessionManager,
  getSessionManager,
  generateSessionId,
  parsePrefillFromUrl,
  getDeviceInfo,
} from './session-manager';

// Tools
export { executeToolCall } from './tools';
