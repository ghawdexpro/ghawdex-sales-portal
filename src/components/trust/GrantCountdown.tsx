'use client';

import { useState, useEffect } from 'react';

/**
 * REWS 2025 Grant Countdown Timer
 *
 * Shows countdown to grant deadline with urgency messaging.
 * Displays differently based on time remaining.
 */

interface GrantCountdownProps {
  /** Show compact version (for wizard) */
  compact?: boolean;
  /** Custom deadline (default: Dec 31, 2025) */
  deadline?: Date;
  /** Additional CSS classes */
  className?: string;
}

export default function GrantCountdown({
  compact = false,
  deadline = new Date('2025-12-31T23:59:59'),
  className = '',
}: GrantCountdownProps) {
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
    return null; // Avoid hydration mismatch
  }

  if (timeLeft.expired) {
    return (
      <div className={`text-center ${className}`}>
        <p className="text-red-600 font-semibold">
          REWS 2025 Grant Period Has Ended
        </p>
      </div>
    );
  }

  // Determine urgency level
  const isUrgent = timeLeft.days < 30;
  const isCritical = timeLeft.days < 7;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          isCritical ? 'bg-red-100 text-red-700' :
          isUrgent ? 'bg-amber-100 text-amber-700' :
          'bg-green-100 text-green-700'
        }`}>
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          REWS 2025: {timeLeft.days}d left
        </span>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className={`rounded-xl p-4 ${
        isCritical ? 'bg-gradient-to-r from-red-50 to-red-100 border border-red-200' :
        isUrgent ? 'bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200' :
        'bg-gradient-to-r from-green-50 to-green-100 border border-green-200'
      }`}>
        <div className="text-center">
          <h3 className={`text-sm font-semibold uppercase tracking-wide mb-2 ${
            isCritical ? 'text-red-700' :
            isUrgent ? 'text-amber-700' :
            'text-green-700'
          }`}>
            {isCritical ? 'Final Days!' : isUrgent ? 'Limited Time!' : 'REWS 2025 Grant Available'}
          </h3>

          <div className="flex justify-center gap-3 sm:gap-4 mb-2">
            <TimeUnit value={timeLeft.days} label="Days" />
            <span className="text-2xl font-bold text-gray-400 self-center">:</span>
            <TimeUnit value={timeLeft.hours} label="Hours" />
            <span className="text-2xl font-bold text-gray-400 self-center">:</span>
            <TimeUnit value={timeLeft.minutes} label="Min" />
            {!isUrgent && (
              <>
                <span className="text-2xl font-bold text-gray-400 self-center hidden sm:block">:</span>
                <div className="hidden sm:block">
                  <TimeUnit value={timeLeft.seconds} label="Sec" />
                </div>
              </>
            )}
          </div>

          <p className={`text-xs ${
            isCritical ? 'text-red-600' :
            isUrgent ? 'text-amber-600' :
            'text-green-600'
          }`}>
            {isCritical
              ? 'Grant allocations may run out before deadline!'
              : isUrgent
              ? 'Secure your grant before it\'s too late'
              : 'Lock in your solar savings with government grants'}
          </p>
        </div>
      </div>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="bg-white rounded-lg shadow-sm px-3 py-2 min-w-[50px]">
        <span className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums">
          {value.toString().padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs text-gray-500 mt-1 block">{label}</span>
    </div>
  );
}
