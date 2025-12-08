'use client';

import { useState, useEffect } from 'react';

/**
 * Testimonial Carousel (Dark Theme)
 *
 * Auto-rotating carousel of customer testimonials for dark landing pages.
 * Matches the amber/orange accent theme of the main landing page.
 */

interface Testimonial {
  id: string;
  name: string;
  location: string;
  systemSize: string;
  savings: string;
  quote: string;
  image?: string;
  isGozo?: boolean;
}

// Customer testimonials with people photos
const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Joseph Camilleri',
    location: 'Xewkija, Gozo',
    systemSize: '10 kWp + 10 kWh Battery',
    savings: '€280/month',
    quote: 'With the 95% battery grant in Gozo, I paid only €499 for a full system worth €12,000! The team handled all paperwork with ARMS. My electricity bill went from €280 to practically zero.',
    image: '/testimonials/testimonial-person-joseph.jpg',
    isGozo: true,
  },
  {
    id: '2',
    name: 'Paul Vella',
    location: 'Naxxar, Malta',
    systemSize: '15 kWp + 15 kWh Battery',
    savings: '€320/month',
    quote: 'Running a business from home, my bills were crazy. Now I\'m selling electricity back to the grid! The €10,200 grant made this a no-brainer. Professional team, no hidden costs.',
    image: '/testimonials/testimonial-person-paul.jpg',
  },
  {
    id: '3',
    name: 'Carmen Galea',
    location: 'Rabat, Malta',
    systemSize: '10 kWp + 10 kWh Battery',
    savings: '€180/month',
    quote: 'As a pensioner, I was worried about the investment. But with BOV 0% financing and the grants, my monthly payment is less than what I was paying Enemalta! Wish I did this sooner.',
    image: '/testimonials/testimonial-person-carmen.jpg',
  },
  {
    id: '4',
    name: 'Anthony Sultana',
    location: 'Victoria, Gozo',
    systemSize: '6 kWp + 10 kWh Battery',
    savings: '€165/month',
    quote: 'The Gozo 95% battery grant is amazing! Paid almost nothing out of pocket. The team came from Malta but were very professional. System working perfectly for 8 months now.',
    image: '/testimonials/testimonial-person-anthony.jpg',
    isGozo: true,
  },
  {
    id: '5',
    name: 'Rita Azzopardi',
    location: 'Sliema, Malta',
    systemSize: '10 kWp + 10 kWh Battery',
    savings: '€250/month',
    quote: 'Living in an apartment, I thought solar wasn\'t possible. GhawdeX found roof space and now my family of 5 has near-zero electricity costs. The digital contract signing was so convenient!',
    image: '/testimonials/testimonial-person-rita.jpg',
  },
];

interface TestimonialCarouselDarkProps {
  /** Filter to show only Gozo testimonials */
  gozoOnly?: boolean;
  /** Auto-rotate interval in ms (0 to disable) */
  autoRotateInterval?: number;
  /** Additional CSS classes */
  className?: string;
}

export default function TestimonialCarouselDark({
  gozoOnly = false,
  autoRotateInterval = 6000,
  className = '',
}: TestimonialCarouselDarkProps) {
  const testimonials = gozoOnly
    ? TESTIMONIALS.filter(t => t.isGozo)
    : TESTIMONIALS;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-rotate
  useEffect(() => {
    if (autoRotateInterval <= 0 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, autoRotateInterval);

    return () => clearInterval(timer);
  }, [autoRotateInterval, isPaused, testimonials.length]);

  // Get visible testimonials (show 3 at a time on desktop)
  const getVisibleTestimonials = () => {
    const visible = [];
    for (let i = 0; i < 3; i++) {
      const index = (currentIndex + i) % testimonials.length;
      visible.push(testimonials[index]);
    }
    return visible;
  };

  const visibleTestimonials = getVisibleTestimonials();

  return (
    <div className={className}>
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {visibleTestimonials.map((testimonial, idx) => (
          <TestimonialCardDark
            key={`${testimonial.id}-${idx}`}
            testimonial={testimonial}
          />
        ))}
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-2 mt-6">
        {testimonials.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2 h-2 rounded-full transition-colors ${
              idx === currentIndex
                ? 'bg-amber-400'
                : 'bg-white/20 hover:bg-white/40'
            }`}
            aria-label={`Go to testimonial ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function TestimonialCardDark({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl overflow-hidden hover:border-amber-500/30 transition-colors">
      {/* Installation Photo */}
      {testimonial.image && (
        <div className="relative h-44 overflow-hidden">
          <img
            src={testimonial.image}
            alt={`Solar installation - ${testimonial.location}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className="w-4 h-4 text-amber-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="text-amber-200 text-xs ml-1">Verified Customer</span>
            </div>
          </div>
        </div>
      )}

      <div className="p-5">
        {/* Quote */}
        <blockquote className="text-gray-300 mb-4 text-sm leading-relaxed">
          &ldquo;{testimonial.quote}&rdquo;
        </blockquote>

        {/* Customer info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
            {testimonial.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1">
            <div className="text-white font-medium text-sm">{testimonial.name}</div>
            <div className="text-gray-500 text-xs">{testimonial.location}</div>
          </div>
        </div>

        {/* System & savings */}
        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
          <span className="text-gray-400 text-xs">{testimonial.systemSize}</span>
          <span className="font-semibold text-amber-400 text-sm">
            Saving {testimonial.savings}
          </span>
        </div>
      </div>
    </div>
  );
}
