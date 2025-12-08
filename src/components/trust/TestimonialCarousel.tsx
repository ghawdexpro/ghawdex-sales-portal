'use client';

import { useState, useEffect } from 'react';

/**
 * Testimonial Carousel
 *
 * Auto-rotating carousel of customer testimonials.
 * Placeholder testimonials until real ones are collected.
 */

interface Testimonial {
  id: string;
  name: string;
  location: string;
  systemSize: string;
  savings: string;
  quote: string;
  image?: string;
}

// Customer testimonials with installation photos
const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Joseph Camilleri',
    location: 'Xewkija, Gozo',
    systemSize: '10 kWp + 10 kWh Battery',
    savings: '€320/month',
    quote: 'With the 95% battery grant in Gozo, I paid only €499 for a full system worth €12,000! The team handled all paperwork with ARMS. My electricity bill went from €280 to practically zero.',
    image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=300&h=200&fit=crop',
  },
  {
    id: '2',
    name: 'Maria Borg',
    location: 'Mosta, Malta',
    systemSize: '12 kWp + 12 kWh Battery',
    savings: '€380/month',
    quote: 'The calculator on the website was incredibly accurate. They quoted €350/month savings and I\'m actually saving more! Installation was done in 11 days, even faster than promised.',
    image: 'https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=300&h=200&fit=crop',
  },
  {
    id: '3',
    name: 'Paul Vella',
    location: 'Naxxar, Malta',
    systemSize: '15 kWp + 15 kWh Battery',
    savings: '€450/month',
    quote: 'Running a business from home, my bills were crazy. Now I\'m selling electricity back to the grid! The €10,200 grant made this a no-brainer. Professional team, no hidden costs.',
    image: 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=300&h=200&fit=crop',
  },
  {
    id: '4',
    name: 'Carmen Galea',
    location: 'Rabat, Malta',
    systemSize: '8 kWp + 8 kWh Battery',
    savings: '€245/month',
    quote: 'As a pensioner, I was worried about the investment. But with BOV 0% financing and the grants, my monthly payment is less than what I was paying Enemalta! Wish I did this sooner.',
    image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=300&h=200&fit=crop',
  },
  {
    id: '5',
    name: 'Anthony Sultana',
    location: 'Victoria, Gozo',
    systemSize: '6 kWp + 10 kWh Battery',
    savings: '€195/month',
    quote: 'The Gozo 95% battery grant is amazing! Paid almost nothing out of pocket. The team came from Malta but were very professional. System working perfectly for 8 months now.',
    image: 'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=300&h=200&fit=crop',
  },
  {
    id: '6',
    name: 'Rita Azzopardi',
    location: 'Sliema, Malta',
    systemSize: '10 kWp + 10 kWh Battery',
    savings: '€310/month',
    quote: 'Living in an apartment, I thought solar wasn\'t possible. GhawdeX found roof space and now my family of 5 has near-zero electricity costs. The digital contract signing was so convenient!',
    image: 'https://images.unsplash.com/photo-1624397640148-949b1732bb0a?w=300&h=200&fit=crop',
  },
  {
    id: '7',
    name: 'Mark Grech',
    location: 'Qormi, Malta',
    systemSize: '20 kWp + 20 kWh Battery',
    savings: '€580/month',
    quote: 'I have a pool and AC running most of the year. My bills were €600+! Now I generate more than I use. The 14-day installation guarantee was met exactly. Very impressed.',
    image: 'https://images.unsplash.com/photo-1595437193398-f24279553f4f?w=300&h=200&fit=crop',
  },
  {
    id: '8',
    name: 'Joanna Mifsud',
    location: 'St. Julian\'s, Malta',
    systemSize: '8 kWp',
    savings: '€210/month',
    quote: 'Started without battery, planning to add one next year. Even solar-only with the 50% grant is fantastic. Already saving over €200 monthly. The online quote matched exactly.',
    image: 'https://images.unsplash.com/photo-1611365892117-00ac5ef43c90?w=300&h=200&fit=crop',
  },
];

interface TestimonialCarouselProps {
  /** Number of testimonials to show at once */
  visibleCount?: number;
  /** Auto-rotate interval in ms (0 to disable) */
  autoRotateInterval?: number;
  /** Additional CSS classes */
  className?: string;
}

export default function TestimonialCarousel({
  visibleCount = 3,
  autoRotateInterval = 5000,
  className = '',
}: TestimonialCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-rotate
  useEffect(() => {
    if (autoRotateInterval <= 0 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, autoRotateInterval);

    return () => clearInterval(timer);
  }, [autoRotateInterval, isPaused]);

  // Get visible testimonials
  const visibleTestimonials = [];
  for (let i = 0; i < Math.min(visibleCount, TESTIMONIALS.length); i++) {
    const index = (currentIndex + i) % TESTIMONIALS.length;
    visibleTestimonials.push(TESTIMONIALS[index]);
  }

  return (
    <div className={`${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          What Our Customers Say
        </h2>
        <p className="text-gray-600">
          Join 2,000+ happy homeowners who switched to solar
        </p>
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {visibleTestimonials.map((testimonial, idx) => (
          <TestimonialCard
            key={`${testimonial.id}-${idx}`}
            testimonial={testimonial}
          />
        ))}
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-2 mt-4">
        {TESTIMONIALS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2 h-2 rounded-full transition-colors ${
              idx === currentIndex
                ? 'bg-green-600'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to testimonial ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Installation Photo */}
      {testimonial.image && (
        <div className="relative h-40 overflow-hidden">
          <img
            src={testimonial.image}
            alt={`Solar installation - ${testimonial.location}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className="w-4 h-4 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="p-5">
        {/* Quote */}
        <blockquote className="text-gray-700 mb-4 italic text-sm">
          &ldquo;{testimonial.quote}&rdquo;
        </blockquote>

        {/* Customer info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold text-sm">
            {testimonial.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900 text-sm">{testimonial.name}</div>
            <div className="text-xs text-gray-500">{testimonial.location}</div>
          </div>
        </div>

        {/* System & savings */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-sm">
          <span className="text-gray-500 text-xs">{testimonial.systemSize}</span>
          <span className="font-semibold text-green-600 text-xs">
            Saving {testimonial.savings}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Single featured testimonial for compact display
 */
export function FeaturedTestimonial({ className = '' }: { className?: string }) {
  const testimonial = TESTIMONIALS[0];

  return (
    <div className={`bg-gray-50 rounded-xl p-4 ${className}`}>
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className="w-4 h-4 text-yellow-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <p className="text-sm text-gray-700 italic mb-2">
        &ldquo;{testimonial.quote.substring(0, 100)}...&rdquo;
      </p>
      <p className="text-xs text-gray-500">
        — {testimonial.name}, {testimonial.location}
      </p>
    </div>
  );
}
