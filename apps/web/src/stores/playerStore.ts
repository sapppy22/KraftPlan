import { create } from 'zustand';

export interface LoggedSet {
  exerciseId: string;
  setIndex: number;
  weightKg?: number;
  reps?: number;
  timeSec?: number;
  distanceM?: number;
  rpe?: number;
  status: 'completed' | 'failed' | 'skipped';
}

export interface InitSessionOpts {
  /** Wall-clock start time (ms). Defaults to now for brand-new sessions. */
  startedAtMs?: number;
  /** Previously logged sets, to resume an in-progress session. */
  loggedSets?: Record<string, LoggedSet>;
  /** Session status from the server. */
  status?: 'active' | 'completed';
  /** Where to resume playback. */
  position?: { block: number; ex: number; set: number };
}

interface PlayerStore {
  sessionId: string | null;
  sessionManifest: any | null;
  currentBlockIndex: number;
  currentExerciseIndex: number;
  currentSetIndex: number;
  status: 'idle' | 'active' | 'paused' | 'completed';
  startedAtMs: number | null; // wall-clock start, source of truth for the elapsed counter
  elapsedSec: number;
  loggedSets: Record<string, LoggedSet>; // key: `${exerciseId}-${setIndex}`
  restTimerActive: boolean;

  // Last logged values per exercise (for pre-filling)
  lastWeight: Record<string, number>; // key: exerciseId
  lastReps: Record<string, number>;   // key: exerciseId

  // Actions
  initSession: (sessionId: string, manifest: any, opts?: InitSessionOpts) => void;
  advanceSet: () => void;
  advanceExercise: () => void;
  logSet: (set: LoggedSet) => void;
  setElapsed: (sec: number) => void;
  setStatus: (status: 'active' | 'paused' | 'completed') => void;
  setRestTimer: (active: boolean) => void;
  setLastWeight: (key: string, weight: number) => void;
  setLastReps: (key: string, reps: number) => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  sessionId: null,
  sessionManifest: null,
  currentBlockIndex: 0,
  currentExerciseIndex: 0,
  currentSetIndex: 0,
  status: 'idle',
  startedAtMs: null,
  elapsedSec: 0,
  loggedSets: {},
  restTimerActive: false,
  lastWeight: {},
  lastReps: {},

  initSession: (sessionId, manifest, opts = {}) => {
    const startedAtMs = opts.startedAtMs ?? Date.now();
    set({
      sessionId,
      sessionManifest: manifest,
      currentBlockIndex: opts.position?.block ?? 0,
      currentExerciseIndex: opts.position?.ex ?? 0,
      currentSetIndex: opts.position?.set ?? 0,
      status: opts.status === 'completed' ? 'completed' : 'active',
      startedAtMs,
      elapsedSec: Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)),
      loggedSets: opts.loggedSets ?? {},
      restTimerActive: false,
    });
  },

  advanceSet: () => {
    const state = get();
    if (!state.sessionManifest) return;

    const block = state.sessionManifest.blocks?.[state.currentBlockIndex];
    const exercise = block?.exercises?.[state.currentExerciseIndex];

    if (!exercise) return;

    if (state.currentSetIndex + 1 < exercise.sets) {
      set({ currentSetIndex: state.currentSetIndex + 1 });
    } else {
      // Move to next exercise
      const nextExIndex = state.currentExerciseIndex + 1;
      if (nextExIndex < (block.exercises?.length || 0)) {
        set({ currentExerciseIndex: nextExIndex, currentSetIndex: 0 });
      } else {
        // Move to next block
        const nextBlockIndex = state.currentBlockIndex + 1;
        if (nextBlockIndex < (state.sessionManifest.blocks?.length || 0)) {
          set({ currentBlockIndex: nextBlockIndex, currentExerciseIndex: 0, currentSetIndex: 0 });
        } else {
          set({ status: 'completed' });
        }
      }
    }
  },

  advanceExercise: () => {
    const state = get();
    if (!state.sessionManifest) return;
    const nextExIndex = state.currentExerciseIndex + 1;
    const block = state.sessionManifest.blocks?.[state.currentBlockIndex];
    if (nextExIndex < (block?.exercises?.length || 0)) {
      set({ currentExerciseIndex: nextExIndex, currentSetIndex: 0 });
    } else {
      const nextBlockIndex = state.currentBlockIndex + 1;
      if (nextBlockIndex < (state.sessionManifest.blocks?.length || 0)) {
        set({ currentBlockIndex: nextBlockIndex, currentExerciseIndex: 0, currentSetIndex: 0 });
      } else {
        set({ status: 'completed' });
      }
    }
  },

  logSet: (setLog) =>
    set((state) => ({
      loggedSets: {
        ...state.loggedSets,
        [`${setLog.exerciseId}-${setLog.setIndex}`]: setLog,
      },
    })),

  setElapsed: (sec) => set({ elapsedSec: sec }),
  setStatus: (status) => set({ status }),
  setRestTimer: (active) => set({ restTimerActive: active }),

  setLastWeight: (key, weight) =>
    set((state) => ({
      lastWeight: { ...state.lastWeight, [key]: weight },
    })),

  setLastReps: (key, reps) =>
    set((state) => ({
      lastReps: { ...state.lastReps, [key]: reps },
    })),

  reset: () =>
    set({
      sessionId: null,
      sessionManifest: null,
      currentBlockIndex: 0,
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      status: 'idle',
      startedAtMs: null,
      elapsedSec: 0,
      loggedSets: {},
      restTimerActive: false,
      // Intentionally preserve lastWeight/lastReps across sessions
    }),
}));
