'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, TrendingUp, Dumbbell, Calendar } from 'lucide-react';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';

export default function ProgressPage() {
  const [activeTab, setActiveTab] = useState<'strength' | 'endurance' | 'adherence'>('strength');

  const { data: prs, isLoading: prsLoading } = useQuery({
    queryKey: ['prs'],
    queryFn: () => api.getPRs(),
  });

  const { data: adherence, isLoading: adherenceLoading } = useQuery({
    queryKey: ['adherence'],
    queryFn: () => api.getAdherence(),
  });

  const { data: volume, isLoading: volumeLoading } = useQuery({
    queryKey: ['volume'],
    queryFn: () => api.getVolume(),
  });

  const tabs = [
    { id: 'strength' as const, label: 'Strength', icon: Dumbbell },
    { id: 'endurance' as const, label: 'Endurance', icon: TrendingUp },
    { id: 'adherence' as const, label: 'Adherence', icon: Calendar },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="font-display text-3xl font-bold">Progress</h1>
        <p className="text-text-secondary mt-1">Your personal records and trends</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-bg-surface rounded-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive ? 'bg-accent-blue/10 text-accent-blue' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Strength Tab */}
      {activeTab === 'strength' && (
        <div className="space-y-3">
          {prsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
            </div>
          ) : prs && prs.length > 0 ? (
            prs.map((pr: any) => (
              <Card key={`${pr.exerciseId}-${pr.metric}`} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{pr.exerciseName}</p>
                  <p className="text-sm text-text-secondary capitalize">{pr.metric.replace(/_/g, ' ')}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">{pr.value}
                    <span className="text-sm font-normal text-text-secondary">
                      {' '}{pr.metric === 'e1rm' ? 'kg' : 'kg'}
                    </span>
                  </p>
                  <p className="text-xs text-text-secondary">{formatDate(pr.achievedAt)}</p>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-16">
              <Dumbbell className="w-12 h-12 text-text-secondary mx-auto mb-4 opacity-50" />
              <h3 className="font-semibold">No PRs yet</h3>
              <p className="text-text-secondary mt-1 text-sm">Complete workouts to set personal records</p>
            </div>
          )}

          {/* Monthly Volume */}
          {volume && volume.length > 0 && (
            <div>
              <h3 className="font-semibold mt-6 mb-3">Volume Over Time</h3>
              <Card className="p-5">
                <div className="flex items-end gap-2 h-32">
                  {volume.slice(-12).map((v: any) => {
                    const maxVol = Math.max(...volume.map((x: any) => x.volumeKg), 1);
                    const height = (v.volumeKg / maxVol) * 100;
                    return (
                      <div key={v.week} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full gradient-bg rounded-t-md transition-all"
                          style={{ height: `${height}%`, minHeight: 4 }}
                        />
                        <span className="text-[10px] text-text-secondary">
                          {new Date(v.week).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Endurance Tab */}
      {activeTab === 'endurance' && (
        <div className="text-center py-16">
          <TrendingUp className="w-12 h-12 text-text-secondary mx-auto mb-4 opacity-50" />
          <h3 className="font-semibold">No endurance data yet</h3>
          <p className="text-text-secondary mt-1 text-sm">Log running, rowing, or cycling sessions to see trends</p>
        </div>
      )}

      {/* Adherence Tab */}
      {activeTab === 'adherence' && (
        <div className="space-y-4">
          {adherenceLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
            </div>
          ) : adherence && adherence.length > 0 ? (
            <>
              {/* Simple calendar heatmap */}
              <Card className="p-5">
                <h3 className="font-semibold mb-3">Recent Activity</h3>
                <div className="flex flex-wrap gap-1">
                  {adherence.slice(-84).map((day: any) => (
                    <div
                      key={day.date}
                      className={`w-3 h-3 rounded-sm ${
                        day.completed ? 'bg-success' : 'bg-white/10'
                      }`}
                      title={`${day.date}: ${day.completed ? 'Completed' : 'No session'}`}
                    />
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="font-semibold mb-3">Session Log</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {adherence.slice().reverse().map((day: any) => (
                    <div key={day.date} className="flex items-center justify-between py-1">
                      <span className="text-sm">{formatDate(day.date)}</span>
                      <span className={`text-sm ${day.completed ? 'text-success' : 'text-text-secondary'}`}>
                        {day.completed ? '✓ Completed' : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <div className="text-center py-16">
              <Calendar className="w-12 h-12 text-text-secondary mx-auto mb-4 opacity-50" />
              <h3 className="font-semibold">No data yet</h3>
              <p className="text-text-secondary mt-1 text-sm">Complete your first session to start tracking</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
