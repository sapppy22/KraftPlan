'use client';


// Cloudflare Pages: dynamic routes must run on the Edge runtime.
export const runtime = 'edge';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Play, Pause, Check, SkipForward, Loader2, ChevronDown, Video } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { usePlayerStore } from '@/stores/playerStore';
import { Card } from '@/components/ui/Card';
import { RestTimer } from '@/components/player/RestTimer';
import { cn } from '@/lib/utils';

interface Props {
  params: { sessionId: string };
}

export default function WorkoutPlayerPage(props: Props) {
  const { sessionId } = props.params;
  const router = useRouter();
  const store = usePlayerStore();

  // For demo: generate a manifest from today's session
  const { data: todaySession, isLoading } = useQuery({
    queryKey: ['todaySession'],
    queryFn: () => api.getTodaySession(),
  });

  const [showCues, setShowCues] = useState(true);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [sessionCreated, setSessionCreated] = useState(false);

  useEffect(() => {
    if (todaySession && !sessionCreated && !todaySession.isRestDay) {
      store.initSession(sessionId || 'demo-session', todaySession);
      setSessionCreated(true);
    }
  }, [todaySession, sessionCreated]);

  // Elapsed timer
  useEffect(() => {
    if (store.status !== 'active') return;
    const interval = setInterval(() => {
      store.setElapsed(store.elapsedSec + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [store.status, store.elapsedSec]);

  const currentBlock = store.sessionManifest?.blocks?.[store.currentBlockIndex];
  const currentExercise = currentBlock?.exercises?.[store.currentExerciseIndex];
  const currentSet = store.currentSetIndex;
  const isCompleted = store.status === 'completed';

  async function handleLogSet(status: 'completed' | 'failed' | 'skipped') {
    if (!currentExercise) return;

    store.logSet({
      exerciseId: currentExercise.exerciseId,
      setIndex: currentSet,
      weightKg: 0,
      reps: 0,
      rpe: 0,
      status,
    });

    if (status === 'completed') {
      store.setRestTimer(true);
    } else {
      store.advanceSet();
    }
  }

  function handleRestComplete() {
    store.setRestTimer(false);
    store.advanceSet();
  }

  function handleFinishSession() {
    store.setStatus('completed');
  }

  function formatElapsed(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  if (isLoading || !store.sessionManifest) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  // Summary view
  if (isCompleted) {
    const setsDone = Object.values(store.loggedSets).filter((s) => s.status === 'completed').length;
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h2 className="font-display text-2xl font-bold">Session Complete!</h2>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="p-3 rounded-xl bg-bg-elevated">
              <p className="text-text-secondary text-sm">Duration</p>
              <p className="font-bold text-lg">{formatElapsed(store.elapsedSec)}</p>
            </div>
            <div className="p-3 rounded-xl bg-bg-elevated">
              <p className="text-text-secondary text-sm">Sets done</p>
              <p className="font-bold text-lg">{setsDone}</p>
            </div>
            <div className="p-3 rounded-xl bg-bg-elevated">
              <p className="text-text-secondary text-sm">Exercises</p>
              <p className="font-bold text-lg">{store.sessionManifest.blocks?.reduce((acc: number, b: any) => acc + (b.exercises?.length || 0), 0)}</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-3 gradient-bg rounded-pill text-white font-semibold mt-4"
          >
            Back to Dashboard
          </button>
        </Card>
      </div>
    );
  }

  // Rest timer overlay
  if (store.restTimerActive && currentExercise) {
    return (
      <RestTimer
        restSec={currentExercise.restSec || 90}
        onComplete={handleRestComplete}
        onSkip={handleRestComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-bg-base pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg-base/90 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center justify-between px-4 h-14 max-w-3xl mx-auto">
          <button
            onClick={() => setShowConfirmExit(true)}
            className="text-text-secondary hover:text-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="font-semibold truncate mx-2">
            {store.sessionManifest.title || 'Workout'}
          </span>
          <span className="font-mono text-brand-orange">{formatElapsed(store.elapsedSec)}</span>
        </div>
      </header>

      {/* Exit confirm dialog */}
      {showConfirmExit && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4">
          <Card className="p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold">Exit workout?</h3>
            <p className="text-text-secondary">Your progress so far will be saved.</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  store.setStatus('paused');
                  router.push('/dashboard');
                }}
                className="flex-1 py-2.5 bg-bg-surface rounded-pill text-text-primary font-medium"
              >
                Save & Exit
              </button>
              <button
                onClick={() => setShowConfirmExit(false)}
                className="flex-1 py-2.5 gradient-bg rounded-pill text-white font-medium"
              >
                Continue
              </button>
            </div>
          </Card>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Progress dots */}
        <div className="flex gap-2 justify-center">
          {(store.sessionManifest.blocks || []).flatMap((block: any) =>
            (block.exercises || []).map((ex: any, exIdx: number) => {
              const isCurrentEx =
                store.currentBlockIndex === store.sessionManifest.blocks.indexOf(block) &&
                store.currentExerciseIndex === exIdx;
              return (
                <div
                  key={`${block.id}-${ex.exerciseId}`}
                  className={cn('w-3 h-3 rounded-full transition-all', {
                    'bg-brand-orange': isCurrentEx,
                    'bg-success': store.loggedSets[`${ex.exerciseId}-${ex.sets - 1}`]?.status === 'completed',
                    'bg-white/20': !isCurrentEx && !store.loggedSets[`${ex.exerciseId}-${ex.sets - 1}`],
                  })}
                />
              );
            })
          )}
        </div>

        {/* Current exercise */}
        {currentExercise && currentBlock ? (
          <Card className="p-0 overflow-hidden">
            {/* Video placeholder */}
            <div className="aspect-video bg-bg-elevated flex items-center justify-center relative">
              {currentExercise.tutorialUrl ? (
                <video
                  src={currentExercise.tutorialUrl}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <div className="text-center">
                  <Video className="w-12 h-12 text-text-secondary mx-auto mb-2" />
                  <p className="text-sm text-text-secondary">{currentExercise.name}</p>
                </div>
              )}
            </div>

            {/* Exercise info */}
            <div className="p-5 space-y-4">
              <div>
                <h2 className="font-display text-2xl font-bold">{currentExercise.name}</h2>
                <p className="text-sm text-text-secondary mt-1">
                  {currentExercise.primaryMuscles?.join(' · ') || ''}
                </p>
              </div>

              {/* Target */}
              <div className="flex items-center gap-2 text-sm text-brand-orange">
                <span className="font-semibold">Set {currentSet + 1} / {currentExercise.sets}</span>
                <span className="text-text-secondary">·</span>
                <span>{currentExercise.repsScheme} reps</span>
                {currentExercise.targetLoad && (
                  <>
                    <span className="text-text-secondary">·</span>
                    <span>{currentExercise.targetLoad}</span>
                  </>
                )}
                <span className="text-text-secondary">·</span>
                <span>{currentExercise.restSec}s rest</span>
              </div>

              {/* Instructions & cues */}
              <div>
                <button
                  onClick={() => setShowCues(!showCues)}
                  className="flex items-center gap-1 text-sm text-text-secondary"
                >
                  <ChevronDown className={cn('w-4 h-4 transition-transform', showCues && 'rotate-180')} />
                  Instructions & cues
                </button>
                {showCues && (
                  <div className="mt-3 space-y-2 text-sm">
                    {currentExercise.cues?.length > 0 && (
                      <div>
                        <p className="text-text-secondary font-medium mb-1">Coaching cues:</p>
                        <ul className="space-y-1">
                          {currentExercise.cues.map((cue: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-brand-amber mt-1">·</span>
                              {cue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {currentExercise.instructions?.length > 0 && (
                      <div>
                        <p className="text-text-secondary font-medium mb-1">Instructions:</p>
                        <ol className="space-y-1 list-decimal list-inside">
                          {currentExercise.instructions.map((inst: string, i: number) => (
                            <li key={i}>{inst}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Set Logger */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-text-secondary">Log this set</p>
                <div className="flex gap-2">
                  {/* Quick log buttons for demo */}
                  <button
                    onClick={() => handleLogSet('completed')}
                    className="flex-1 py-3 gradient-bg rounded-pill text-white font-semibold flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Complete
                  </button>
                  <button
                    onClick={() => handleLogSet('skipped')}
                    className="px-4 py-3 bg-bg-surface border border-white/10 rounded-pill text-text-secondary hover:text-text-primary font-medium"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Advanced logging for resistance exercises */}
              {currentExercise.category === 'resistance' && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 bg-bg-elevated border border-white/10 rounded-xl text-center"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Reps</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 bg-bg-elevated border border-white/10 rounded-xl text-center"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">RPE</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      className="w-full px-3 py-2 bg-bg-elevated border border-white/10 rounded-xl text-center"
                      placeholder="1-10"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <div className="text-center py-16">
            <p className="text-text-secondary">No exercises in this session</p>
          </div>
        )}

        {/* Finish button */}
        <button
          onClick={handleFinishSession}
          className="w-full py-3.5 bg-bg-surface border border-white/10 rounded-pill text-text-primary font-semibold hover:bg-bg-elevated transition-colors"
        >
          Finish Session
        </button>
      </div>
    </div>
  );
}
