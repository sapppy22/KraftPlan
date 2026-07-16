'use client';

export const runtime = 'edge';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ChevronLeft, Dumbbell, AlertCircle, Plus } from 'lucide-react';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const DIFFICULTY_BADGE: Record<string, string> = {
  beginner: 'bg-green-500/15 text-green-400',
  intermediate: 'bg-yellow-500/15 text-yellow-400',
  advanced: 'bg-red-500/15 text-red-400',
};

const CATEGORY_BADGE: Record<string, string> = {
  resistance: 'bg-blue-500/15 text-blue-400',
  cardio: 'bg-green-500/15 text-green-400',
  bodyweight: 'bg-purple-500/15 text-purple-400',
  plyo: 'bg-yellow-500/15 text-yellow-400',
  mobility: 'bg-cyan-500/15 text-cyan-400',
};

/** Extract YouTube video ID from URL */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function buildEmbedSrc(exerciseName: string, tutorialUrl?: string | null): string {
  if (tutorialUrl && tutorialUrl.includes('youtube')) {
    const vid = extractYouTubeId(tutorialUrl);
    if (vid) return `https://www.youtube.com/embed/${vid}?rel=0`;
  }
  return `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(
    exerciseName + ' exercise tutorial',
  )}`;
}

export default function ExerciseDetailPage() {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const router = useRouter();

  const { data: exercise, isLoading } = useQuery({
    queryKey: ['exercise', exerciseId],
    queryFn: () => api.getExerciseDetail(exerciseId),
    enabled: !!exerciseId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-text-secondary mx-auto mb-4 opacity-50" />
        <p className="text-text-secondary">Exercise not found.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-brand-orange underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const catBadge = CATEGORY_BADGE[exercise.category] ?? 'bg-bg-elevated text-text-secondary';
  const diffBadge = DIFFICULTY_BADGE[exercise.difficulty] ?? 'bg-bg-elevated text-text-secondary';

  return (
    <div className="space-y-6 pb-24 lg:pb-8 max-w-2xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors text-sm"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Library
      </button>

      {/* YouTube embed — full-width 16:9 */}
      <div className="relative w-full rounded-2xl overflow-hidden" style={{ paddingTop: '56.25%' }}>
        <iframe
          src={buildEmbedSrc(exercise.name, exercise.tutorialUrl)}
          className="absolute inset-0 w-full h-full border-0"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title={`${exercise.name} tutorial`}
          loading="lazy"
        />
      </div>

      {/* Title + badges */}
      <div>
        <div className="flex flex-wrap gap-2 mb-2">
          <span className={`px-3 py-1 rounded-pill text-xs font-semibold capitalize ${catBadge}`}>
            {exercise.category}
          </span>
          <span className={`px-3 py-1 rounded-pill text-xs font-semibold capitalize ${diffBadge}`}>
            {exercise.difficulty}
          </span>
        </div>
        <h1 className="font-display text-3xl font-bold">{exercise.name}</h1>

        {/* Primary muscles */}
        {exercise.primaryMuscles?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {exercise.primaryMuscles.map((m: string) => (
              <span
                key={m}
                className="px-3 py-1 rounded-pill text-xs bg-bg-elevated capitalize text-text-secondary"
              >
                {m}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Equipment */}
      {exercise.equipment?.length > 0 && (
        <div>
          <h2 className="font-semibold mb-2">Equipment</h2>
          <div className="flex flex-wrap gap-2">
            {exercise.equipment.map((eq: string) => (
              <span
                key={eq}
                className="px-3 py-1.5 rounded-pill text-sm border border-white/10 capitalize"
              >
                {eq.replace(/-/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {exercise.instructions?.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Instructions</h2>
          <ol className="space-y-3">
            {exercise.instructions.map((inst: string, i: number) => (
              <li key={i} className="flex gap-3">
                <span className="w-7 h-7 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-text-secondary text-sm leading-relaxed">{inst}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Coaching cues */}
      {exercise.cues?.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Coaching Cues</h2>
          <ul className="space-y-2">
            {exercise.cues.map((cue: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-brand-amber mt-1 shrink-0">·</span>
                {cue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Common mistakes */}
      {exercise.mistakes?.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Common Mistakes</h2>
          <ul className="space-y-2">
            {exercise.mistakes.map((mistake: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-danger">
                <span className="mt-1 shrink-0">✕</span>
                {mistake}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Alternatives */}
      {exercise.alternatives?.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Alternatives</h2>
          <div className="grid grid-cols-2 gap-3">
            {exercise.alternatives.map((alt: any) => (
              <Link key={alt.id} href={`/library/${alt.id}`}>
                <Card interactive className="p-4">
                  <Dumbbell className="w-6 h-6 text-text-secondary mb-2 opacity-60" />
                  <p className="font-medium text-sm leading-snug">{alt.name}</p>
                  <p className="text-xs text-text-secondary capitalize mt-1">{alt.difficulty}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="fixed bottom-20 left-0 right-0 px-4 lg:relative lg:bottom-auto lg:px-0 lg:pt-2">
        <Link href="/workout/custom">
          <Button className="w-full" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Add to Custom Workout
          </Button>
        </Link>
      </div>
    </div>
  );
}
