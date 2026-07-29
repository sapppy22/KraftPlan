'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Play, Flame, TrendingUp, Calendar, Dumbbell, Loader2, Trophy, ArrowRight, Zap } from 'lucide-react';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/Card';
import { HyroxAmbientVideo } from '@/components/HyroxAmbientVideo';
import { WorkoutAnalytics } from '@/components/dashboard/WorkoutAnalytics';
import { useAuth } from '@/lib/AuthContext';
import { formatDuration, formatKg, formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isGuest } = useAuth();
  const [startingSession, setStartingSession] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.getDashboard(),
  });

  const firstName = isGuest ? 'Athlete' : user?.name?.split(' ')[0] || 'Athlete';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const handleStartSession = async () => {
    if (!data?.today || data.today.isRestDay || startingSession) return;
    setStartingSession(true);
    try {
      const res = await api.startSession({
        planDayId: data.today.dayId,
        date: new Date().toISOString().split('T')[0],
      });
      router.push(`/workout/${res.id}`);
    } catch (err) {
      console.error('Failed to start session', err);
      setStartingSession(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  const isRest = data?.today?.isRestDay;
  const stats = [
    { icon: Flame, label: 'Current streak', value: `${data?.streak || 0}`, unit: 'days', tint: 'bg-warning/10 text-warning' },
    {
      icon: Calendar,
      label: 'This week',
      value: `${data?.thisWeek?.completed || 0}`,
      unit: `/ ${data?.thisWeek?.scheduled || '—'}`,
      tint: 'icon-chip',
    },
    { icon: Dumbbell, label: '30-day volume', value: formatKg(data?.volume30d), unit: '', tint: 'icon-chip' },
    {
      icon: Trophy,
      label: 'Top PR',
      value: data?.prs?.[0] ? `${data.prs[0].value}` : '—',
      unit: data?.prs?.[0] ? 'kg' : '',
      tint: 'icon-chip',
    },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-3 animate-fade-in">
        <div>
          <p className="text-sm font-medium text-brand-green">{greeting},</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">{firstName} 👋</h1>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-surface-1 border border-hairline text-xs font-medium text-text-secondary">
          <Calendar className="w-3.5 h-3.5" />
          {todayLabel}
        </span>
      </div>

      {/* Guests can't follow a plan — steer them straight into a custom workout */}
      {isGuest ? (
        <Link href="/workout/custom" className="block animate-fade-in" style={{ animationDelay: '60ms' }}>
          <Card hero className="p-6 sm:p-7">
            <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <Dumbbell className="absolute -right-5 -bottom-8 w-40 h-40 text-white/10 rotate-12 pointer-events-none" strokeWidth={1.25} />
            <div className="relative space-y-4">
              <span className="inline-flex items-center gap-1.5 text-white/80 text-xs font-semibold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-kp-pulse" />
                Explore Mode
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight max-w-xl">
                Start a custom workout
              </h2>
              <p className="text-white/85 text-sm max-w-md">
                Pick your own exercises or let us generate one — no plan or account needed.
              </p>
              <span className="group inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-deep rounded-pill font-semibold shadow-sm">
                <Zap className="w-5 h-5" />
                Build a workout
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </Card>
        </Link>
      ) : (
      <div
        onClick={handleStartSession}
        className={`animate-fade-in ${isRest || startingSession ? 'cursor-default' : 'cursor-pointer'}`}
        style={{ animationDelay: '60ms' }}
      >
        <Card hero className="p-6 sm:p-7">
          {data?.today?.category === 'hyrox' && <HyroxAmbientVideo className="-z-10" overlayClassName="bg-black/50" />}
          {/* Decorative watermark + glow (kept subtle, brand-safe) */}
          <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <Dumbbell className="absolute -right-5 -bottom-8 w-40 h-40 text-white/10 rotate-12 pointer-events-none" strokeWidth={1.25} />

          <div className="relative space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-white/80 text-xs font-semibold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-kp-pulse" />
                {isRest ? 'Rest Day' : "Today's Session"}
              </span>
              {!isRest && data?.today?.estimatedMinutes != null && (
                <span className="flex items-center gap-1 text-white/80 text-sm font-medium">
                  <Calendar className="w-4 h-4" />
                  {data?.today?.estimatedMinutes} min
                </span>
              )}
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight max-w-xl">
              {data?.today?.title || (isRest ? 'Recovery & mobility' : 'No session scheduled')}
            </h2>
            {!isRest && (
              <button
                disabled={startingSession}
                className="group inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-deep hover:bg-white/90 rounded-pill font-semibold transition-all shadow-sm disabled:opacity-60"
              >
                {startingSession ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5 fill-current" />
                )}
                Start session
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        </Card>
      </div>
      )}

      {/* Guest upsell — one gentle nudge toward an account */}
      {isGuest && (
        <p className="text-xs text-text-secondary -mt-1">
          You're in Explore Mode.{' '}
          <Link href="/register" className="text-brand-green font-medium hover:underline">
            Create a free account
          </Link>{' '}
          to unlock training plans, saved progress and PRs.
        </p>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <Card
              key={s.label}
              interactive
              className="stat-tile p-4 animate-fade-in"
              style={{ animationDelay: `${120 + i * 60}ms` }}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.tint}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold mt-3 leading-none">
                {s.value}
                {s.unit && <span className="text-sm text-text-secondary font-normal ml-1">{s.unit}</span>}
              </p>
              <p className="text-xs text-text-secondary mt-1.5">{s.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Quick start — build an ad-hoc workout without a plan (members) */}
      {!isGuest && (
        <Link href="/workout/custom" className="block">
          <Card interactive className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl icon-chip flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Start a custom workout</p>
                <p className="text-xs text-text-secondary">Build your own session or generate one instantly</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-text-secondary shrink-0" />
          </Card>
        </Link>
      )}

      {/* Visual analytics — completed workouts over time */}
      <WorkoutAnalytics />

      {/* Program Progress */}
      {data?.programProgress && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-green" />
              <h3 className="font-semibold">Program Progress</h3>
            </div>
            <span className="px-2.5 py-1 rounded-pill bg-brand-green/10 text-brand-green text-xs font-semibold">
              Week {data.programProgress.currentWeek} / {data.programProgress.totalWeeks}
            </span>
          </div>
          <div className="relative h-2.5 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 gradient-bg rounded-full transition-all duration-700 ease-out"
              style={{ width: `${data.programProgress.percent}%` }}
            />
          </div>
          <p className="text-sm text-text-secondary mt-2">
            <span className="font-semibold text-text-primary">{data.programProgress.percent}%</span> complete — keep it up!
          </p>
        </Card>
      )}

      {/* PR Highlights */}
      {data?.prs && data.prs.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-brand-green" />
            Personal Records
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {data.prs.slice(0, 5).map((pr: any) => (
              <Card key={`${pr.exerciseId}-${pr.metric}`} interactive className="p-4 min-w-[168px] shrink-0">
                <div className="w-8 h-8 rounded-lg icon-chip flex items-center justify-center mb-2">
                  <Trophy className="w-4 h-4" />
                </div>
                <p className="text-sm text-text-secondary truncate">{pr.exerciseName}</p>
                <p className="text-xl font-bold mt-0.5">
                  {pr.value}
                  <span className="text-xs text-text-secondary font-normal ml-1">
                    {pr.metric === 'e1rm' ? 'kg e1RM' : 'kg'}
                  </span>
                </p>
                {pr.deltaPct && <span className="text-xs text-success font-medium">+{pr.deltaPct}%</span>}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      {data?.recentSessions && data.recentSessions.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-brand-green" />
            Recent Sessions
          </h3>
          <div className="space-y-2">
            {data.recentSessions.map((session: any) => (
              <Card key={session.id} interactive className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl icon-chip flex items-center justify-center shrink-0">
                    <Dumbbell className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{session.title || 'Workout'}</p>
                    <p className="text-sm text-text-secondary">{formatDate(session.date)}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-text-primary shrink-0">{formatKg(session.totalVolumeKg)}</p>
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
          <p className="text-text-secondary mt-1">
            {isGuest ? 'Jump in with a custom workout — no plan needed' : 'Start by picking a plan that fits your goals'}
          </p>
          <Link href={isGuest ? '/workout/custom' : '/plans'}>
            <button className="mt-4 px-6 py-2.5 gradient-bg rounded-pill text-white font-semibold">
              {isGuest ? 'Start a custom workout' : 'Browse plans'}
            </button>
          </Link>
        </Card>
      )}
    </div>
  );
}
