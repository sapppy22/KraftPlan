'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ChevronLeft, Video, Dumbbell } from 'lucide-react';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/Card';

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
        <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="text-center py-16">
        <p className="text-text-secondary">Exercise not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors text-sm"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to library
      </button>

      {/* Video */}
      <div className="aspect-video rounded-2xl bg-bg-elevated flex items-center justify-center overflow-hidden">
        {exercise.tutorialUrl ? (
          <video
            src={exercise.tutorialUrl}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            controls
          />
        ) : (
          <div className="text-center">
            <Video className="w-16 h-16 text-text-secondary mx-auto mb-3" />
            <p className="text-text-secondary">Demo — tutorial video placeholder</p>
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <span className="inline-block px-3 py-1 rounded-pill text-xs font-medium bg-accent-blue/10 text-accent-blue capitalize mb-2">
          {exercise.category}
        </span>
        <h1 className="font-display text-3xl font-bold">{exercise.name}</h1>
        <div className="flex flex-wrap gap-2 mt-3">
          {exercise.primaryMuscles?.map((m: string) => (
            <span key={m} className="px-3 py-1 rounded-pill text-xs bg-bg-elevated capitalize">
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Equipment */}
      {exercise.equipment?.length > 0 && (
        <div>
          <h2 className="font-semibold mb-2">Equipment</h2>
          <div className="flex flex-wrap gap-2">
            {exercise.equipment.map((eq: string) => (
              <span key={eq} className="px-3 py-1 rounded-pill text-sm border border-white/10 capitalize">
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
                <span className="text-text-secondary">{inst}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Coaching Cues */}
      {exercise.cues?.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Coaching Cues</h2>
          <ul className="space-y-2">
            {exercise.cues.map((cue: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-accent-cyan mt-1">·</span>
                {cue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Common Mistakes */}
      {exercise.mistakes?.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Common Mistakes</h2>
          <ul className="space-y-2">
            {exercise.mistakes.map((mistake: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-danger">
                <span className="mt-1">✕</span>
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
              <Card key={alt.id} interactive className="p-4">
                <Dumbbell className="w-6 h-6 text-text-secondary mb-2" />
                <p className="font-medium text-sm">{alt.name}</p>
                <p className="text-xs text-text-secondary capitalize">{alt.difficulty}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
