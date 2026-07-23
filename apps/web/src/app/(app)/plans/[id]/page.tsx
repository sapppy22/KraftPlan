'use client';


// Cloudflare Pages: dynamic routes must run on the Edge runtime.
export const runtime = 'edge';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ChevronLeft, Dumbbell, Clock, Calendar } from 'lucide-react';
import { api } from '@/lib/api/client';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function PlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: plan, isLoading } = useQuery({
    queryKey: ['plan', id],
    queryFn: () => api.getPlanDetail(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-16">
        <p className="text-text-secondary">Plan not found</p>
      </div>
    );
  }

  async function startPlan() {
    try {
      await api.assignPlan({
        planId: plan.id,
        startDate: new Date().toISOString().split('T')[0],
      });
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors text-sm"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to plans
      </button>

      {/* Hero */}
      <Card hero className="p-6 lg:p-8">
        <span className="inline-block px-3 py-1 rounded-pill text-xs font-medium bg-white/20 text-white capitalize mb-3">
          {plan.category}
        </span>
        <h1 className="font-display text-3xl lg:text-4xl font-bold">{plan.title}</h1>
        <p className="text-white/80 mt-3 text-lg">{plan.description}</p>
        <div className="flex flex-wrap items-center gap-4 mt-4 text-white/70 text-sm">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" /> {plan.durationWeeks} weeks
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" /> {plan.daysPerWeek} days/week
          </span>
          <span className="capitalize">{plan.difficulty}</span>
        </div>
      </Card>

      {/* Weekly structure */}
      {plan.weeks && (
        <div>
          <h2 className="font-display text-xl font-bold mb-4">Weekly Breakdown</h2>
          <div className="space-y-3">
            {plan.weeks.map((week: any) => (
              <Card key={week.id} className="p-4">
                <h3 className="font-semibold text-brand-orange">Week {week.weekNumber}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {week.days?.filter((d: any) => !d.isRestDay).map((day: any) => (
                    <span
                      key={day.id}
                      className="px-3 py-1 rounded-pill text-xs font-medium bg-bg-elevated"
                    >
                      Day {day.dayNumber}{day.title ? ` — ${day.title}` : ''}
                    </span>
                  ))}
                  {week.days?.filter((d: any) => d.isRestDay).map((day: any) => (
                    <span
                      key={day.id}
                      className="px-3 py-1 rounded-pill text-xs font-medium bg-bg-surface text-text-secondary"
                    >
                      Rest
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Equipment */}
      {plan.equipment && plan.equipment.length > 0 && (
        <div>
          <h2 className="font-display text-xl font-bold mb-3">Equipment Needed</h2>
          <div className="flex flex-wrap gap-2">
            {plan.equipment.map((eq: string) => (
              <span
                key={eq}
                className="px-4 py-2 rounded-pill text-sm border border-hairline capitalize"
              >
                {eq.replace(/-/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button size="lg" onClick={startPlan}>
          <Dumbbell className="w-4 h-4 mr-2" />
          Start this plan
        </Button>
      </div>
    </div>
  );
}
