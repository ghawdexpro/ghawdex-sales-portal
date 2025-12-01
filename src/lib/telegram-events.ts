// Telegram event tracking for real-time notifications

type EventType =
  | 'visitor'
  | 'wizard_step'
  | 'wizard_complete'
  | 'phone_click'
  | 'whatsapp_click'
  | 'email_click'
  | 'time_milestone'
  | 'cta_click';

interface EventData {
  step?: number;
  stepName?: string;
  seconds?: number;
  buttonText?: string;
  location?: string;
  userAgent?: string;
  referrer?: string;
  url?: string;
  prefilled?: boolean;
  name?: string;
}

// Generate or retrieve session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';

  let sessionId = sessionStorage.getItem('tg_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem('tg_session_id', sessionId);
  }
  return sessionId;
}

// Track if visitor notification was sent this session
function hasVisitorNotified(): boolean {
  if (typeof window === 'undefined') return true;
  return sessionStorage.getItem('tg_visitor_notified') === 'true';
}

function setVisitorNotified(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('tg_visitor_notified', 'true');
  }
}

// Track which steps have been notified
function hasStepNotified(step: number): boolean {
  if (typeof window === 'undefined') return true;
  const notified = sessionStorage.getItem('tg_steps_notified') || '';
  return notified.includes(`|${step}|`);
}

function setStepNotified(step: number): void {
  if (typeof window !== 'undefined') {
    const notified = sessionStorage.getItem('tg_steps_notified') || '|';
    sessionStorage.setItem('tg_steps_notified', notified + `${step}|`);
  }
}

// Track time milestones notified
function hasTimeNotified(seconds: number): boolean {
  if (typeof window === 'undefined') return true;
  const notified = sessionStorage.getItem('tg_time_notified') || '';
  return notified.includes(`|${seconds}|`);
}

function setTimeNotified(seconds: number): void {
  if (typeof window !== 'undefined') {
    const notified = sessionStorage.getItem('tg_time_notified') || '|';
    sessionStorage.setItem('tg_time_notified', notified + `${seconds}|`);
  }
}

// Core send function
async function sendTelegramEvent(event: EventType, data?: EventData): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    await fetch('/api/telegram-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        sessionId: getSessionId(),
        data,
      }),
    });
  } catch (error) {
    console.error('Telegram event failed:', error);
  }
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Track new visitor (called once per session)
 */
export function trackTelegramVisitor(prefilled?: boolean, name?: string): void {
  if (hasVisitorNotified()) return;

  sendTelegramEvent('visitor', {
    url: window.location.href,
    referrer: document.referrer || undefined,
    userAgent: navigator.userAgent,
    prefilled,
    name,
  });

  setVisitorNotified();
}

/**
 * Track wizard step progression
 */
export function trackTelegramWizardStep(step: number, stepName: string): void {
  // Only notify for steps 2+ (step 1 is covered by visitor notification)
  if (step < 2 || hasStepNotified(step)) return;

  sendTelegramEvent('wizard_step', { step, stepName });
  setStepNotified(step);
}

/**
 * Track wizard completion
 */
export function trackTelegramWizardComplete(): void {
  sendTelegramEvent('wizard_complete');
}

/**
 * Track phone click
 */
export function trackTelegramPhoneClick(): void {
  sendTelegramEvent('phone_click');
}

/**
 * Track WhatsApp click
 */
export function trackTelegramWhatsAppClick(): void {
  sendTelegramEvent('whatsapp_click');
}

/**
 * Track email click
 */
export function trackTelegramEmailClick(): void {
  sendTelegramEvent('email_click');
}

/**
 * Track time milestone (30s, 60s, 180s, 300s, 600s)
 */
export function trackTelegramTimeMilestone(seconds: number): void {
  // Only notify for significant milestones: 1min, 3min, 5min
  const notifyAt = [60, 180, 300];
  if (!notifyAt.includes(seconds) || hasTimeNotified(seconds)) return;

  sendTelegramEvent('time_milestone', { seconds });
  setTimeNotified(seconds);
}

/**
 * Track CTA button click
 */
export function trackTelegramCTAClick(buttonText: string, location: string): void {
  sendTelegramEvent('cta_click', { buttonText, location });
}
