
'use client';

import { useState, useEffect } from 'react';

interface StopwatchProps {
  startTime: Date;
}

export default function Stopwatch({ startTime }: StopwatchProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const calculateElapsed = () => {
      const now = new Date();
      const difference = now.getTime() - startTime.getTime();
      return Math.max(0, difference);
    };

    setElapsedTime(calculateElapsed());

    const intervalId = setInterval(() => {
      setElapsedTime(calculateElapsed());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [startTime]);

  const formatTime = (ms: number) => {
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

  return (
    <span className="text-blue-500 animate-pulse">
      {formatTime(elapsedTime)}
    </span>
  );
}
