/**
 * HeyGen Avatar Chat - Session Manager
 *
 * Handles session persistence, retrieval, and lifecycle management
 * using Supabase as the backend store.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  AvatarSession,
  SessionStatus,
  ConversationPhase,
  ConversationMessage,
  CollectedData,
  PrefillData,
  DeviceInfo,
  Document,
} from './types';

// ============================================================================
// Session Manager Class
// ============================================================================

export class SessionManager {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // ============================================================================
  // Session CRUD Operations
  // ============================================================================

  /**
   * Create a new avatar session
   */
  async createSession(options: {
    prefillData?: PrefillData;
    source?: string;
    deviceInfo?: DeviceInfo;
  }): Promise<AvatarSession> {
    const now = new Date().toISOString();

    const sessionData: Partial<AvatarSession> = {
      created_at: now,
      updated_at: now,
      customer_phone: options.prefillData?.phone || null,
      customer_email: options.prefillData?.email || null,
      customer_name: options.prefillData?.name || null,
      zoho_lead_id: options.prefillData?.zoho_lead_id || null,
      status: 'active',
      current_phase: options.prefillData?.name ? 'location' : 'greeting', // Skip greeting if we have name
      conversation_history: [],
      last_message_at: null,
      collected_data: this.initializeCollectedData(options.prefillData),
      documents: [],
      source: options.source || 'website',
      device_info: options.deviceInfo || null,
      total_duration_seconds: 0,
      heygen_session_id: null,
      prefill_data: options.prefillData || null,
    };

    const { data, error } = await this.supabase
      .from('avatar_sessions')
      .insert([sessionData])
      .select()
      .single();

    if (error) {
      console.error('Failed to create session:', error);
      throw new Error(`Failed to create session: ${error.message}`);
    }

    return data as AvatarSession;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<AvatarSession | null> {
    const { data, error } = await this.supabase
      .from('avatar_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Failed to get session:', error);
      throw new Error(`Failed to get session: ${error.message}`);
    }

    return data as AvatarSession;
  }

  /**
   * Get session by resume token
   */
  async getSessionByResumeToken(resumeToken: string): Promise<AvatarSession | null> {
    const { data, error } = await this.supabase
      .from('avatar_sessions')
      .select('*')
      .eq('resume_token', resumeToken)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Failed to get session by token:', error);
      throw new Error(`Failed to get session: ${error.message}`);
    }

    return data as AvatarSession;
  }

  /**
   * Update session
   */
  async updateSession(
    sessionId: string,
    updates: Partial<AvatarSession>
  ): Promise<AvatarSession> {
    const { data, error } = await this.supabase
      .from('avatar_sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update session:', error);
      throw new Error(`Failed to update session: ${error.message}`);
    }

    return data as AvatarSession;
  }

  // ============================================================================
  // Conversation History Management
  // ============================================================================

  /**
   * Add message to conversation history
   */
  async addMessage(
    sessionId: string,
    message: ConversationMessage
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const history = [...(session.conversation_history || []), message];

    await this.updateSession(sessionId, {
      conversation_history: history,
      last_message_at: new Date().toISOString(),
    });
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(sessionId: string): Promise<ConversationMessage[]> {
    const session = await this.getSession(sessionId);
    return session?.conversation_history || [];
  }

  // ============================================================================
  // Phase & Status Management
  // ============================================================================

  /**
   * Update session phase
   */
  async updatePhase(
    sessionId: string,
    phase: ConversationPhase
  ): Promise<void> {
    await this.updateSession(sessionId, { current_phase: phase });
  }

  /**
   * Update session status
   */
  async updateStatus(
    sessionId: string,
    status: SessionStatus
  ): Promise<void> {
    await this.updateSession(sessionId, { status });
  }

  /**
   * Pause session
   */
  async pauseSession(sessionId: string): Promise<string> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    await this.updateSession(sessionId, {
      status: 'paused',
      current_phase: 'paused',
    });

    return session.resume_token;
  }

  /**
   * Resume session
   */
  async resumeSession(resumeToken: string): Promise<AvatarSession | null> {
    const session = await this.getSessionByResumeToken(resumeToken);
    if (!session) {
      return null;
    }

    // Restore to previous phase (stored in conversation history)
    const lastPhase = this.getLastActivePhase(session);

    await this.updateSession(session.id, {
      status: 'active',
      current_phase: lastPhase,
    });

    return await this.getSession(session.id);
  }

  // ============================================================================
  // Data Collection
  // ============================================================================

  /**
   * Update collected data
   */
  async updateCollectedData(
    sessionId: string,
    updates: Partial<CollectedData>
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const collectedData = {
      ...session.collected_data,
      ...updates,
    };

    await this.updateSession(sessionId, { collected_data: collectedData });
  }

  /**
   * Add document to session
   */
  async addDocument(sessionId: string, document: Document): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const documents = [...(session.documents || []), document];

    await this.updateSession(sessionId, { documents });
  }

  // ============================================================================
  // HeyGen Session Management
  // ============================================================================

  /**
   * Link HeyGen session ID to avatar session
   */
  async setHeyGenSession(
    sessionId: string,
    heygenSessionId: string
  ): Promise<void> {
    await this.updateSession(sessionId, { heygen_session_id: heygenSessionId });
  }

  // ============================================================================
  // Duration Tracking
  // ============================================================================

  /**
   * Update session duration
   */
  async updateDuration(sessionId: string, durationSeconds: number): Promise<void> {
    await this.updateSession(sessionId, {
      total_duration_seconds: durationSeconds,
    });
  }

  /**
   * Increment session duration
   */
  async incrementDuration(
    sessionId: string,
    additionalSeconds: number
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const newDuration = (session.total_duration_seconds || 0) + additionalSeconds;
    await this.updateDuration(sessionId, newDuration);
  }

  // ============================================================================
  // Session Queries
  // ============================================================================

  /**
   * Get active sessions for a customer (by phone or email)
   */
  async getCustomerSessions(
    phone?: string,
    email?: string
  ): Promise<AvatarSession[]> {
    let query = this.supabase
      .from('avatar_sessions')
      .select('*')
      .eq('status', 'active');

    if (phone) {
      query = query.eq('customer_phone', phone);
    }
    if (email) {
      query = query.eq('customer_email', email);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get customer sessions:', error);
      return [];
    }

    return data as AvatarSession[];
  }

  /**
   * Get recent sessions (for admin dashboard)
   */
  async getRecentSessions(limit: number = 50): Promise<AvatarSession[]> {
    const { data, error } = await this.supabase
      .from('avatar_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get recent sessions:', error);
      return [];
    }

    return data as AvatarSession[];
  }

  /**
   * Get sessions by status
   */
  async getSessionsByStatus(status: SessionStatus): Promise<AvatarSession[]> {
    const { data, error } = await this.supabase
      .from('avatar_sessions')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get sessions by status:', error);
      return [];
    }

    return data as AvatarSession[];
  }

  // ============================================================================
  // Cleanup & Maintenance
  // ============================================================================

  /**
   * Mark abandoned sessions (no activity for X hours)
   */
  async markAbandonedSessions(hoursInactive: number = 24): Promise<number> {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hoursInactive);

    const { data, error } = await this.supabase
      .from('avatar_sessions')
      .update({ status: 'abandoned' })
      .eq('status', 'active')
      .lt('updated_at', cutoff.toISOString())
      .select();

    if (error) {
      console.error('Failed to mark abandoned sessions:', error);
      return 0;
    }

    return data?.length || 0;
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private initializeCollectedData(prefill?: PrefillData | null): CollectedData {
    return {
      address: prefill?.address || null,
      coordinates: null,
      location: null,
      bill_image_url: null,
      bill_ocr_data: null,
      monthly_bill: null,
      consumption_kwh: null,
      household_size: null,
      solar_analysis: null,
      roof_area: null,
      max_panels: null,
      selected_system: null,
      with_battery: false,
      selected_battery: null,
      grant_type: 'pv_only',
      payment_method: null,
      loan_term: null,
      full_name: prefill?.name || null,
      email: prefill?.email || null,
      phone: prefill?.phone || null,
      notes: null,
      total_price: null,
      grant_amount: null,
      monthly_payment: null,
      annual_savings: null,
      payback_years: null,
    };
  }

  private getLastActivePhase(session: AvatarSession): ConversationPhase {
    // Find the last non-paused phase from conversation history
    const history = session.conversation_history || [];

    for (let i = history.length - 1; i >= 0; i--) {
      const msg = history[i];
      if (msg.phase && msg.phase !== 'paused') {
        return msg.phase;
      }
    }

    return 'greeting';
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let sessionManagerInstance: SessionManager | null = null;

export function getSessionManager(): SessionManager {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new SessionManager();
  }
  return sessionManagerInstance;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `avatar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Parse prefill data from URL parameters
 */
export function parsePrefillFromUrl(
  searchParams: URLSearchParams
): PrefillData | null {
  const name = searchParams.get('name');
  const email = searchParams.get('email');
  const phone = searchParams.get('phone');
  const zohoId = searchParams.get('zoho_id');
  const address = searchParams.get('address');
  const source = searchParams.get('source') || 'zoho_link';

  if (!name && !email && !phone && !zohoId) {
    return null;
  }

  return {
    name,
    email,
    phone,
    zoho_lead_id: zohoId,
    address,
    source,
  };
}

/**
 * Get device info from request headers
 */
export function getDeviceInfo(headers: Headers): DeviceInfo {
  const userAgent = headers.get('user-agent') || '';

  return {
    user_agent: userAgent,
    platform: detectPlatform(userAgent),
    is_mobile: isMobileDevice(userAgent),
    screen_width: null, // Set client-side
    screen_height: null,
  };
}

function detectPlatform(userAgent: string): string {
  if (/iPhone|iPad|iPod/.test(userAgent)) return 'iOS';
  if (/Android/.test(userAgent)) return 'Android';
  if (/Windows/.test(userAgent)) return 'Windows';
  if (/Mac/.test(userAgent)) return 'macOS';
  if (/Linux/.test(userAgent)) return 'Linux';
  return 'Unknown';
}

function isMobileDevice(userAgent: string): boolean {
  return /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    userAgent
  );
}
