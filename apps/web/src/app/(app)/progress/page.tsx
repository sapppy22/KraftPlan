'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { Loader2, TrendingUp, Dumbbell, Calendar, Trophy } from 'lucide-react';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';

const ORANGE = '#059669'; // primary emerald
const AMBER  = '#0D9488'; // teal
const GREEN  = '#34D399'; // mint

function CustomTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-elevated border border-hairline rounded-xl px-3 py-2 text-sm shadow-xl">
      <p className="text-text-secondary text-xs mb-1">{label}</p>
      <p className="font-bold text-text-primary">{payload[0].value} {unit}</p>
    </div>
  );
}

export default function ProgressPage() {
  const [activeTab, setActiveTab] = useState<'strength' | 'endurance' | 'adherence'>('strength');

  const { data: prs, isLoading: prsLoading } = useQuery({ queryKey: ['prs'], queryFn: () => api.getPRs() });
  const { data: adherence, isLoading: adherenceLoading } = useQuery({ queryKey: ['adherence'], queryFn: () => api.getAdherence() });
  const { data: volume, isLoading: volumeLoading } = useQuery({ queryKey: ['volume'], queryFn: () => api.getVolume() });
  const { data: endurance, isLoading: enduranceLoading } = useQuery({ queryKey: ['endurance'], queryFn: () => api.getEndurance() });

  const tabs = [
    { id: 'strength' as const,  label: 'Strength',  icon: Dumbbell   },
    { id: 'endurance' as const, label: 'Endurance', icon: TrendingUp  },
    { id: 'adherence' as const, label: 'Adherence', icon: Calendar    },
  ];

  // Format volume data for chart
  const volumeChartData = (volume || []).map((v: any) => ({
    week: new Date(v.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    volume: Math.round(v.volumeKg),
  }));

  // Format adherence for heatmap + bar chart (last 8 weeks)
  const adherenceWeekly = (() => {
    if (!adherence?.length) return [];
    const weeks: Record<string, { done: number; total: number }> = {};
    adherence.forEach((d: any) => {
      const wk = new Date(d.date);
      wk.setDate(wk.getDate() - wk.getDay());
      const key = wk.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!weeks[key]) weeks[key] = { done: 0, total: 0 };
      weeks[key].total++;
      if (d.completed) weeks[key].done++;
    });
    return Object.entries(weeks).slice(-8).map(([week, v]) => ({
      week,
      pct: Math.round((v.done / v.total) * 100),
      done: v.done,
      total: v.total,
    }));
  })();

  const enduranceChartData = (endurance || []).map((e: any) => ({
    date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    km: parseFloat(e.distanceKm?.toFixed(2) || '0'),
  }));

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="font-display text-3xl font-bold">Progress</h1>
        <p className="text-text-secondary mt-1">Your personal records and training trends</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-bg-surface rounded-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive ? 'bg-brand-orange/10 text-brand-orange' : 'text-text-secondary hover:text-text-primary'
              }`}>
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── STRENGTH TAB ── */}
      {activeTab === 'strength' && (
        <div className="space-y-5">
          {prsLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-brand-orange" /></div>
          ) : prs && prs.length > 0 ? (
            <>
              <h3 className="font-semibold flex items-center gap-2">
                <Trophy className="w-4 h-4 text-brand-amber" /> Personal Records
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {prs.map((pr: any) => (
                  <Card key={`${pr.exerciseId}-${pr.metric}`} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{pr.exerciseName}</p>
                      <p className="text-xs text-text-secondary capitalize mt-0.5">{pr.metric.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-brand-orange">
                        {pr.value}<span className="text-sm font-normal text-text-secondary"> kg</span>
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">{formatDate(pr.achievedAt)}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <EmptyState icon={<Dumbbell />} title="No PRs yet" text="Complete workouts to set personal records" />
          )}

          {/* Volume chart */}
          {volumeLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-brand-orange" /></div>
          ) : volumeChartData.length > 0 ? (
            <Card className="p-5">
              <h3 className="font-semibold mb-4">Weekly Volume (kg lifted)</h3>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={volumeChartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={ORANGE} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={ORANGE} stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="week" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip content={<CustomTooltip unit="kg" />} />
                  <Area type="monotone" dataKey="volume" stroke={ORANGE} strokeWidth={2}
                    fill="url(#volGrad)" dot={{ fill: ORANGE, r: 3 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          ) : (
            <Card className="p-5 text-center text-text-secondary text-sm">
              Complete sessions to see volume trends
            </Card>
          )}
        </div>
      )}

      {/* ── ENDURANCE TAB ── */}
      {activeTab === 'endurance' && (
        <div className="space-y-5">
          {enduranceLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-brand-orange" /></div>
          ) : enduranceChartData.length > 0 ? (
            <Card className="p-5">
              <h3 className="font-semibold mb-4">Distance per Session (km)</h3>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={enduranceChartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="endGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={AMBER} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={AMBER} stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
                  <Tooltip content={<CustomTooltip unit="km" />} />
                  <Area type="monotone" dataKey="km" stroke={AMBER} strokeWidth={2}
                    fill="url(#endGrad)" dot={{ fill: AMBER, r: 3 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          ) : (
            <EmptyState icon={<TrendingUp />} title="No endurance data yet"
              text="Log running, rowing, or cycling sessions to see trends" />
          )}
        </div>
      )}

      {/* ── ADHERENCE TAB ── */}
      {activeTab === 'adherence' && (
        <div className="space-y-5">
          {adherenceLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-brand-orange" /></div>
          ) : adherence && adherence.length > 0 ? (
            <>
              {/* Weekly adherence bar chart */}
              {adherenceWeekly.length > 0 && (
                <Card className="p-5">
                  <h3 className="font-semibold mb-4">Weekly Completion Rate</h3>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={adherenceWeekly} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="week" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} unit="%" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} width={38} />
                      <Tooltip content={<CustomTooltip unit="%" />} />
                      <Bar dataKey="pct" fill={GREEN} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* Daily heatmap */}
              <Card className="p-5">
                <h3 className="font-semibold mb-3">Activity Heatmap</h3>
                <div className="flex flex-wrap gap-1.5">
                  {adherence.slice(-84).map((day: any) => (
                    <div key={day.date}
                      title={`${day.date}: ${day.completed ? 'Completed ✓' : 'No session'}`}
                      className={`w-4 h-4 rounded-sm transition-colors cursor-default ${
                        day.completed ? 'bg-success' : 'bg-surface-2'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-text-secondary mt-3">
                  Last {Math.min(84, adherence.length)} days
                </p>
              </Card>

              {/* Session log */}
              <Card className="p-5">
                <h3 className="font-semibold mb-3">Session Log</h3>
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {adherence.slice().reverse().map((day: any) => (
                    <div key={day.date} className="flex items-center justify-between py-1.5 border-b border-hairline last:border-0">
                      <span className="text-sm">{formatDate(day.date)}</span>
                      <span className={`text-sm font-medium ${day.completed ? 'text-success' : 'text-text-secondary'}`}>
                        {day.completed ? '✓ Done' : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <EmptyState icon={<Calendar />} title="No data yet"
              text="Complete your first session to start tracking adherence" />
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-12 h-12 text-text-secondary mx-auto mb-4 opacity-40">{icon}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-text-secondary mt-1 text-sm">{text}</p>
    </div>
  );
}
