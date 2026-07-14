'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Loader2, Search, Dumbbell } from 'lucide-react';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/Card';
import { PLAN_CATEGORIES, DIFFICULTY_LEVELS } from '@forgefit/shared';

const categoryLabels: Record<string, string> = {
  mobility: 'Mobility',
  strength: 'Strength',
  hypertrophy: 'Hypertrophy',
  powerlifting: 'Powerlifting',
  hyrox: 'Hyrox',
  endurance: 'Endurance',
  athletic: 'Athletic',
  conditioning: 'Conditioning',
  weightloss: 'Weight Loss',
};

export default function PlansPage() {
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans', category, difficulty],
    queryFn: () =>
      api.getPlans({
        ...(category && { category }),
        ...(difficulty && { difficulty }),
      }),
  });

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="font-display text-3xl font-bold">Plans</h1>
        <p className="text-text-secondary mt-1">Find the perfect program for your goals</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategory('')}
          className={`px-4 py-2 rounded-pill text-sm border transition-all ${
            !category ? 'border-accent-blue bg-accent-blue/10 text-accent-blue' : 'border-white/10 bg-bg-surface text-text-secondary'
          }`}
        >
          All
        </button>
        {PLAN_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(category === cat ? '' : cat)}
            className={`px-4 py-2 rounded-pill text-sm border transition-all capitalize ${
              category === cat ? 'border-accent-blue bg-accent-blue/10 text-accent-blue' : 'border-white/10 bg-bg-surface text-text-secondary'
            }`}
          >
            {categoryLabels[cat] || cat}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {DIFFICULTY_LEVELS.map((level) => (
          <button
            key={level}
            onClick={() => setDifficulty(difficulty === level ? '' : level)}
            className={`px-4 py-2 rounded-pill text-sm border transition-all capitalize ${
              difficulty === level ? 'border-accent-blue bg-accent-blue/10 text-accent-blue' : 'border-white/10 bg-bg-surface text-text-secondary'
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      {/* Plan Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
        </div>
      ) : plans && plans.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan: any) => (
            <Link key={plan.id} href={`/plans/${plan.id}`}>
              <Card interactive className="p-5 h-full flex flex-col">
                {/* Category Badge */}
                <span className="self-start px-3 py-1 rounded-pill text-xs font-medium bg-accent-blue/10 text-accent-blue capitalize">
                  {categoryLabels[plan.category] || plan.category}
                </span>

                <h3 className="font-display text-lg font-bold mt-3">{plan.title}</h3>
                <p className="text-sm text-text-secondary mt-1 line-clamp-2 flex-1">{plan.description}</p>

                <div className="flex items-center gap-4 mt-4 text-sm text-text-secondary">
                  <span>{plan.durationWeeks} weeks</span>
                  <span>·</span>
                  <span>{plan.daysPerWeek} days/wk</span>
                  <span>·</span>
                  <span className="capitalize">{plan.difficulty}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Dumbbell className="w-12 h-12 text-text-secondary mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold">No plans found</h3>
          <p className="text-text-secondary mt-1">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
