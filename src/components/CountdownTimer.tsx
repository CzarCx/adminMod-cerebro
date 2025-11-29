
'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  startTime: string | null;
  estimatedMinutes: number | null;
}

export default function CountdownTimer({ startTime, estimatedMinutes }: CountdownTimerProps) {
  const [remainingTime, setRemainingTime] = useState<number | null>(null);

  useEffect(() => {
    if (!startTime || estimatedMinutes == null) {
      setRemainingTime(null);
      return;
    }

    const startDateTime = new Date(startTime);
    if (isNaN(startDateTime.getTime())) {
        setRemainingTime(null);
        return;
    }
    
    const endTime = new Date(startDateTime.getTime() + estimatedMinutes * 60000);

    const calculateRemaining = () => {
      const now = new Date();
      const difference = endTime.getTime() - now.getTime();
      return Math.max(0, difference); // Ensure time doesn't go negative
    };

    setRemainingTime(calculateRemaining());

    const intervalId = setInterval(() => {
      setRemainingTime(calculateRemaining());
    }, 1000);

    // Clean up the interval when the component unmounts or props change
    return () => clearInterval(intervalId);
  }, [startTime, estimatedMinutes]);

  const formatTime = (ms: number | null) => {
    if (ms === null) {
      return '--:--:--';
    }

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
      String(hours).padStart(2, '0'),
      String(minutes).padStart(2, '0'),
      String(seconds).padStart(2, '0'),
    ].join(':');
  };

  const isUrgent = remainingTime !== null && remainingTime <= 5 * 60 * 1000; // 5 minutes or less

  return (
    <span className={isUrgent ? 'text-red-500' : 'text-foreground'}>
      {formatTime(remainingTime)}
    </span>
  );
}

    