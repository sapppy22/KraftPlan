'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { ACTIVITY_LEVELS } from '@kraftplan/shared';
import { cn } from '@/lib/utils';

export interface BodyMetricsValues {
  sex: string;
  age: string;
  heightCm: string;
  bodyweightKg: string;
  activityLevel: string;
}

interface Props {
  profile: any;
  saving?: boolean;
  onSave: (patch: Record<string, unknown>) => void;
}

/**
 * The four inputs BMI and Mifflin-St Jeor need. Age is collected instead of a
 * birth year because that's what people know off-hand — it's stored as a birth
 * year so the numbers stay right next year.
 */
export function BodyMetricsForm({ profile, saving, onSave }: Props) {
  const [values, setValues] = useState<BodyMetricsValues>({
    sex: '',
    age: '',
    heightCm: '',
    bodyweightKg: '',
    activityLevel: 'light',
  });

  useEffect(() => {
    if (!profile) return;
    setValues({
      sex: profile.sex ?? '',
      age: profile.age != null ? String(profile.age) : '',
      heightCm: profile.heightCm != null ? String(profile.heightCm) : '',
      bodyweightKg: profile.bodyweightKg != null ? String(profile.bodyweightKg) : '',
      activityLevel: profile.activityLevel ?? 'light',
    });
  }, [profile]);

  function set<K extends keyof BodyMetricsValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const age = parseInt(values.age, 10);
    onSave({
      sex: values.sex || null,
      birthYear: Number.isFinite(age) && age > 0 ? new Date().getFullYear() - age : null,
      heightCm: parseFloat(values.heightCm) || null,
      bodyweightKg: parseFloat(values.bodyweightKg) || null,
      activityLevel: values.activityLevel || null,
    });
  }

  const inputClass =
    'w-full px-3 py-2.5 bg-bg-elevated border border-hairline rounded-xl text-text-primary text-sm focus:outline-none focus:border-brand-green';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-text-secondary mb-1.5">Sex</label>
          <div className="grid grid-cols-2 gap-2">
            {['male', 'female'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set('sex', s)}
                className={cn(
                  'py-2.5 rounded-xl text-sm font-medium border capitalize transition-colors',
                  values.sex === s
                    ? 'border-brand-green bg-brand-green/10 text-brand-green'
                    : 'border-hairline bg-bg-elevated text-text-secondary hover:text-text-primary',
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1.5">Age</label>
          <input
            type="number" min={13} max={100} inputMode="numeric"
            value={values.age}
            onChange={(e) => set('age', e.target.value)}
            placeholder="28"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1.5">Height (cm)</label>
          <input
            type="number" min={100} max={250} inputMode="decimal"
            value={values.heightCm}
            onChange={(e) => set('heightCm', e.target.value)}
            placeholder="175"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1.5">Weight (kg)</label>
          <input
            type="number" min={30} max={300} step={0.1} inputMode="decimal"
            value={values.bodyweightKg}
            onChange={(e) => set('bodyweightKg', e.target.value)}
            placeholder="72"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-text-secondary mb-1.5">Daily activity (outside training)</label>
        <select
          value={values.activityLevel}
          onChange={(e) => set('activityLevel', e.target.value)}
          className={inputClass}
        >
          {ACTIVITY_LEVELS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label} — {l.hint}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 gradient-bg rounded-pill text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save my numbers
      </button>
    </form>
  );
}
