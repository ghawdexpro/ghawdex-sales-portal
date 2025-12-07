'use client';

import { useState, useEffect } from 'react';

/**
 * REWS 2025 Grant Countdown Timer (Dark Theme)
 *
 * Shows countdown to grant deadline with urgency messaging.
 * Designed for dark landing pages with amber/orange accents.
 */

interface GrantCountdownDarkProps {
  /** Custom deadline (default: Dec 31, 2025) */
  deadline?: Date;
  /** Additional CSS classes */
  className?: string;
}

export default function GrantCountdownDark({
  deadline = new Date('2025-12-31T23:59:59'),
  className = '',
}: GrantCountdownDarkProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [mounted, setMounted] = useState(false);

  function calculateTimeLeft() {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      expired: false,
    };
  }

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  if (!mounted) {
    return null;
  }

  if (timeLeft.expired) {
    return (
      <div className={`text-center ${className}`}>
        <p className="text-red-400 font-semibold">
          REWS 2025 Grant Period Has Ended
        </p>
      </div>
    );
  }

  // Determine urgency level
  const isUrgent = timeLeft.days < 30;
  const isCritical = timeLeft.days < 7;

  return (
    <div className={className}>
      <div className={`rounded-2xl p-6 sm:p-8 border ${
        isCritical
          ? 'bg-gradient-to-r from-red-900/30 to-red-800/20 border-red-500/30'
          : isUrgent
          ? 'bg-gradient-to-r from-amber-900/30 to-orange-900/20 border-amber-500/30'
          : 'bg-gradient-to-r from-amber-900/20 to-orange-900/10 border-amber-500/20'
      }`}>
        <div className="text-center">
          {/* Header */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className={`w-2 h-2 rounded-full animate-pulse ${
              isCritical ? 'bg-red-400' : 'bg-amber-400'
            }`} />
            <h3 className={`text-sm font-semibold uppercase tracking-wide ${
              isCritical ? 'text-red-300' :
              isUrgent ? 'text-amber-300' :
              'text-amber-200'
            }`}>
              {isCritical ? 'Final Days - Act Now!' : isUrgent ? 'Limited Time Remaining' : 'REWS 2025 Grant Available'}
            </h3>
          </div>

          {/* Countdown Display */}
          <div className="flex justify-center gap-3 sm:gap-4 mb-4">
            <TimeUnit value={timeLeft.days} label="Days" isCritical={isCritical} />
            <span className="text-2xl sm:text-3xl font-bold text-white/30 self-center">:</span>
            <TimeUnit value={timeLeft.hours} label="Hours" isCritical={isCritical} />
            <span className="text-2xl sm:text-3xl font-bold text-white/30 self-center">:</span>
            <TimeUnit value={timeLeft.minutes} label="Min" isCritical={isCritical} />
            <span className="text-2xl sm:text-3xl font-bold text-white/30 self-center hidden sm:block">:</span>
            <div className="hidden sm:block">
              <TimeUnit value={timeLeft.seconds} label="Sec" isCritical={isCritical} />
            </div>
          </div>

          {/* Message */}
          <p className={`text-sm ${
            isCritical ? 'text-red-300' :
            isUrgent ? 'text-amber-300/80' :
            'text-gray-400'
          }`}>
            {isCritical
              ? 'Grant budget may be exhausted before deadline - Secure your spot TODAY!'
              : isUrgent
              ? 'Installations filling up fast - Book your free assessment now'
              : 'Lock in your solar savings with up to €11,550 in government grants'}
          </p>

          {/* Grant Stats */}
          <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-white/10">
            <div className="text-center">
              <div className="text-lg font-bold text-amber-400">50%</div>
              <div className="text-xs text-gray-500">Solar Grant</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-amber-400">95%</div>
              <div className="text-xs text-gray-500">Battery (Gozo)</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-amber-400">€11,550</div>
              <div className="text-xs text-gray-500">Max Available</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimeUnit({ value, label, isCritical }: { value: number; label: string; isCritical: boolean }) {
  return (
    <div className="text-center">
      <div className={`rounded-xl px-3 sm:px-4 py-2 sm:py-3 min-w-[50px] sm:min-w-[60px] ${
        isCritical
          ? 'bg-red-500/20 border border-red-500/30'
          : 'bg-white/5 border border-white/10'
      }`}>
        <span className={`text-2xl sm:text-3xl font-bold tabular-nums ${
          isCritical ? 'text-red-300' : 'text-white'
        }`}>
          {value.toString().padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs text-gray-500 mt-1 block">{label}</span>
    </div>
  );
}

/**
 * Compact countdown for sticky header or inline use
 */
export function GrantCountdownCompact({ className = '' }: { className?: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0 });
  const [mounted, setMounted] = useState(false);
  const deadline = new Date('2025-12-31T23:59:59');

  useEffect(() => {
    setMounted(true);

    function calculate() {
      const diff = deadline.getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0 };
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      };
    }

    setTimeLeft(calculate());
    const timer = setInterval(() => setTimeLeft(calculate()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) return null;

  const isUrgent = timeLeft.days < 30;

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
        isUrgent ? 'bg-red-400' : 'bg-amber-400'
      }`} />
      <span className={`text-xs font-medium ${
        isUrgent ? 'text-red-300' : 'text-amber-300'
      }`}>
        REWS 2025: {timeLeft.days}d {timeLeft.hours}h left
      </span>
    </span>
  );
}
