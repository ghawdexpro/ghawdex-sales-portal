/**
 * HeyGen Avatar Chat - Type Definitions
 *
 * Types for the conversational AI sales experience powered by HeyGen Interactive Avatar
 * and Google Gemini for conversation orchestration.
 */

import { SystemPackage, BatteryOption, Location, GrantType } from '../types';

// ============================================================================
// Session & Conversation Types
// ============================================================================

export type SessionStatus = 'active' | 'paused' | 'completed' | 'abandoned';

export type ConversationPhase =
  | 'greeting'
  | 'location'
  | 'waiting_location'      // Waiting for customer to share location via link
  | 'bill'
  | 'waiting_bill'          // Waiting for customer to upload bill via link
  | 'consumption'
  | 'system_recommendation'
  | 'system_selection'
  | 'financing'
  | 'contact'
  | 'summary'
  | 'contract'
  | 'waiting_signature'     // Waiting for customer to sign
  | 'completed'
  | 'paused'
  | 'human_handoff';

export interface AvatarSession {
  id: string;
  created_at: string;
  updated_at: string;

  // Customer identification
  customer_phone: string | null;
  customer_email: string | null;
  customer_name: string | null;
  zoho_lead_id: string | null;

  // Session state
  status: SessionStatus;
  current_phase: ConversationPhase;
  resume_token: string;

  // Conversation
  conversation_history: ConversationMessage[];
  last_message_at: string | null;

  // Collected data (mirrors WizardState structure)
  collected_data: CollectedData;

  // Documents and artifacts
  documents: Document[];

  // Metadata
  source: string;           // 'website' | 'zoho_link' | 'whatsapp' | 'sms' | 'callback'
  device_info: DeviceInfo | null;
  total_duration_seconds: number;
  heygen_session_id: string | null;

  // Prefill data (from Zoho or other sources)
  prefill_data: PrefillData | null;
}

export interface CollectedData {
  // Location
  address: string | null;
  coordinates: { lat: number; lng: number } | null;
  location: Location | null;   // 'malta' | 'gozo'

  // Bill & Consumption
  bill_image_url: string | null;
  bill_ocr_data: BillOCRData | null;
  monthly_bill: number | null;
  consumption_kwh: number | null;
  household_size: number | null;

  // Solar Analysis (from Google Solar API)
  solar_analysis: SolarAnalysisData | null;
  roof_area: number | null;
  max_panels: number | null;

  // System Selection
  selected_system: SystemPackage | null;
  with_battery: boolean;
  selected_battery: BatteryOption | null;
  grant_type: GrantType;

  // Financing
  payment_method: 'cash' | 'loan' | null;
  loan_term: number | null;

  // Contact
  full_name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;

  // Calculated values
  total_price: number | null;
  deposit_amount: number | null;
  grant_amount: number | null;
  monthly_payment: number | null;
  annual_savings: number | null;
  payback_years: number | null;
}

export interface BillOCRData {
  consumption_kwh: number | null;
  account_number: string | null;
  billing_period: string | null;
  amount_due: number | null;
  confidence: number;         // 0-1 confidence score
  raw_text: string;
}

export interface SolarAnalysisData {
  max_array_panels_count: number;
  max_array_area_meters2: number;
  max_sunshine_hours_per_year: number;
  yearly_energy_dc_kwh: number;
  is_fallback: boolean;       // True if Google Solar API failed and using defaults
}

export interface Document {
  type: 'bill' | 'id_front' | 'id_back' | 'property_deed' | 'contract' | 'other';
  url: string;
  uploaded_at: string;
  ocr_processed: boolean;
}

export interface DeviceInfo {
  user_agent: string;
  platform: string;
  is_mobile: boolean;
  screen_width: number | null;
  screen_height: number | null;
}

export interface PrefillData {
  name: string | null;
  email: string | null;
  phone: string | null;
  zoho_lead_id: string | null;
  address: string | null;
  source: string;
}

// ============================================================================
// Conversation Message Types
// ============================================================================

export type MessageRole = 'assistant' | 'user' | 'system' | 'function';

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;

  // For function calls
  function_call?: FunctionCall;
  function_result?: FunctionResult;

  // Metadata
  phase: ConversationPhase;
  spoken: boolean;            // Was this actually spoken by avatar
  duration_ms?: number;       // How long avatar spoke
}

export interface FunctionCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface FunctionResult {
  name: string;
  result: unknown;
  success: boolean;
  error?: string;
}

// ============================================================================
// Function Calling / Tools
// ============================================================================

export type ToolName =
  | 'send_location_link'
  | 'send_bill_upload_link'
  | 'send_document_link'
  | 'send_signature_link'
  | 'check_data_received'
  | 'get_solar_analysis'
  | 'calculate_quote'
  | 'recommend_system'
  | 'save_to_crm'
  | 'create_human_task'
  | 'pause_session'
  | 'send_summary_email'
  | 'schedule_callback';

export interface Tool {
  name: ToolName;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ToolParameter>;
    required: string[];
  };
}

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  enum?: string[];
}

// ============================================================================
// HeyGen Avatar Types
// ============================================================================

export type AvatarQuality = 'high' | 'medium' | 'low';
export type TaskType = 'talk' | 'repeat';

export interface AvatarConfig {
  avatar_id: string;          // HeyGen avatar ID (e.g., "Hayden")
  voice_id: string;           // Voice to use
  quality: AvatarQuality;
  language: string;           // e.g., 'en'
  knowledge_base_id?: string; // HeyGen knowledge base (optional)
}

export interface AvatarSessionConfig {
  avatar_config: AvatarConfig;
  idle_timeout_seconds: number;
  use_voice_chat: boolean;
  silence_prompt: boolean;    // Auto-prompt on silence
}

// ============================================================================
// API Response Types
// ============================================================================

export interface StartSessionResponse {
  session_id: string;
  resume_token: string;
  heygen_session_id: string;
  heygen_access_token: string;
  heygen_url: string;
}

export interface SendLinkResponse {
  success: boolean;
  link_url: string;
  channel: 'sms' | 'whatsapp' | 'email';
  message_id?: string;
}

export interface DataReceivedEvent {
  session_id: string;
  data_type: 'location' | 'bill' | 'document' | 'signature';
  payload: unknown;
  received_at: string;
}

// ============================================================================
// Conversation State Machine
// ============================================================================

export interface ConversationState {
  phase: ConversationPhase;
  collected_data: CollectedData;
  pending_action: PendingAction | null;
  awaiting_user_input: boolean;
  can_proceed: boolean;
  next_phase: ConversationPhase | null;
}

export interface PendingAction {
  type: 'waiting_for_link_completion' | 'waiting_for_user_response' | 'processing';
  link_type?: 'location' | 'bill' | 'document' | 'signature';
  started_at: string;
  timeout_seconds: number;
}

// ============================================================================
// Dialogue Templates
// ============================================================================

export interface DialogueTemplate {
  phase: ConversationPhase;
  condition?: (state: ConversationState) => boolean;
  messages: string[];
  follow_up_prompts?: string[];
  tools_available: ToolName[];
  next_phase_triggers: PhaseTransition[];
}

export interface PhaseTransition {
  condition: (state: ConversationState, userMessage?: string) => boolean;
  next_phase: ConversationPhase;
  action?: ToolName;
}

// ============================================================================
// Error Types
// ============================================================================

export class AvatarError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'AvatarError';
  }
}

export const AvatarErrorCodes = {
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  HEYGEN_CONNECTION_FAILED: 'HEYGEN_CONNECTION_FAILED',
  HEYGEN_STREAMING_ERROR: 'HEYGEN_STREAMING_ERROR',
  LLM_ERROR: 'LLM_ERROR',
  SMS_SEND_FAILED: 'SMS_SEND_FAILED',
  DATA_VALIDATION_FAILED: 'DATA_VALIDATION_FAILED',
  CRM_SYNC_FAILED: 'CRM_SYNC_FAILED',
} as const;
