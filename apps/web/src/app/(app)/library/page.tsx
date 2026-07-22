'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Loader2, Search, Dumbbell, Youtube } from 'lucide-react';
import { api } from '@/lib/api/client';
import { EXERCISE_CATEGORIES, DIFFICULTY_LEVELS } from '@kraftplan/shared';

import { getExerciseThumb, getTutorialUrl } from '@/lib/exerciseData';
const CATEGORY_COLORS: Record<string, string> = {
  resistance: 'bg-blue-500',
  cardio: 'bg-green-500',
  bodyweight: 'bg-purple-500',
  plyo: 'bg-yellow-500',
  mobility: 'bg-cyan-500',
  olympic: 'bg-red-500',
  stretching: 'bg-teal-500',
};

const DIFFICULTY_BADGE: Record<string, string> = {
  beginner: 'bg-green-500/15 text-green-400',
  intermediate: 'bg-yellow-500/15 text-yellow-400',
  advanced: 'bg-red-500/15 text-red-400',
};

const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'legs', 'core', 'glutes', 'hamstrings', 'quads', 'calves',
];

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
          className="w-full pl-12 pr-4 py-3 bg-bg-surface border border-white/10 rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-orange"
        />
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategory('')}
          className={`px-3 py-1.5 rounded-pill text-xs border transition-all ${
            !category
              ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
              : 'border-white/10 bg-bg-surface text-text-secondary hover:border-white/30'
          }`}
        >
          All
        </button>
        {EXERCISE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(category === cat ? '' : cat)}
            className={`px-3 py-1.5 rounded-pill text-xs border transition-all capitalize ${
              category === cat
                ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
                : 'border-white/10 bg-bg-surface text-text-secondary hover:border-white/30'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Muscle quick-filter */}
      <div className="flex flex-wrap gap-2">
        {MUSCLE_GROUPS.map((m) => (
          <button
            key={m}
            onClick={() => setMuscle(muscle === m ? '' : m)}
            className={`px-3 py-1.5 rounded-pill text-xs border transition-all capitalize ${
              muscle === m
                ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
                : 'border-white/10 bg-bg-surface text-text-secondary hover:border-white/30'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Exercise Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        </div>
      ) : data?.exercises && data.exercises.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {data.exercises.map((ex: any) => {
            const accentColor = CATEGORY_COLORS[ex.category] ?? 'bg-brand-orange';
            const diffBadge = DIFFICULTY_BADGE[ex.difficulty] ?? 'bg-white/10 text-text-secondary';
            const ytUrl =
              getTutorialUrl(ex.name, ex.tutorialUrl) ||
              `https://www.youtube.com/results?search_query=${encodeURIComponent(
                ex.name + ' exercise tutorial',
              )}`;
            const thumb = getExerciseThumb(ex.name, ex.tutorialUrl);
            return (
              <div key={ex.id} className="relative group">
                <Link href={`/library/${ex.id}`}>
                  <div className="card-surface card-hover cursor-pointer overflow-hidden flex flex-col h-full">
                    {thumb && (
                      <img
                        src={thumb}
                        alt={`${ex.name} tutorial thumbnail`}
                        loading="lazy"
                        className="w-full aspect-video object-cover"
                      />
                    )}
                    <div className="flex flex-1">
                      {/* Category colour bar */}
                      <div className={`w-1 shrink-0 ${accentColor}${thumb ? '' : ' rounded-l-xl'}`} />

                      <div className="flex-1 p-4 space-y-2">
                      {/* Icon + name row */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-bg-elevated flex items-center justify-center shrink-0 mt-0.5">
                          <Dumbbell className="w-5 h-5 text-text-secondary opacity-60" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm leading-snug line-clamp-2">
                            {ex.name}
                          </h3>
                          <p className="text-xs text-text-secondary mt-0.5 capitalize line-clamp-1">
                            {ex.primaryMuscles?.slice(0, 2).join(', ')}
                          </p>
                        </div>
                      </div>

                      {/* Badges row */}
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-bg-elevated text-text-secondary capitalize">
                          {ex.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${diffBadge}`}>
                          {ex.difficulty}
                        </span>
                      </div>
                    </div>
                    </div>
                  </div>
                </Link>

                {/* YouTube icon — opens in new tab, z-index above the card link */}
                <a
                  href={ytUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Watch ${ex.name} tutorial on YouTube`}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-lg bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-text-secondary mx-auto mb-4 opacity-50" />
          <h3 className="font-semibold">No exercises found</h3>
          <p className="text-text-secondary mt-1 text-sm">Try a different search term or filter</p>
        </div>
      )}
    </div>
  );
}
