// Analytics event tracking helper functions for GhawdeX Sales Portal

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

// Google Analytics Event
export const trackGAEvent = (
  eventName: string,
  eventParams?: Record<string, unknown>
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};

// Facebook Pixel Event
export const trackFBEvent = (
  eventName: string,
  eventParams?: Record<string, unknown>
) => {
  if (typeof window !== 'undefined' && window.fbq) {
    // Facebook standard events that use 'track'
    const standardEvents = [
      'PageView', 'ViewContent', 'Search', 'AddToCart',
      'AddToWishlist', 'InitiateCheckout', 'AddPaymentInfo',
      'Purchase', 'Lead', 'CompleteRegistration'
    ];

    // Use 'track' for standard events, 'trackCustom' for everything else
    const method = standardEvents.includes(eventName) ? 'track' : 'trackCustom';
    window.fbq(method, eventName, eventParams);
  }
};

// Combined tracking (GA4 + FB Pixel)
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, unknown>
) => {
  trackGAEvent(eventName, eventParams);
  trackFBEvent(eventName, eventParams);
};

// ============================================
// SALES PORTAL SPECIFIC EVENTS
// ============================================

// Wizard Step Events
export const trackWizardStart = (source?: string) => {
  trackEvent('wizard_start', {
    event_category: 'funnel',
    event_label: source ? `Started Quote Wizard (${source})` : 'Started Quote Wizard',
    value: 1,
    source: source || 'direct',
  });
  // Track as FB InitiateCheckout event
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'InitiateCheckout');
  }
};

export const trackWizardStep = (step: number, stepName: string) => {
  trackEvent('wizard_step', {
    event_category: 'funnel',
    event_label: stepName,
    step_number: step,
    value: step,
  });
};

export const trackWizardComplete = () => {
  trackEvent('wizard_complete', {
    event_category: 'conversion',
    event_label: 'Wizard Completed',
    value: 10,
  });
};

export const trackWizardAbandoned = (step: number, stepName: string) => {
  trackEvent('wizard_abandoned', {
    event_category: 'funnel',
    event_label: `Abandoned at ${stepName}`,
    step_number: step,
    value: 1,
  });
};

// Lead Events
export const trackLeadCreated = (systemSize?: number) => {
  trackEvent('lead_created', {
    event_category: 'conversion',
    event_label: systemSize ? `${systemSize} kWp system` : 'New lead',
    system_size: systemSize,
    value: 5,
  });
  // Also track as FB Lead event
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Lead', { system_size: systemSize });
  }
};

export const trackSystemSelected = (systemSize: number, withBattery: boolean, grantPath: boolean) => {
  trackEvent('system_selected', {
    event_category: 'conversion',
    event_label: `${systemSize} kWp ${withBattery ? '+ battery' : ''} ${grantPath ? '(grant)' : '(no grant)'}`,
    system_size: systemSize,
    with_battery: withBattery,
    grant_path: grantPath,
    value: 3,
  });
};

export const trackQuoteGenerated = (totalPrice: number, systemSize: number) => {
  trackEvent('quote_generated', {
    event_category: 'conversion',
    event_label: `€${totalPrice} quote for ${systemSize} kWp`,
    total_price: totalPrice,
    system_size: systemSize,
    value: 7,
  });
};

export const trackDealSigned = (totalPrice: number) => {
  trackEvent('deal_signed', {
    event_category: 'conversion',
    event_label: `Deal signed: €${totalPrice}`,
    total_price: totalPrice,
    value: 10,
  });
  // Track as FB Purchase event
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Purchase', { value: totalPrice, currency: 'EUR' });
  }
};

// ============================================
// STANDARD ENGAGEMENT EVENTS
// ============================================

export const trackPhoneClick = () => {
  trackEvent('phone_click', {
    event_category: 'engagement',
    event_label: 'Call +356 7905 5156',
    value: 1,
  });
  // FB Standard Event: Contact
  trackFBEvent('Contact', { content_name: 'phone' });
};

export const trackWhatsAppClick = () => {
  trackEvent('whatsapp_click', {
    event_category: 'engagement',
    event_label: 'WhatsApp Chat',
    value: 1,
  });
  // FB Standard Event: Contact
  trackFBEvent('Contact', { content_name: 'whatsapp' });
};

export const trackEmailClick = () => {
  trackEvent('email_click', {
    event_category: 'engagement',
    event_label: 'Email info@ghawdex.pro',
    value: 1,
  });
  // FB Standard Event: Contact
  trackFBEvent('Contact', { content_name: 'email' });
};

export const trackCTAClick = (buttonText: string, location: string) => {
  trackEvent('cta_click', {
    event_category: 'conversion',
    event_label: buttonText,
    button_location: location,
    value: 2,
  });
};

export const trackExternalLinkClick = (url: string, linkText: string) => {
  trackEvent('external_link_click', {
    event_category: 'engagement',
    event_label: linkText,
    link_url: url,
    value: 1,
  });
};

export const trackScrollDepth = (depth: number) => {
  trackEvent('scroll_depth', {
    event_category: 'engagement',
    event_label: `${depth}% scrolled`,
    scroll_depth: depth,
  });
};

export const trackTimeOnSite = (seconds: number) => {
  trackEvent('time_on_site', {
    event_category: 'engagement',
    event_label: `${seconds} seconds`,
    time_seconds: seconds,
  });
};

// ============================================
// AI INTERACTION EVENTS
// ============================================

export const trackAIMessage = (messageType: 'user' | 'assistant') => {
  trackEvent('ai_message', {
    event_category: 'engagement',
    event_label: `AI ${messageType} message`,
    message_type: messageType,
    value: 1,
  });
};

export const trackAIRecommendation = (systemSize: number) => {
  trackEvent('ai_recommendation', {
    event_category: 'conversion',
    event_label: `AI recommended ${systemSize} kWp`,
    system_size: systemSize,
    value: 2,
  });
};
