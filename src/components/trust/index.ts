/**
 * Trust & Conversion Components
 *
 * Components for building trust and increasing conversions:
 * - GrantCountdown - REWS 2025 deadline countdown
 * - GuaranteeSection - Risk-reversal guarantees
 * - TestimonialCarousel - Customer testimonials
 *
 * Dark theme versions (for landing page):
 * - TestimonialCarouselDark
 * - GrantCountdownDark
 */

// Light theme (for wizard steps)
export { default as GrantCountdown } from './GrantCountdown';
export { default as GuaranteeSection, GuaranteeBadges } from './GuaranteeSection';
export { default as TestimonialCarousel, FeaturedTestimonial } from './TestimonialCarousel';

// Dark theme (for landing page)
export { default as TestimonialCarouselDark } from './TestimonialCarouselDark';
export { default as GrantCountdownDark, GrantCountdownCompact } from './GrantCountdownDark';
