'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  ArrowRight, Dumbbell, Flame, Footprints, HeartPulse, Loader2, Plus, Trash2, UtensilsCrossed,
} from 'lucide-react';
import { CARDIO_ACTIVITIES } from '@kraftplan/shared';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const IN_COLOR = '#0D9488';  // teal — calories in
const OUT_COLOR = '#059669'; // emerald — calories out

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-elevated border border-hairline rounded-xl px-3 py-2 text-xs shadow-xl space-y-0.5">
      <p className="text-text-secondary mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="font-semibold" style={{ color: p.color }}>
          {p.name}: {p.value} kcal
        </p>
      ))}
    </div>
  );
}

/** Side-by-side bars: what went in vs what went out. */
function BalanceBars({ caloriesIn, caloriesOut }: { caloriesIn: number; caloriesOut: number }) {
  const max = Math.max(caloriesIn, caloriesOut, 1);
  const rows = [
    { label: 'Calories in', value: caloriesIn, tint: 'bg-brand-teal', icon: UtensilsCrossed },
    { label: 'Calories out', value: caloriesOut, tint: 'bg-brand-green', icon: Flame },
  ];
  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const Icon = r.icon;
        return (
          <div key={r.label}>
            <div className="flex justify-between items-center text-sm mb-1.5">
              <span className="text-text-secondary flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5" />
                {r.label}
              </span>
              <span className="font-bold">{r.value.toLocaleString()}</span>
            </div>
            <div className="h-2.5 rounded-full bg-surface-2 overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', r.tint)}
                style={{ width: `${Math.round((r.value / max) * 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ActivityPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'steps' | 'cardio'>('steps');
  const [steps, setSteps] = useState('');
  const [cardio, setCardio] = useState({ activityId: 'running', durationMin: '', distanceM: '', note: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['activity', 'day'],
    queryFn: () => api.getActivityDay(),
  });
  const { data: trend } = useQuery({
    queryKey: ['activity', 'trend'],
    queryFn: () => api.getActivityTrend(7),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['activity'] });
    queryClient.invalidateQueries({ queryKey: ['nutrition'] });
  };

  const logActivity = useMutation({
    mutationFn: (entry: any) => api.logActivity(entry),
    onSuccess: refresh,
  });
  const removeActivity = useMutation({
    mutationFn: (id: string) => api.deleteActivity(id),
    onSuccess: refresh,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
      </div>
    );
  }

  const balance = data?.balance ?? { caloriesIn: 0, caloriesOut: 0, baselineOut: 0, exerciseOut: 0, net: 0 };
  const workouts: any[] = data?.activity?.workouts ?? [];
  const manual: any[] = data?.activity?.manual ?? [];
  const daySteps: number = data?.activity?.steps ?? 0;
  const complete = !!data?.complete;

  const chartData = (trend?.days ?? []).map((d: any) => ({
    day: new Date(`${d.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' }),
    In: d.caloriesIn,
    Out: d.caloriesOut,
  }));

  const inputClass =
    'w-full px-3 py-2.5 bg-bg-elevated border border-hairline rounded-xl text-text-primary text-sm focus:outline-none focus:border-brand-green';

  function submitSteps(e: React.FormEvent) {
    e.preventDefault();
    const value = parseInt(steps, 10);
    if (!Number.isFinite(value) || value <= 0) return;
    logActivity.mutate({ type: 'steps', steps: value }, { onSuccess: () => setSteps('') });
  }

  function submitCardio(e: React.FormEvent) {
    e.preventDefault();
    const minutes = parseFloat(cardio.durationMin);
    if (!Number.isFinite(minutes) || minutes <= 0) return;
    logActivity.mutate(
      {
        type: 'cardio',
        activityId: cardio.activityId,
        durationMin: minutes,
        distanceM: parseFloat(cardio.distanceM) || null,
        note: cardio.note.trim() || CARDIO_ACTIVITIES.find((a) => a.id === cardio.activityId)?.label || null,
      },
      { onSuccess: () => setCardio({ ...cardio, durationMin: '', distanceM: '', note: '' }) },
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-brand-green">Activity</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Calories in vs out</h1>
        </div>
        <Link
          href="/nutrition"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-surface-1 border border-hairline text-xs font-medium text-text-secondary hover:text-text-primary"
        >
          <UtensilsCrossed className="w-3.5 h-3.5" />
          Food log
        </Link>
      </div>

      {!complete && (
        <Card className="flex items-center justify-between gap-3">
          <p className="text-sm text-text-secondary">
            Add your height, weight, age and sex to turn these logs into a real energy balance.
          </p>
          <Link
            href="/nutrition"
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 gradient-bg rounded-pill text-white text-sm font-semibold"
          >
            Set up
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Card>
      )}

      {/* ── Today's balance ────────────────────────────────────────────────── */}
      <Card className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Today</h2>
          <span
            className={cn(
              'px-3 py-1 rounded-pill text-xs font-bold',
              balance.net < 0 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning',
            )}
          >
            {balance.net < 0 ? `${Math.abs(balance.net).toLocaleString()} kcal deficit` : `${balance.net.toLocaleString()} kcal surplus`}
          </span>
        </div>

        <BalanceBars caloriesIn={balance.caloriesIn} caloriesOut={balance.caloriesOut} />

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-bg-elevated">
            <p className="text-xs text-text-secondary mb-1">Resting + daily</p>
            <p className="font-bold">{balance.baselineOut.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-xl bg-bg-elevated">
            <p className="text-xs text-text-secondary mb-1">Exercise</p>
            <p className="font-bold">{balance.exerciseOut.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-xl bg-bg-elevated">
            <p className="text-xs text-text-secondary mb-1">Steps</p>
            <p className="font-bold">{daySteps.toLocaleString()}</p>
          </div>
        </div>
      </Card>

      {/* ── 7-day trend ────────────────────────────────────────────────────── */}
      {chartData.length > 0 && (
        <Card className="space-y-4">
          <h2 className="font-semibold">Last 7 days</h2>
          <div className="h-56 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} width={44} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-1)' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="In" fill={IN_COLOR} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Out" fill={OUT_COLOR} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* ── Workouts (synced automatically) ────────────────────────────────── */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-brand-green" />
            Workouts
          </h2>
          <span className="text-xs text-text-secondary">Synced from the app</span>
        </div>

        {workouts.length === 0 ? (
          <p className="text-sm text-text-secondary py-3 text-center">
            No sessions today — anything you train in the player lands here on its own.
          </p>
        ) : (
          <div className="space-y-2">
            {workouts.map((w) => (
              <div key={w.id} className="flex items-center gap-3 p-3 rounded-xl bg-bg-elevated border border-hairline">
                <div className="w-9 h-9 rounded-xl bg-brand-green/10 flex items-center justify-center shrink-0">
                  <Dumbbell className="w-4 h-4 text-brand-green" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{w.name}</p>
                  <p className="text-xs text-text-secondary">
                    {w.durationMin} min
                    {w.volumeKg ? ` · ${w.volumeKg.toLocaleString()} kg volume` : ''}
                    {w.status === 'active' ? ' · in progress' : ''}
                  </p>
                </div>
                <span className="text-sm font-bold shrink-0">{w.caloriesOut}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Manual logging ─────────────────────────────────────────────────── */}
      <Card className="space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-brand-green" />
          Steps &amp; outside cardio
        </h2>

        <div className="flex gap-2">
          {([
            { id: 'steps' as const, label: 'Steps', icon: Footprints },
            { id: 'cardio' as const, label: 'Cardio', icon: HeartPulse },
          ]).map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex-1 py-2 rounded-xl text-sm font-medium border flex items-center justify-center gap-1.5 transition-colors',
                  tab === t.id
                    ? 'border-brand-green bg-brand-green/10 text-brand-green'
                    : 'border-hairline text-text-secondary hover:text-text-primary',
                )}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'steps' ? (
          <form onSubmit={submitSteps} className="space-y-2">
            <label className="block text-xs text-text-secondary">
              Today&apos;s step count {daySteps > 0 && <span className="text-text-primary">· {daySteps.toLocaleString()} logged</span>}
            </label>
            <div className="flex gap-2">
              <input
                type="number" min={0} inputMode="numeric"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                placeholder="e.g. 8400"
                className={inputClass}
                required
              />
              <button
                type="submit"
                disabled={logActivity.isPending}
                className="px-5 gradient-bg rounded-xl text-white text-sm font-semibold disabled:opacity-60"
              >
                Save
              </button>
            </div>
            <p className="text-[11px] text-text-secondary">
              Re-entering a new total replaces the day&apos;s count — it never double-counts.
            </p>
          </form>
        ) : (
          <form onSubmit={submitCardio} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <select
                value={cardio.activityId}
                onChange={(e) => setCardio({ ...cardio, activityId: e.target.value })}
                className={inputClass}
              >
                {CARDIO_ACTIVITIES.map((a) => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))}
              </select>
              <input
                type="number" min={1} inputMode="numeric"
                value={cardio.durationMin}
                onChange={(e) => setCardio({ ...cardio, durationMin: e.target.value })}
                placeholder="Minutes"
                className={inputClass}
                required
              />
            </div>
            <input
              type="number" min={0} inputMode="numeric"
              value={cardio.distanceM}
              onChange={(e) => setCardio({ ...cardio, distanceM: e.target.value })}
              placeholder="Distance in metres (optional)"
              className={inputClass}
            />
            <button
              type="submit"
              disabled={logActivity.isPending}
              className="w-full py-2.5 gradient-bg rounded-pill text-white text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              Log cardio
            </button>
          </form>
        )}

        {manual.length > 0 && (
          <div className="space-y-2 pt-1">
            {manual.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-bg-elevated border border-hairline">
                <div className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center shrink-0">
                  {m.type === 'steps' ? (
                    <Footprints className="w-4 h-4 text-text-secondary" />
                  ) : (
                    <HeartPulse className="w-4 h-4 text-text-secondary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate capitalize">{m.name}</p>
                  <p className="text-xs text-text-secondary">
                    {m.type === 'steps'
                      ? `${(m.steps ?? 0).toLocaleString()} steps`
                      : [
                          m.durationMin ? `${m.durationMin} min` : null,
                          m.distanceM ? `${(m.distanceM / 1000).toFixed(2)} km` : null,
                        ].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span className="text-sm font-bold shrink-0">{m.caloriesOut}</span>
                <button
                  onClick={() => removeActivity.mutate(m.id)}
                  disabled={removeActivity.isPending}
                  className="p-1.5 rounded-lg text-text-secondary hover:text-danger hover:bg-danger/10 disabled:opacity-50"
                  aria-label={`Remove ${m.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
