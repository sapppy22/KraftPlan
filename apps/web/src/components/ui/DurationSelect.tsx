'use client';

import { DURATION_CHOICES, formatClock, formatDurationScheme } from '@/lib/exerciseData';

interface Props {
  /** Current target in seconds. */
  value: number;
  /** Receives the prescription string ("45s", "5 min") to store on the exercise. */
  onChange: (scheme: string) => void;
  className?: string;
}

/**
 * Clock picker for endurance work in the plan/workout builders — endurance
 * exercises are prescribed in time, so there's no rep field to fill in.
 */
export function DurationSelect({ value, onChange, className }: Props) {
  const options = DURATION_CHOICES.includes(value)
    ? DURATION_CHOICES
    : [...DURATION_CHOICES, value].sort((a, b) => a - b);

  return (
    <select
      value={String(value)}
      onChange={(e) => onChange(formatDurationScheme(parseInt(e.target.value, 10)))}
      className={className}
    >
      {options.map((sec) => (
        <option key={sec} value={sec}>
          {formatClock(sec)}
        </option>
      ))}
    </select>
  );
}
