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

// Customer testimonials with photos
const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Joseph Camilleri',
    location: 'Xewkija, Gozo',
    systemSize: '10 kWp + 10 kWh Battery',
    savings: '€320/month',
    quote: 'With the 95% battery grant in Gozo, I paid only €499 for a full system worth €12,000! The team handled all paperwork with ARMS. My electricity bill went from €280 to practically zero.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    isGozo: true,
  },
  {
    id: '2',
    name: 'Maria Borg',
    location: 'Mosta, Malta',
    systemSize: '12 kWp + 12 kWh Battery',
    savings: '€380/month',
    quote: 'The calculator on the website was incredibly accurate. They quoted €350/month savings and I\'m actually saving more! Installation was done in 11 days, even faster than promised.',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: '3',
    name: 'Paul Vella',
    location: 'Naxxar, Malta',
    systemSize: '15 kWp + 15 kWh Battery',
    savings: '€450/month',
    quote: 'Running a business from home, my bills were crazy. Now I\'m selling electricity back to the grid! The €10,200 grant made this a no-brainer. Professional team, no hidden costs.',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: '4',
    name: 'Carmen Galea',
    location: 'Rabat, Malta',
    systemSize: '8 kWp + 8 kWh Battery',
    savings: '€245/month',
    quote: 'As a pensioner, I was worried about the investment. But with BOV 0% financing and the grants, my monthly payment is less than what I was paying Enemalta! Wish I did this sooner.',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: '5',
    name: 'Anthony Sultana',
    location: 'Victoria, Gozo',
    systemSize: '6 kWp + 10 kWh Battery',
    savings: '€195/month',
    quote: 'The Gozo 95% battery grant is amazing! Paid almost nothing out of pocket. The team came from Malta but were very professional. System working perfectly for 8 months now.',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face',
    isGozo: true,
  },
  {
    id: '6',
    name: 'Rita Azzopardi',
    location: 'Sliema, Malta',
    systemSize: '10 kWp + 10 kWh Battery',
    savings: '€310/month',
    quote: 'Living in an apartment, I thought solar wasn\'t possible. GhawdeX found roof space and now my family of 5 has near-zero electricity costs. The digital contract signing was so convenient!',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: '7',
    name: 'Mark Grech',
    location: 'Qormi, Malta',
    systemSize: '20 kWp + 20 kWh Battery',
    savings: '€580/month',
    quote: 'I have a pool and AC running most of the year. My bills were €600+! Now I generate more than I use. The 14-day installation guarantee was met exactly. Very impressed.',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: '8',
    name: 'Joanna Mifsud',
    location: 'St. Julian\'s, Malta',
    systemSize: '8 kWp',
    savings: '€210/month',
    quote: 'Started without battery, planning to add one next year. Even solar-only with the 50% grant is fantastic. Already saving over €200 monthly. The online quote matched exactly.',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
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
    <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-6 hover:border-amber-500/30 transition-colors">
      {/* Stars */}
      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className="w-5 h-5 text-amber-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>

      {/* Quote */}
      <blockquote className="text-gray-300 mb-4 text-sm sm:text-base leading-relaxed">
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>

      {/* Customer info */}
      <div className="flex items-center gap-3">
        {testimonial.image ? (
          <img
            src={testimonial.image}
            alt={testimonial.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-amber-500/30"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
            {testimonial.name.split(' ').map(n => n[0]).join('')}
          </div>
        )}
        <div className="flex-1">
          <div className="text-white font-medium">{testimonial.name}</div>
          <div className="text-gray-500 text-sm">{testimonial.location}</div>
        </div>
      </div>

      {/* System & savings */}
      <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-sm">
        <span className="text-gray-400">{testimonial.systemSize}</span>
        <span className="font-semibold text-amber-400">
          Saving {testimonial.savings}
        </span>
      </div>
    </div>
  );
}
