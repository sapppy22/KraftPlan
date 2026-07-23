'use client';

import { useState, useEffect, useRef } from 'react';

interface RestTimerProps {
  restSec: number;
  onComplete: () => void;
  onSkip: () => void;
}

export function RestTimer({ restSec, onComplete, onSkip }: RestTimerProps) {
  const [remaining, setRemaining] = useState(restSec);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    setRemaining(restSec);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          onCompleteRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [restSec]);

  const circumference = 2 * Math.PI * 50;
  const strokeDashoffset = circumference * (1 - remaining / restSec);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="text-center">
        <svg className="w-32 h-32 mx-auto mb-4 transform -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="url(#timerGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
          <defs>
            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0D9488" />
              <stop offset="50%" stopColor="#059669" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
        </svg>
        <p className="text-4xl font-bold font-display">{remaining}s</p>
        <p className="text-text-secondary mt-2">Rest</p>
        <div className="flex gap-3 justify-center mt-6">
          <button
            onClick={onSkip}
            className="px-6 py-2.5 rounded-pill bg-bg-surface text-text-primary font-medium hover:bg-bg-elevated transition-colors"
          >
            Skip
          </button>
          <button
            onClick={() => setRemaining((r) => r + 15)}
            className="px-6 py-2.5 rounded-pill bg-brand-orange/10 text-brand-orange font-medium hover:bg-brand-orange/20 transition-colors"
          >
            +15s
          </button>
        </div>
      </div>
    </div>
  );
}
