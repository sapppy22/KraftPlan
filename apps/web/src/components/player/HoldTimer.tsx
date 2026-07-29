'use client';

import { useState, useEffect, useRef } from 'react';
import { Pause, Play, RotateCcw, Check } from 'lucide-react';

interface HoldTimerProps {
  /** Target hold duration in seconds. */
  durationSec: number;
  /** Called when the hold ends — either the countdown hit zero or the user finished early. */
  onComplete: (heldSec: number) => void;
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * A reverse (countdown) timer for isometric holds and stretches. Starts
 * immediately, counts down to zero, then logs the hold. The user can pause,
 * reset, or finish early (which logs the time actually held).
 */
export function HoldTimer({ durationSec, onComplete }: HoldTimerProps) {
  const [remaining, setRemaining] = useState(durationSec);
  const [running, setRunning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          // Held the full target.
          onCompleteRef.current(durationSec);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, durationSec]);

  const circumference = 2 * Math.PI * 54;
  const progress = durationSec > 0 ? remaining / durationSec : 0;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="relative w-40 h-40">
        <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="var(--surface-2)" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="url(#holdGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
          <defs>
            <linearGradient id="holdGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0D9488" />
              <stop offset="50%" stopColor="#059669" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl font-bold tabular-nums">{fmt(remaining)}</span>
          <span className="text-xs text-text-secondary mt-0.5">hold</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setRunning((r) => !r)}
          className="w-11 h-11 flex items-center justify-center rounded-full bg-bg-elevated border border-hairline text-text-primary hover:bg-bg-surface transition-colors"
          aria-label={running ? 'Pause' : 'Resume'}
        >
          {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        <button
          onClick={() => { setRunning(false); setRemaining(durationSec); }}
          className="w-11 h-11 flex items-center justify-center rounded-full bg-bg-elevated border border-hairline text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Reset"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          onClick={() => onComplete(Math.max(1, durationSec - remaining))}
          className="flex items-center gap-2 px-5 h-11 rounded-pill gradient-bg text-white font-semibold text-sm"
        >
          <Check className="w-5 h-5" />
          Finish
        </button>
      </div>
    </div>
  );
}
