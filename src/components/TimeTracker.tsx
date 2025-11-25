'use client';

import { useEffect, useRef } from 'react';
import { trackTimeOnSite } from '@/lib/analytics';

export default function TimeTracker() {
  const timeTracked = useRef<Set<number>>(new Set());
  const startTime = useRef<number>(0);

  useEffect(() => {
    // Initialize start time when component mounts
    startTime.current = Date.now();

    // Time milestones in seconds: 30s, 1min, 3min, 5min, 10min
    const milestones = [30, 60, 180, 300, 600];

    const checkTimeOnSite = () => {
      const timeSpent = Math.floor((Date.now() - startTime.current) / 1000);

      milestones.forEach((milestone) => {
        if (timeSpent >= milestone && !timeTracked.current.has(milestone)) {
          timeTracked.current.add(milestone);
          trackTimeOnSite(milestone);
        }
      });
    };

    // Check time every 5 seconds
    const interval = setInterval(checkTimeOnSite, 5000);

    // Cleanup on unmount
    return () => {
      clearInterval(interval);
    };
  }, []);

  // This component doesn't render anything
  return null;
}
