'use client';

export const runtime = 'edge';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Check,
  SkipForward,
  Loader2,
  ChevronDown,
  ChevronUp,
  Trophy,
  Timer,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { usePlayerStore } from '@/stores/playerStore';
import { Card } from '@/components/ui/Card';
import { RestTimer } from '@/components/player/RestTimer';
import { cn } from '@/lib/utils';

interface Props {
  params: { sessionId: string };
}

function formatElapsed(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Extract YouTube video ID from common URL patterns */
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

/** Build an embed src for a given exercise name / tutorial URL */
function buildEmbedSrc(exerciseName: string, tutorialUrl?: string | null): string {
  if (tutorialUrl && tutorialUrl.includes('youtube')) {
    const vid = extractYouTubeId(tutorialUrl);
    if (vid) return `https://www.youtube.com/embed/${vid}?autoplay=0&rel=0`;
  }
  return `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(exerciseName + ' tutorial')}`;
}

export default function WorkoutPlayerPage({ params }: Props) {
  const { sessionId } = params;
  const router = useRouter();
  const store = usePlayerStore();

  const [loading, setLoading] = useState(false);
  const [initError, setInitError] = useState('');
  const [showCues, setShowCues] = useState(false);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [finishing, setFinishing] = useState(false);

  // Per-set input state
  const [weightInput, setWeightInput] = useState('');
  const [repsInput, setRepsInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [distInput, setDistInput] = useState('');

  // Elapsed timer ref to avoid stale closure
  const elapsedRef = useRef(store.elapsedSec);
  elapsedRef.current = store.elapsedSec;

  // Initialize session if not already loaded
  useEffect(() => {
    if (store.sessionManifest && store.sessionId === sessionId) return;

    async function initFromApi() {
      setLoading(true);
      try {
        const session = await api.getTodaySession();
        if (session && !session.isRestDay) {
          store.initSession(sessionId, session);
        } else {
          setInitError('No session found for today.');
        }
      } catch (e: any) {
        setInitError(e.message || 'Failed to load session');
      } finally {
        setLoading(false);
      }
    }

    initFromApi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Elapsed timer
  useEffect(() => {
    if (store.status !== 'active') return;
    const interval = setInterval(() => {
      store.setElapsed(elapsedRef.current + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [store.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fill inputs when exercise/set changes
  const currentBlock = store.sessionManifest?.blocks?.[store.currentBlockIndex];
  const currentExercise = currentBlock?.exercises?.[store.currentExerciseIndex];
  const currentSet = store.currentSetIndex;
  const isCardio = currentExercise?.category === 'cardio' || currentExercise?.category === 'time';

  useEffect(() => {
    if (!currentExercise) return;
    const exId = currentExercise.exerciseId;
    setWeightInput(store.lastWeight[exId]?.toString() ?? '');
    setRepsInput(store.lastReps[exId]?.toString() ?? '');
    setTimeInput('');
    setDistInput('');
  }, [currentExercise?.exerciseId, currentSet]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogSet = useCallback(
    async (status: 'completed' | 'skipped') => {
      if (!currentExercise) return;

      const weightKg = parseFloat(weightInput) || undefined;
      const reps = parseInt(repsInput) || undefined;
      const timeSec = parseInt(timeInput) || undefined;
      const distanceM = parseFloat(distInput) || undefined;

      // Save to store (last values for pre-fill)
      if (weightKg !== undefined) store.setLastWeight(currentExercise.exerciseId, weightKg);
      if (reps !== undefined) store.setLastReps(currentExercise.exerciseId, reps);

      const logPayload = {
        exerciseId: currentExercise.exerciseId,
        setIndex: currentSet,
        weightKg,
        reps,
        timeSec,
        distanceM,
        status,
      };

      store.logSet(logPayload);

      // Persist to backend (fire-and-forget — don't block UX)
      api.logSet(sessionId, {
        exerciseId: currentExercise.exerciseId,
        setIndex: currentSet,
        weightKg,
        reps,
        timeSec,
        distanceM,
        status,
      }).catch(() => {/* silent */});

      if (status === 'completed') {
        store.setRestTimer(true);
        // advanceSet will be called by rest timer onComplete
      } else {
        store.advanceSet();
      }
    },
    [currentExercise, currentSet, weightInput, repsInput, timeInput, distInput, sessionId, store],
  );

  function handleRestComplete() {
    store.setRestTimer(false);
    store.advanceSet();
  }

  async function handleFinishSession() {
    if (finishing) return;
    setFinishing(true);
    store.setStatus('completed');
    try {
      await api.completeSession(sessionId, { totalElapsedSec: elapsedRef.current });
    } catch {/* silent */}
  }

  // ─── Loading / error ──────────────────────────────────────────────────────
  if (loading || (!store.sessionManifest && !initError)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  if (initError && !store.sessionManifest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
        <p className="text-danger">{initError}</p>
        <button onClick={() => router.back()} className="text-sm text-brand-orange underline">
          Go back
        </button>
      </div>
    );
  }

  // ─── Session complete ─────────────────────────────────────────────────────
  if (store.status === 'completed') {
    const setsDone = Object.values(store.loggedSets).filter((s) => s.status === 'completed').length;
    const totalVolume = Object.values(store.loggedSets)
      .filter((s) => s.status === 'completed' && s.weightKg && s.reps)
      .reduce((acc, s) => acc + (s.weightKg ?? 0) * (s.reps ?? 0), 0);

    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-bg-base">
        <Card className="p-8 max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center mx-auto">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="font-display text-3xl font-bold">Session Complete!</h2>
            <p className="text-text-secondary mt-1 text-sm">Great work — rest up and come back stronger.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-left">
            <div className="p-3 rounded-xl bg-bg-elevated text-center">
              <p className="text-text-secondary text-xs mb-1">Duration</p>
              <p className="font-bold">{formatElapsed(store.elapsedSec)}</p>
            </div>
            <div className="p-3 rounded-xl bg-bg-elevated text-center">
              <p className="text-text-secondary text-xs mb-1">Sets Done</p>
              <p className="font-bold">{setsDone}</p>
            </div>
            <div className="p-3 rounded-xl bg-bg-elevated text-center">
              <p className="text-text-secondary text-xs mb-1">Volume (kg)</p>
              <p className="font-bold">{totalVolume > 0 ? totalVolume.toLocaleString() : '—'}</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-3.5 gradient-bg rounded-pill text-white font-semibold"
          >
            Back to Dashboard
          </button>
        </Card>
      </div>
    );
  }

  // ─── Rest timer overlay ───────────────────────────────────────────────────
  if (store.restTimerActive && currentExercise) {
    return (
      <RestTimer
        restSec={currentExercise.restSec || 60}
        onComplete={handleRestComplete}
        onSkip={handleRestComplete}
      />
    );
  }

  // ─── Build progress dots ──────────────────────────────────────────────────
  const allExercises: Array<{ exerciseId: string; blockIdx: number; exIdx: number }> = [];
  (store.sessionManifest?.blocks ?? []).forEach((block: any, bi: number) => {
    (block.exercises ?? []).forEach((ex: any, ei: number) => {
      allExercises.push({ exerciseId: ex.exerciseId, blockIdx: bi, exIdx: ei });
    });
  });

  return (
    <div className="min-h-screen bg-bg-base pb-32">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-bg-base/90 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center justify-between px-4 h-14 max-w-3xl mx-auto">
          <button
            onClick={() => setShowConfirmExit(true)}
            className="text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Exit workout"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm truncate mx-2 max-w-[180px]">
            {currentExercise?.name ?? store.sessionManifest?.title ?? 'Workout'}
          </span>
          <span className="font-mono text-brand-orange text-sm flex items-center gap-1">
            <Timer className="w-4 h-4" />
            {formatElapsed(store.elapsedSec)}
          </span>
        </div>
      </header>

      {/* ── Exit confirm dialog ─────────────────────────────────────────────── */}
      {showConfirmExit && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4">
          <Card className="p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold">Exit workout?</h3>
            <p className="text-text-secondary text-sm">Your progress so far will be saved.</p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  store.setStatus('paused');
                  try {
                    await api.completeSession(sessionId, { totalElapsedSec: elapsedRef.current });
                  } catch {/* silent */}
                  router.push('/dashboard');
                }}
                className="flex-1 py-2.5 bg-bg-surface rounded-pill text-text-primary font-medium text-sm border border-white/10"
              >
                Save &amp; Exit
              </button>
              <button
                onClick={() => setShowConfirmExit(false)}
                className="flex-1 py-2.5 gradient-bg rounded-pill text-white font-medium text-sm"
              >
                Continue
              </button>
            </div>
          </Card>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-5">
        {/* ── Progress dots ─────────────────────────────────────────────────── */}
        {allExercises.length > 0 && (
          <div className="flex gap-1.5 justify-center flex-wrap">
            {allExercises.map(({ exerciseId, blockIdx, exIdx }, dotIdx) => {
              const isCurrent =
                blockIdx === store.currentBlockIndex && exIdx === store.currentExerciseIndex;
              const isDone = Object.values(store.loggedSets).some(
                (s) => s.exerciseId === exerciseId && s.status === 'completed',
              );
              return (
                <div
                  key={dotIdx}
                  className={cn('w-2.5 h-2.5 rounded-full transition-all', {
                    'w-4 bg-brand-orange': isCurrent,
                    'bg-success': !isCurrent && isDone,
                    'bg-white/20': !isCurrent && !isDone,
                  })}
                />
              );
            })}
          </div>
        )}

        {/* ── Current exercise ───────────────────────────────────────────────── */}
        {currentExercise ? (
          <Card className="p-0 overflow-hidden">
            {/* YouTube embed */}
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
              <iframe
                key={currentExercise.exerciseId} // remount on exercise change
                src={buildEmbedSrc(currentExercise.name, currentExercise.tutorialUrl)}
                className="absolute inset-0 w-full h-full border-0"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title={`${currentExercise.name} tutorial`}
                loading="lazy"
              />
            </div>

            <div className="p-5 space-y-5">
              {/* Name + muscles + set counter */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-display text-2xl font-bold leading-tight">
                    {currentExercise.name}
                  </h2>
                  <span className="shrink-0 px-2.5 py-1 rounded-pill text-xs font-semibold gradient-bg text-white whitespace-nowrap">
                    Set {currentSet + 1}&nbsp;/&nbsp;{currentExercise.sets}
                  </span>
                </div>
                {currentExercise.primaryMuscles?.length > 0 && (
                  <p className="text-sm text-text-secondary mt-1 capitalize">
                    {currentExercise.primaryMuscles.slice(0, 3).join(' · ')}
                  </p>
                )}
              </div>

              {/* Reps / rest targets */}
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="px-3 py-1 rounded-pill bg-bg-elevated text-text-secondary">
                  Target: <span className="text-text-primary font-medium">{currentExercise.repsScheme}</span>
                </span>
                <span className="px-3 py-1 rounded-pill bg-bg-elevated text-text-secondary">
                  Rest: <span className="text-text-primary font-medium">{currentExercise.restSec ?? 60}s</span>
                </span>
                {currentExercise.targetLoad && (
                  <span className="px-3 py-1 rounded-pill bg-bg-elevated text-text-secondary">
                    Load: <span className="text-text-primary font-medium">{currentExercise.targetLoad}</span>
                  </span>
                )}
              </div>

              {/* Input logger */}
              {isCardio ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Time (seconds)</label>
                    <input
                      type="number"
                      min={0}
                      value={timeInput}
                      onChange={(e) => setTimeInput(e.target.value)}
                      placeholder="e.g. 300"
                      className="w-full px-3 py-2.5 bg-bg-elevated border border-white/10 rounded-xl text-center text-base focus:outline-none focus:border-brand-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Distance (m)</label>
                    <input
                      type="number"
                      min={0}
                      value={distInput}
                      onChange={(e) => setDistInput(e.target.value)}
                      placeholder="e.g. 1000"
                      className="w-full px-3 py-2.5 bg-bg-elevated border border-white/10 rounded-xl text-center text-base focus:outline-none focus:border-brand-orange"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={weightInput}
                      onChange={(e) => setWeightInput(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2.5 bg-bg-elevated border border-white/10 rounded-xl text-center text-base focus:outline-none focus:border-brand-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Reps</label>
                    <input
                      type="number"
                      min={0}
                      value={repsInput}
                      onChange={(e) => setRepsInput(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2.5 bg-bg-elevated border border-white/10 rounded-xl text-center text-base focus:outline-none focus:border-brand-orange"
                    />
                  </div>
                </div>
              )}

              {/* Done / Skip buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleLogSet('completed')}
                  className="flex-1 py-3.5 gradient-bg rounded-pill text-white font-semibold flex items-center justify-center gap-2 text-sm"
                >
                  <Check className="w-5 h-5" />
                  Done
                </button>
                <button
                  onClick={() => handleLogSet('skipped')}
                  className="px-4 py-3.5 bg-bg-surface border border-white/10 rounded-pill text-text-secondary hover:text-text-primary font-medium"
                  aria-label="Skip set"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Instructions / Cues collapsible */}
              {(currentExercise.instructions?.length > 0 || currentExercise.cues?.length > 0) && (
                <div>
                  <button
                    onClick={() => setShowCues(!showCues)}
                    className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary w-full"
                  >
                    {showCues ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    Instructions &amp; cues
                  </button>
                  {showCues && (
                    <div className="mt-3 space-y-4 text-sm">
                      {currentExercise.cues?.length > 0 && (
                        <div>
                          <p className="text-text-secondary font-medium mb-1.5">Coaching cues</p>
                          <ul className="space-y-1.5">
                            {currentExercise.cues.map((cue: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-text-secondary">
                                <span className="text-brand-amber shrink-0 mt-0.5">·</span>
                                {cue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {currentExercise.instructions?.length > 0 && (
                        <div>
                          <p className="text-text-secondary font-medium mb-1.5">Instructions</p>
                          <ol className="space-y-2 list-none">
                            {currentExercise.instructions.map((inst: string, i: number) => (
                              <li key={i} className="flex gap-2.5 text-text-secondary">
                                <span className="w-5 h-5 rounded-full gradient-bg flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">
                                  {i + 1}
                                </span>
                                {inst}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        ) : (
          <div className="text-center py-16">
            <p className="text-text-secondary">No exercises in this session.</p>
          </div>
        )}

        {/* ── Finish Session button ─────────────────────────────────────────── */}
        <button
          onClick={handleFinishSession}
          disabled={finishing}
          className="w-full py-3.5 bg-bg-surface border border-white/10 rounded-pill text-text-primary font-semibold hover:bg-bg-elevated transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {finishing && <Loader2 className="w-4 h-4 animate-spin" />}
          Finish Session
        </button>
      </div>
    </div>
  );
}
