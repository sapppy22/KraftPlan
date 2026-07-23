'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Loader2, Dumbbell, Plus, Wand2, ChevronRight, Zap, Heart, Activity, Flame, Wind, StretchHorizontal } from 'lucide-react';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/Card';

// ── Category metadata ──────────────────────────────────────────────────────
const GOAL_LABELS: Record<string, string> = {
  mobility: 'Mobility', strength: 'Strength', hypertrophy: 'Hypertrophy',
  powerlifting: 'Powerlifting', hyrox: 'Hyrox', endurance: 'Endurance',
  athletic: 'Athletic', conditioning: 'Conditioning', weightloss: 'Weight Loss',
};

// Map plan goal-categories → exercise-type sections
const SECTIONS: Array<{
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  categories: string[];    // which plan categories belong here
}> = [
  {
    id: 'resistance',
    label: 'Resistance Training',
    description: 'Build muscle and strength with weighted exercises',
    icon: <Dumbbell className="w-5 h-5" />,
    color: 'text-blue-400',
    categories: ['strength', 'hypertrophy', 'powerlifting'],
  },
  {
    id: 'cardio',
    label: 'Cardio & Endurance',
    description: 'Improve cardiovascular fitness and stamina',
    icon: <Heart className="w-5 h-5" />,
    color: 'text-green-400',
    categories: ['endurance', 'conditioning', 'hyrox'],
  },
  {
    id: 'athletic',
    label: 'Athletic & Performance',
    description: 'Speed, power and sport-specific training',
    icon: <Zap className="w-5 h-5" />,
    color: 'text-yellow-400',
    categories: ['athletic'],
  },
  {
    id: 'weightloss',
    label: 'Weight Loss & HIIT',
    description: 'Burn fat with high-intensity circuit training',
    icon: <Flame className="w-5 h-5" />,
    color: 'text-orange-400',
    categories: ['weightloss'],
  },
  {
    id: 'mobility',
    label: 'Mobility & Recovery',
    description: 'Flexibility, joint health and active recovery',
    icon: <StretchHorizontal className="w-5 h-5" />,
    color: 'text-cyan-400',
    categories: ['mobility'],
  },
];

const DIFFICULTY_BADGE: Record<string, string> = {
  beginner: 'bg-green-500/15 text-green-400',
  intermediate: 'bg-yellow-500/15 text-yellow-400',
  advanced: 'bg-red-500/15 text-red-400',
};

export default function PlansPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.getPlans(),
  });

  const plansInSection = (sectionCategories: string[]) =>
    (plans ?? []).filter((p: any) => sectionCategories.includes(p.category));

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Training Plans</h1>
          <p className="text-text-secondary mt-1">Pick a program or build your own</p>
        </div>
        <Link href="/plans/custom">
          <button className="shrink-0 flex items-center gap-2 px-4 py-2.5 gradient-bg rounded-xl text-white font-semibold text-sm shadow-lg">
            <Wand2 className="w-4 h-4" />
            Build Custom
          </button>
        </Link>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/plans/custom" className="block">
          <Card interactive className="p-4 h-full border-brand-orange/20 bg-brand-orange/5 hover:border-brand-orange/50">
            <Wand2 className="w-6 h-6 text-brand-orange mb-2" />
            <p className="font-semibold text-sm">Custom Plan</p>
            <p className="text-xs text-text-secondary mt-0.5">Build your own split</p>
          </Card>
        </Link>
        <Link href="/workout/custom" className="block">
          <Card interactive className="p-4 h-full border-hairline hover:border-hairline-strong">
            <Zap className="w-6 h-6 text-brand-amber mb-2" />
            <p className="font-semibold text-sm">Quick Workout</p>
            <p className="text-xs text-text-secondary mt-0.5">Start without a plan</p>
          </Card>
        </Link>
      </div>

      {/* Section filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        <button
          onClick={() => setActiveSection(null)}
          className={`px-4 py-2 rounded-pill text-sm border whitespace-nowrap shrink-0 transition-all ${
            !activeSection
              ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
              : 'border-hairline bg-bg-surface text-text-secondary'
          }`}
        >
          All Plans
        </button>
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(activeSection === s.id ? null : s.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-pill text-sm border whitespace-nowrap shrink-0 transition-all ${
              activeSection === s.id
                ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
                : 'border-hairline bg-bg-surface text-text-secondary'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        </div>
      ) : (
        <>
          {/* Show sections */}
          {SECTIONS.filter((s) => !activeSection || s.id === activeSection).map((section) => {
            const sectionPlans = plansInSection(section.categories);
            if (!activeSection && sectionPlans.length === 0) return null;
            return (
              <div key={section.id} className="space-y-3">
                {/* Section header */}
                <div className="flex items-center gap-3">
                  <div className={`${section.color}`}>{section.icon}</div>
                  <div>
                    <h2 className="font-display text-lg font-bold">{section.label}</h2>
                    <p className="text-xs text-text-secondary">{section.description}</p>
                  </div>
                </div>

                {sectionPlans.length === 0 ? (
                  <Card className="p-6 text-center">
                    <p className="text-text-secondary text-sm">No prebuilt plans in this section yet.</p>
                    <Link href="/plans/custom">
                      <button className="mt-3 text-brand-orange text-sm font-medium hover:underline">
                        Build a custom {section.label.toLowerCase()} plan →
                      </button>
                    </Link>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {sectionPlans.map((plan: any) => (
                      <Link key={plan.id} href={`/plans/${plan.id}`}>
                        <Card interactive className="p-5 h-full flex flex-col group">
                          {/* Top row */}
                          <div className="flex items-start justify-between gap-2">
                            <span className="px-2.5 py-1 rounded-pill text-xs font-medium bg-brand-orange/10 text-brand-orange capitalize">
                              {GOAL_LABELS[plan.category] || plan.category}
                            </span>
                            <span className={`px-2.5 py-1 rounded-pill text-xs font-medium capitalize ${DIFFICULTY_BADGE[plan.difficulty] ?? 'bg-surface-2 text-text-secondary'}`}>
                              {plan.difficulty}
                            </span>
                          </div>

                          <h3 className="font-display text-base font-bold mt-3 leading-snug group-hover:text-brand-orange transition-colors">
                            {plan.title}
                          </h3>
                          <p className="text-sm text-text-secondary mt-1 line-clamp-2 flex-1">
                            {plan.description}
                          </p>

                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-3 text-xs text-text-secondary">
                              <span>{plan.durationWeeks}w</span>
                              <span>·</span>
                              <span>{plan.daysPerWeek}d/wk</span>
                            </div>
                            <span className="text-brand-orange opacity-0 group-hover:opacity-100 transition-opacity">
                              <ChevronRight className="w-4 h-4" />
                            </span>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Fallback if filtered section has no plans */}
          {activeSection && plansInSection(SECTIONS.find((s) => s.id === activeSection)?.categories ?? []).length === 0 && (
            <Card className="p-8 text-center">
              <Dumbbell className="w-12 h-12 text-text-secondary mx-auto mb-4 opacity-30" />
              <h3 className="font-semibold">No plans in this section</h3>
              <p className="text-text-secondary mt-1 text-sm">Try building a custom plan instead</p>
              <Link href="/plans/custom">
                <button className="mt-4 px-5 py-2.5 gradient-bg rounded-pill text-white font-semibold text-sm">
                  Build Custom Plan
                </button>
              </Link>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
