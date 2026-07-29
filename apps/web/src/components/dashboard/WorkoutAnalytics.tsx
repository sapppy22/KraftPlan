'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  startOfWeek,
  startOfMonth,
  startOfYear,
  subWeeks,
  subMonths,
  subYears,
  isSameWeek,
  isSameMonth,
  isSameYear,
  format,
} from 'date-fns';
import { TrendingUp, TrendingDown, Minus, BarChart3, Loader2 } from 'lucide-react';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/Card';

type Period = 'weekly' | 'monthly' | 'yearly';

const PERIODS: { id: Period; label: string; unit: string }[] = [
  { id: 'weekly', label: 'Weekly', unit: 'week' },
  { id: 'monthly', label: 'Monthly', unit: 'month' },
  { id: 'yearly', label: 'Yearly', unit: 'year' },
];

// How much history to pull and how many buckets to show per period.
const RANGE_FOR: Record<Period, string> = { weekly: '90d', monthly: '1y', yearly: 'all' };
const BUCKETS_FOR: Record<Period, number> = { weekly: 8, monthly: 12, yearly: 5 };

interface Bucket {
  label: string;
  count: number;
  start: Date;
}

function sameBucket(period: Period, a: Date, b: Date) {
  if (period === 'weekly') return isSameWeek(a, b, { weekStartsOn: 1 });
  if (period === 'monthly') return isSameMonth(a, b);
  return isSameYear(a, b);
}

function buildBuckets(period: Period, data: { date: string; completed: boolean }[]): Bucket[] {
  const now = new Date();
  const n = BUCKETS_FOR[period];
  const buckets: Bucket[] = [];
  for (let i = n - 1; i >= 0; i--) {
    let start: Date;
    let label: string;
    if (period === 'weekly') {
      start = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
      label = format(start, 'd MMM');
    } else if (period === 'monthly') {
      start = startOfMonth(subMonths(now, i));
      label = format(start, 'MMM');
    } else {
      start = startOfYear(subYears(now, i));
      label = format(start, 'yyyy');
    }
    buckets.push({ start, label, count: 0 });
  }
  for (const rec of data) {
    if (!rec.completed) continue;
    const d = new Date(rec.date);
    const b = buckets.find((bk) => sameBucket(period, d, bk.start));
    if (b) b.count++;
  }
  return buckets;
}

export function WorkoutAnalytics() {
  const [period, setPeriod] = useState<Period>('weekly');

  const { data, isLoading } = useQuery({
    queryKey: ['adherence', RANGE_FOR[period]],
    queryFn: () => api.getAdherence(RANGE_FOR[period]),
  });

  const buckets = useMemo(() => buildBuckets(period, data || []), [period, data]);

  const current = buckets[buckets.length - 1]?.count ?? 0;
  const previous = buckets[buckets.length - 2]?.count ?? 0;
  const total = buckets.reduce((s, b) => s + b.count, 0);
  const unit = PERIODS.find((p) => p.id === period)!.unit;

  const deltaPct =
    previous > 0 ? Math.round(((current - previous) / previous) * 100) : current > 0 ? 100 : 0;
  const trendUp = current > previous;
  const trendFlat = current === previous;
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h3 className="font-semibold flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-brand-green" />
          Workout Analytics
        </h3>
        {/* Period toggle */}
        <div className="inline-flex rounded-pill bg-bg-elevated border border-hairline p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-all ${
                period === p.id ? 'gradient-bg text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-brand-orange" />
        </div>
      ) : total === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center text-center">
          <BarChart3 className="w-10 h-10 text-text-secondary opacity-30 mb-3" />
          <p className="text-sm text-text-secondary">No completed workouts yet</p>
          <p className="text-xs text-text-secondary mt-1">Finish a session and your progress will show up here.</p>
        </div>
      ) : (
        <>
          {/* KPI row — current vs previous period */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="p-3 rounded-xl bg-bg-elevated">
              <p className="text-xs text-text-secondary">This {unit}</p>
              <p className="text-2xl font-bold mt-0.5">{current}</p>
              <div
                className={`inline-flex items-center gap-1 mt-1 text-xs font-medium ${
                  trendFlat ? 'text-text-secondary' : trendUp ? 'text-success' : 'text-danger'
                }`}
              >
                {trendFlat ? <Minus className="w-3 h-3" /> : trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {trendFlat ? 'No change' : `${deltaPct > 0 ? '+' : ''}${deltaPct}%`}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-bg-elevated">
              <p className="text-xs text-text-secondary">Last {unit}</p>
              <p className="text-2xl font-bold mt-0.5">{previous}</p>
              <p className="text-xs text-text-secondary mt-1">workouts</p>
            </div>
            <div className="p-3 rounded-xl bg-bg-elevated">
              <p className="text-xs text-text-secondary">Total shown</p>
              <p className="text-2xl font-bold mt-0.5">{total}</p>
              <p className="text-xs text-text-secondary mt-1">workouts</p>
            </div>
          </div>

          {/* Trend chart */}
          <div className="h-48 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buckets} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--hairline)' }}
                />
                <YAxis
                  allowDecimals={false}
                  domain={[0, Math.max(2, maxCount)]}
                  tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <Tooltip
                  cursor={{ fill: 'var(--surface-1)' }}
                  contentStyle={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--hairline)',
                    borderRadius: 12,
                    fontSize: 12,
                    color: 'var(--text-primary)',
                  }}
                  labelStyle={{ color: 'var(--text-secondary)' }}
                  formatter={(value: any) => [`${value} workout${value === 1 ? '' : 's'}`, 'Completed']}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {buckets.map((_, i) => (
                    <Cell key={i} fill={i === buckets.length - 1 ? '#10B981' : 'rgba(16,185,129,0.4)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Card>
  );
}
