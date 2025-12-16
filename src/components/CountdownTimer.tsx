
'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: Date | null;
  onFinish?: () => void;
}

export default function CountdownTimer({ targetDate, onFinish }: CountdownTimerProps) {
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [hasFinished, setHasFinished] = useState(false);

  useEffect(() => {
    if (!targetDate) {
      setRemainingTime(null);
      return;
    }

    const calculateRemaining = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      return Math.max(0, difference);
    };

    setRemainingTime(calculateRemaining());
    setHasFinished(calculateRemaining() === 0);

    const intervalId = setInterval(() => {
      const newRemainingTime = calculateRemaining();
      setRemainingTime(newRemainingTime);

      if (newRemainingTime === 0 && !hasFinished) {
        if (onFinish) {
          onFinish();
        }
        setHasFinished(true);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [targetDate, onFinish, hasFinished]);

  const formatTime = (ms: number | null) => {
    if (ms === null) {
      return '--:--:--';
    }

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const timeString = [
      String(hours).padStart(2, '0'),
      String(minutes).padStart(2, '0'),
      String(seconds).padStart(2, '0'),
    ].join(':');

    return timeString;
  };

  const isFinished = remainingTime === 0;
  const isUrgent = remainingTime !== null && remainingTime <= 5 * 60 * 1000 && remainingTime > 0;
  const isWarning = remainingTime !== null && remainingTime < 10 * 60 * 1000 && remainingTime > 0;

  let timerClasses = 'text-green-500';

  if (isFinished) {
    timerClasses = 'text-muted-foreground';
  } else if (isUrgent) {
    timerClasses = 'text-red-500 animate-pulse-urgent';
  } else if (isWarning) {
    timerClasses = 'text-yellow-500';
  }

  return (
    <span className={timerClasses}>
      {formatTime(remainingTime)}
    </span>
  );
}
