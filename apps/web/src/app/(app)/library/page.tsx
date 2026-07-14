'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Loader2, Search, Dumbbell } from 'lucide-react';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/Card';
import { EXERCISE_CATEGORIES, DIFFICULTY_LEVELS, EQUIPMENT_TYPES } from '@forgefit/shared';

export default function LibraryPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [muscle, setMuscle] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['exercises', search, category, muscle],
    queryFn: () =>
      api.getExercises({
        q: search || undefined,
        category: category || undefined,
        muscle: muscle || undefined,
        limit: '50',
      }),
    enabled: true,
  });

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="font-display text-3xl font-bold">Exercise Library</h1>
        <p className="text-text-secondary mt-1">Browse 300+ exercises with tutorials</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search exercises..."
          className="w-full pl-12 pr-4 py-3 bg-bg-surface border border-white/10 rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-blue"
        />
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategory('')}
          className={`px-3 py-1.5 rounded-pill text-xs border transition-all ${
            !category ? 'border-accent-blue bg-accent-blue/10 text-accent-blue' : 'border-white/10 bg-bg-surface text-text-secondary'
          }`}
        >
          All
        </button>
        {EXERCISE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(category === cat ? '' : cat)}
            className={`px-3 py-1.5 rounded-pill text-xs border transition-all capitalize ${
              category === cat ? 'border-accent-blue bg-accent-blue/10 text-accent-blue' : 'border-white/10 bg-bg-surface text-text-secondary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Muscle group quick filter */}
      {['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'core', 'glutes', 'hamstrings', 'quads', 'calves'].map((m) => (
        <button
          key={m}
          onClick={() => setMuscle(muscle === m ? '' : m)}
          className={`px-3 py-1.5 rounded-pill text-xs border transition-all capitalize ${
            muscle === m ? 'border-accent-blue bg-accent-blue/10 text-accent-blue' : 'border-white/10 bg-bg-surface text-text-secondary'
          }`}
        >
          {m}
        </button>
      ))}

      {/* Exercise Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
        </div>
      ) : data?.exercises && data.exercises.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {data.exercises.map((ex: any) => (
            <Link key={ex.id} href={`/library/${ex.id}`}>
              <Card interactive className="p-4">
                {/* Thumbnail placeholder */}
                <div className="aspect-square rounded-xl bg-bg-elevated flex items-center justify-center mb-3">
                  <Dumbbell className="w-8 h-8 text-text-secondary opacity-30" />
                </div>
                <h3 className="font-medium text-sm leading-tight">{ex.name}</h3>
                <p className="text-xs text-text-secondary mt-1 capitalize">
                  {ex.primaryMuscles?.slice(0, 2).join(', ')}
                </p>
                <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-medium bg-bg-elevated text-text-secondary capitalize">
                  {ex.difficulty}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-text-secondary mx-auto mb-4 opacity-50" />
          <h3 className="font-semibold">No exercises found</h3>
          <p className="text-text-secondary mt-1 text-sm">Try a different search term</p>
        </div>
      )}
    </div>
  );
}
