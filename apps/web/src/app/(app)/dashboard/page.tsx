'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Play, Flame, TrendingUp, Calendar, Dumbbell, Loader2 } from 'lucide-react';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/Card';
import { formatDuration, formatKg, formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.getDashboard(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <p className="text-text-secondary mt-1">Track your progress, crush your goals</p>
      </div>

      {/* Today's session */}
      <Link href={data?.today?.isRestDay ? '#' : '/workout/new'}>
        <Card hero className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-sm font-medium uppercase tracking-wider">
              {data?.today?.isRestDay ? 'Rest Day' : "Today's Session"}
            </span>
            {!data?.today?.isRestDay && (
              <span className="flex items-center gap-1 text-white/70 text-sm">
                <Calendar className="w-4 h-4" />
                {data?.today?.estimatedMinutes} min
              </span>
            )}
          </div>
          <h2 className="font-display text-2xl font-bold">
            {data?.today?.title || 'No session scheduled'}
          </h2>
          {!data?.today?.isRestDay && (
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-pill text-white font-semibold transition-all backdrop-blur-sm">
              <Play className="w-5 h-5 fill-white" />
              Start session
            </button>
          )}
        </Card>
      </Link>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-text-secondary text-sm">
            <Flame className="w-4 h-4 text-warning" />
            Streak
          </div>
          <p className="text-2xl font-bold mt-1">{data?.streak || 0} days</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-text-secondary text-sm">
            <Calendar className="w-4 h-4 text-accent-cyan" />
            This Week
          </div>
          <p className="text-2xl font-bold mt-1">
            {data?.thisWeek?.completed || 0}
            <span className="text-text-secondary text-base font-normal">
              {' '}
              / {data?.thisWeek?.scheduled || '-'} sessions
            </span>
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-text-secondary text-sm">
            <Dumbbell className="w-4 h-4 text-accent-blue" />
            30d Volume
          </div>
          <p className="text-2xl font-bold mt-1">{formatKg(data?.volume30d)}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-text-secondary text-sm">
            <TrendingUp className="w-4 h-4 text-success" />
            Top PR
          </div>
          <p className="text-2xl font-bold mt-1">
            {data?.prs?.[0] ? `${data.prs[0].value}kg` : 'No PRs'}
          </p>
        </Card>
      </div>

      {/* Program Progress */}
      {data?.programProgress && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Program Progress</h3>
            <span className="text-sm text-text-secondary">
              Week {data.programProgress.currentWeek} of {data.programProgress.totalWeeks}
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full gradient-bg rounded-full transition-all duration-500"
              style={{ width: `${data.programProgress.percent}%` }}
            />
          </div>
          <p className="text-sm text-text-secondary mt-2">{data.programProgress.percent}% complete</p>
        </Card>
      )}

      {/* PR Highlights */}
      {data?.prs && data.prs.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Personal Records</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {data.prs.slice(0, 5).map((pr: any) => (
              <Card key={`${pr.exerciseId}-${pr.metric}`} className="p-4 min-w-[160px] shrink-0">
                <p className="text-sm text-text-secondary truncate">{pr.exerciseName}</p>
                <p className="text-xl font-bold mt-1">{pr.value}{pr.metric === 'e1rm' ? 'kg e1RM' : 'kg'}</p>
                {pr.deltaPct && (
                  <span className="text-xs text-success">+{pr.deltaPct}%</span>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      {data?.recentSessions && data.recentSessions.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Recent Sessions</h3>
          <div className="space-y-2">
            {data.recentSessions.map((session: any) => (
              <Card key={session.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{session.title || 'Workout'}</p>
                  <p className="text-sm text-text-secondary">{formatDate(session.date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatKg(session.totalVolumeKg)}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No sessions state */}
      {(!data?.recentSessions || data.recentSessions.length === 0) && (
        <Card className="p-8 text-center">
          <Dumbbell className="w-12 h-12 text-text-secondary mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold">No sessions yet</h3>
          <p className="text-text-secondary mt-1">Start by picking a plan that fits your goals</p>
          <Link href="/plans">
            <button className="mt-4 px-6 py-2.5 gradient-bg rounded-pill text-white font-semibold">
              Browse plans
            </button>
          </Link>
        </Card>
      )}
    </div>
  );
}
