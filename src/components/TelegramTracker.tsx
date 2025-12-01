'use client';

import { useEffect, useRef } from 'react';
import { trackTelegramVisitor, trackTelegramTimeMilestone } from '@/lib/telegram-events';

interface TelegramTrackerProps {
  prefilled?: boolean;
  name?: string;
}

export default function TelegramTracker({ prefilled, name }: TelegramTrackerProps) {
  const initialized = useRef(false);
  const startTime = useRef<number>(0);

  useEffect(() => {
    // Track visitor once on mount
    if (!initialized.current) {
      initialized.current = true;
      startTime.current = Date.now();

      // Send visitor notification
      trackTelegramVisitor(prefilled, name);
    }

    // Time milestone tracking
    const milestones = [60, 180, 300]; // 1min, 3min, 5min

    const checkTime = () => {
      const seconds = Math.floor((Date.now() - startTime.current) / 1000);

      milestones.forEach((milestone) => {
        if (seconds >= milestone) {
          trackTelegramTimeMilestone(milestone);
        }
      });
    };

    // Check every 10 seconds
    const interval = setInterval(checkTime, 10000);

    return () => clearInterval(interval);
  }, [prefilled, name]);

  return null;
}
