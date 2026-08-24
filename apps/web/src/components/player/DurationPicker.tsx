'use client';

import { Minus, Plus } from 'lucide-react';
import { formatClock } from '@/lib/exerciseData';
import { cn } from '@/lib/utils';

interface Props {
  value: number;
  onChange: (sec: number) => void;
  /** The prescription this exercise came with, shown when the user has changed it. */
  prescribedSec?: number | null;
  presets?: number[];
}

const DEFAULT_PRESETS = [30, 60, 120, 300, 600];
const STEP_SEC = 15;
const MIN_SEC = 15;
const MAX_SEC = 3600;

/**
 * Sets the clock for a timed exercise. The prescribed duration is the starting
 * point, but endurance work is personal — the athlete picks what they'll
 * actually hold before the countdown starts.
 */
export function DurationPicker({ value, onChange, prescribedSec, presets = DEFAULT_PRESETS }: Props) {
  const clamp = (sec: number) => Math.min(MAX_SEC, Math.max(MIN_SEC, sec));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">Set your clock</span>
        {prescribedSec != null && prescribedSec !== value && (
          <button
            onClick={() => onChange(prescribedSec)}
            className="text-xs text-brand-green hover:underline"
          >
            Reset to {formatClock(prescribedSec)}
          </button>
        )}
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => onChange(clamp(value - STEP_SEC))}
          disabled={value <= MIN_SEC}
          className="w-11 h-11 rounded-full bg-bg-elevated border border-hairline flex items-center justify-center text-text-primary disabled:opacity-40"
          aria-label="15 seconds less"
        >
          <Minus className="w-5 h-5" />
        </button>
        <span className="font-display text-4xl font-bold tabular-nums w-28 text-center">
          {formatClock(value)}
        </span>
        <button
          onClick={() => onChange(clamp(value + STEP_SEC))}
          disabled={value >= MAX_SEC}
          className="w-11 h-11 rounded-full bg-bg-elevated border border-hairline flex items-center justify-center text-text-primary disabled:opacity-40"
          aria-label="15 seconds more"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex gap-2 justify-center flex-wrap">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={cn(
              'px-3 py-1.5 rounded-pill text-xs font-medium border transition-colors tabular-nums',
              value === p
                ? 'border-brand-green bg-brand-green/10 text-brand-green'
                : 'border-hairline text-text-secondary hover:text-text-primary',
            )}
          >
            {formatClock(p)}
          </button>
        ))}
      </div>
    </div>
  );
}
