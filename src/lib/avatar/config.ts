/**
 * Hayden Avatar Chat - Configuration
 *
 * Central configuration for the avatar chat system including:
 * - HeyGen avatar settings
 * - Google Gemini settings
 * - Tool definitions for function calling
 * - Conversation parameters
 */

import { AvatarConfig, AvatarSessionConfig, Tool, ToolName } from './types';

// ============================================================================
// Environment Variables (to be set in .env.local)
// ============================================================================
// HEYGEN_API_KEY          - HeyGen Enterprise API key
// OPENROUTER_API_KEY      - OpenRouter API key (for Gemini)
// TWILIO_ACCOUNT_SID      - Twilio account SID
// TWILIO_AUTH_TOKEN       - Twilio auth token
// TWILIO_PHONE_NUMBER     - Twilio phone number for SMS
// TWILIO_WHATSAPP_NUMBER  - Twilio WhatsApp number

export const ENV = {
  HEYGEN_API_KEY: process.env.HEYGEN_API_KEY || '',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',
  TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER || '',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://get.ghawdex.pro',
};

// ============================================================================
// HeyGen Avatar Configuration
// ============================================================================

export const HAYDEN_AVATAR: AvatarConfig = {
  avatar_id: 'Hayden_20241025', // Default public avatar - replace with custom
  voice_id: 'en-US-GuyNeural', // Microsoft Azure voice - natural English
  quality: 'high',
  language: 'en',
  // knowledge_base_id will be set later if using HeyGen's built-in LLM
};

export const DEFAULT_SESSION_CONFIG: AvatarSessionConfig = {
  avatar_config: HAYDEN_AVATAR,
  idle_timeout_seconds: 300, // 5 minutes of inactivity before timeout prompt
  use_voice_chat: true,
  silence_prompt: true,      // Hayden prompts if user is silent too long
};

// ============================================================================
// Google Gemini Configuration (via OpenRouter)
// ============================================================================

export const GEMINI_CONFIG = {
  model: 'google/gemini-2.0-flash-001',
  max_tokens: 500,           // Keep responses concise for spoken dialogue
  temperature: 0.7,          // Balanced creativity
  top_p: 0.9,
};

// System prompt for the conversation AI
export const SYSTEM_PROMPT = `You are Hayden, a friendly and professional solar energy consultant for GhawdeX Engineering in Malta. You are having a real-time video conversation with a potential customer interested in solar panels.

## Your Personality
- Warm, approachable, and genuinely helpful
- Speak naturally like a real person - use contractions, occasional filler words ("well", "so")
- Keep responses SHORT (2-3 sentences max) since you're speaking out loud
- Be enthusiastic about solar energy but not pushy
- Acknowledge what the customer says before responding

## Your Knowledge
- Expert on Malta's solar market, electricity tariffs, and REWS 2025 grant schemes
- Know GhawdeX products: 3kW Starter, 5kW Essential, 10kW Performance, 15kW Max systems
- Understand Huawei inverters and LUNA batteries
- Can explain feed-in tariffs: €0.105/kWh with grant, €0.15/kWh without
- Aware of Gozo vs Malta differences (Gozo gets higher battery grants)

## Conversation Flow
1. GREETING: Welcome customer, explain you'll help them find the perfect solar solution
2. LOCATION: Ask for their property location (you'll send a link to their phone)
3. BILL/CONSUMPTION: Ask about their electricity bill or consumption
4. SYSTEM: Recommend appropriate system based on their needs
5. FINANCING: Discuss payment options (cash or BOV loan)
6. CONTACT: Get their contact details for the quote
7. SUMMARY: Review everything and next steps

## Important Rules
- NEVER make up numbers - use the calculate_quote tool for pricing
- If customer seems confused or wants to speak to a human, use create_human_task
- If connection seems poor, politely ask them to check their wifi
- Always confirm data before moving to the next step
- If you need to send a link (location, bill upload), announce it first

## Response Format
Keep responses conversational and brief. You are speaking out loud, not writing text.
Bad: "I would be happy to assist you with information about our solar panel systems and the various financing options available."
Good: "Great question! Let me explain our financing options - it's actually quite simple."`;

// ============================================================================
// Function Calling Tools
// ============================================================================

export const AVATAR_TOOLS: Tool[] = [
  {
    name: 'send_location_link',
    description: 'Send an SMS or WhatsApp link to the customer so they can share their property location via GPS or map selection. Use this when you need the customer\'s address.',
    parameters: {
      type: 'object',
      properties: {
        phone: {
          type: 'string',
          description: 'Customer phone number in international format (e.g., +35679123456)',
        },
        channel: {
          type: 'string',
          description: 'Delivery channel',
          enum: ['sms', 'whatsapp'],
        },
      },
      required: ['phone', 'channel'],
    },
  },
  {
    name: 'send_bill_upload_link',
    description: 'Send a link for the customer to photograph and upload their electricity bill. The OCR will extract consumption data automatically.',
    parameters: {
      type: 'object',
      properties: {
        phone: {
          type: 'string',
          description: 'Customer phone number',
        },
        channel: {
          type: 'string',
          enum: ['sms', 'whatsapp'],
        },
      },
      required: ['phone', 'channel'],
    },
  },
  {
    name: 'send_document_link',
    description: 'Send a link for uploading additional documents like ID card or property deed.',
    parameters: {
      type: 'object',
      properties: {
        phone: {
          type: 'string',
          description: 'Customer phone number',
        },
        document_type: {
          type: 'string',
          enum: ['id_card', 'property_deed', 'other'],
        },
        channel: {
          type: 'string',
          enum: ['sms', 'whatsapp'],
        },
      },
      required: ['phone', 'document_type', 'channel'],
    },
  },
  {
    name: 'send_signature_link',
    description: 'Send a link for the customer to electronically sign their solar installation contract.',
    parameters: {
      type: 'object',
      properties: {
        phone: {
          type: 'string',
          description: 'Customer phone number',
        },
        email: {
          type: 'string',
          description: 'Customer email for contract copy',
        },
        channel: {
          type: 'string',
          enum: ['sms', 'whatsapp', 'email'],
        },
      },
      required: ['phone', 'email', 'channel'],
    },
  },
  {
    name: 'check_data_received',
    description: 'Check if the customer has completed a pending data submission (location, bill upload, etc.)',
    parameters: {
      type: 'object',
      properties: {
        data_type: {
          type: 'string',
          enum: ['location', 'bill', 'document', 'signature'],
        },
      },
      required: ['data_type'],
    },
  },
  {
    name: 'get_solar_analysis',
    description: 'Get solar potential analysis for a location using Google Solar API. Call this after receiving the customer\'s location.',
    parameters: {
      type: 'object',
      properties: {
        lat: {
          type: 'number',
          description: 'Latitude of the property',
        },
        lng: {
          type: 'number',
          description: 'Longitude of the property',
        },
      },
      required: ['lat', 'lng'],
    },
  },
  {
    name: 'calculate_quote',
    description: 'Calculate a complete solar system quote including pricing, savings, and payback period.',
    parameters: {
      type: 'object',
      properties: {
        system_id: {
          type: 'string',
          description: 'System package ID (starter-3kw, essential-5kw, performance-10kw, max-15kw)',
          enum: ['starter-3kw', 'essential-5kw', 'performance-10kw', 'max-15kw'],
        },
        with_battery: {
          type: 'boolean',
          description: 'Include battery storage',
        },
        battery_size_kwh: {
          type: 'number',
          description: 'Battery capacity if with_battery is true (5, 10, or 15)',
        },
        grant_type: {
          type: 'string',
          description: 'Grant scheme option',
          enum: ['none', 'pv_only', 'pv_battery'],
        },
        location: {
          type: 'string',
          description: 'Malta or Gozo (affects grant amounts)',
          enum: ['malta', 'gozo'],
        },
        payment_method: {
          type: 'string',
          description: 'Payment method',
          enum: ['cash', 'loan'],
        },
        loan_term_months: {
          type: 'number',
          description: 'Loan term if payment_method is loan (36, 60, 84, or 120)',
        },
      },
      required: ['system_id', 'with_battery', 'grant_type', 'location', 'payment_method'],
    },
  },
  {
    name: 'recommend_system',
    description: 'Get a system recommendation based on the customer\'s monthly consumption.',
    parameters: {
      type: 'object',
      properties: {
        monthly_consumption_kwh: {
          type: 'number',
          description: 'Customer\'s monthly electricity consumption in kWh',
        },
        roof_area_m2: {
          type: 'number',
          description: 'Available roof area in square meters (optional)',
        },
      },
      required: ['monthly_consumption_kwh'],
    },
  },
  {
    name: 'save_to_crm',
    description: 'Save the lead data to Supabase and Zoho CRM. Call this when you have collected all necessary information.',
    parameters: {
      type: 'object',
      properties: {
        send_telegram_notification: {
          type: 'boolean',
          description: 'Also send Telegram notification to admin',
        },
      },
      required: [],
    },
  },
  {
    name: 'create_human_task',
    description: 'Create a task for a human sales rep to contact the customer. Use when customer explicitly wants human contact or when you cannot resolve their query.',
    parameters: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Why the customer needs human contact',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'urgent'],
        },
        preferred_contact_time: {
          type: 'string',
          description: 'When the customer prefers to be contacted (if mentioned)',
        },
      },
      required: ['reason', 'priority'],
    },
  },
  {
    name: 'pause_session',
    description: 'Pause the conversation so the customer can resume later. Send them a resume link.',
    parameters: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Why the session is being paused',
        },
        send_resume_link: {
          type: 'boolean',
          description: 'Send a link to resume the conversation later',
        },
        resume_channel: {
          type: 'string',
          enum: ['sms', 'whatsapp', 'email'],
        },
      },
      required: ['reason', 'send_resume_link'],
    },
  },
  {
    name: 'send_summary_email',
    description: 'Send an email summary of the conversation and quote to the customer.',
    parameters: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'Customer email address',
        },
        include_quote_pdf: {
          type: 'boolean',
          description: 'Attach a PDF quote document',
        },
      },
      required: ['email'],
    },
  },
  {
    name: 'schedule_callback',
    description: 'Schedule a callback or site visit with the customer.',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['call', 'site_visit'],
        },
        preferred_date: {
          type: 'string',
          description: 'Preferred date (ISO format or natural language)',
        },
        preferred_time: {
          type: 'string',
          description: 'Preferred time slot',
        },
        notes: {
          type: 'string',
          description: 'Additional notes about the appointment',
        },
      },
      required: ['type'],
    },
  },
];

// ============================================================================
// Conversation Parameters
// ============================================================================

export const CONVERSATION_CONFIG = {
  // Timeouts
  silenceTimeoutMs: 15000,       // Prompt user after 15s of silence
  dataWaitTimeoutMs: 300000,     // Wait up to 5 min for data submission
  sessionIdleTimeoutMs: 600000,  // End session after 10 min idle

  // Retry settings
  maxLinkSendRetries: 2,
  maxToolCallRetries: 3,

  // Confirmation prompts
  confirmBeforeAdvancing: true,  // Always confirm data before moving on
  repeatConfirmationOnError: true,

  // Connection quality
  poorConnectionThreshold: 3,    // Number of connection issues before suggesting improvement
};

// ============================================================================
// Link Templates
// ============================================================================

export const LINK_TEMPLATES = {
  location: (sessionId: string) =>
    `${ENV.APP_URL}/capture/location/${sessionId}`,
  bill: (sessionId: string) =>
    `${ENV.APP_URL}/capture/bill/${sessionId}`,
  document: (sessionId: string, type: string) =>
    `${ENV.APP_URL}/capture/document/${sessionId}?type=${type}`,
  signature: (contractId: string) =>
    `${ENV.APP_URL}/sign/${contractId}`,
  resume: (resumeToken: string) =>
    `${ENV.APP_URL}/avatar/resume/${resumeToken}`,
};

// ============================================================================
// Message Templates
// ============================================================================

export const MESSAGE_TEMPLATES = {
  // SMS/WhatsApp templates
  location_request: (name: string) =>
    `Hi ${name}! Hayden from GhawdeX here. Please tap to share your property location so I can analyze your solar potential: `,

  bill_upload_request: (name: string) =>
    `Hi ${name}! Please photograph your electricity bill here so I can calculate your savings: `,

  resume_session: (name: string) =>
    `Hi ${name}! Ready to continue your solar consultation with Hayden? Tap here to resume: `,

  quote_ready: (name: string, systemName: string) =>
    `Great news ${name}! Your quote for the ${systemName} system is ready. Tap to review and sign: `,

  // Email subjects
  email_quote_subject: 'Your GhawdeX Solar Quote',
  email_summary_subject: 'Summary of Your Solar Consultation',
};

// ============================================================================
// Phase-specific tool availability
// ============================================================================

export const PHASE_TOOLS: Record<string, ToolName[]> = {
  greeting: ['create_human_task', 'pause_session'],
  location: ['send_location_link', 'create_human_task', 'pause_session'],
  waiting_location: ['check_data_received', 'send_location_link', 'create_human_task', 'pause_session'],
  bill: ['send_bill_upload_link', 'create_human_task', 'pause_session'],
  waiting_bill: ['check_data_received', 'send_bill_upload_link', 'create_human_task', 'pause_session'],
  consumption: ['recommend_system', 'create_human_task', 'pause_session'],
  system_recommendation: ['recommend_system', 'calculate_quote', 'create_human_task', 'pause_session'],
  system_selection: ['calculate_quote', 'create_human_task', 'pause_session'],
  financing: ['calculate_quote', 'create_human_task', 'pause_session'],
  contact: ['save_to_crm', 'create_human_task', 'pause_session'],
  summary: ['calculate_quote', 'save_to_crm', 'send_summary_email', 'send_signature_link', 'schedule_callback', 'create_human_task', 'pause_session'],
  contract: ['send_signature_link', 'send_summary_email', 'create_human_task', 'pause_session'],
  waiting_signature: ['check_data_received', 'send_signature_link', 'create_human_task', 'pause_session'],
  completed: ['send_summary_email', 'schedule_callback'],
  paused: ['pause_session'],
  human_handoff: ['create_human_task'],
};

// Helper to get available tools for a phase
export function getToolsForPhase(phase: string): Tool[] {
  const toolNames = PHASE_TOOLS[phase] || [];
  return AVATAR_TOOLS.filter(tool => toolNames.includes(tool.name));
}
