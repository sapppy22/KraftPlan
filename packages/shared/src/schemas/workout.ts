import { z } from 'zod';
import { SET_STATUS, WORKOUT_STATUS } from '../constants.js';

// ── Create Session ──
export const createSessionSchema = z.object({
  planDayId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type CreateSessionInput = z.infer<typeof createSessionSchema>;

// ── Workout Session ──
export const workoutSessionSchema = z.object({
  id: z.string().uuid(),
  planDayId: z.string().uuid(),
  status: z.enum(WORKOUT_STATUS),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().nullable(),
  totalVolumeKg: z.number().nullable(),
  notes: z.string().nullable(),
});
export type WorkoutSession = z.infer<typeof workoutSessionSchema>;

// ── Set Log ──
export const setLogSchema = z.object({
  exerciseId: z.string().uuid(),
  setIndex: z.number().int().nonnegative(),
  weightKg: z.number().nonnegative().optional().nullable(),
  reps: z.number().int().nonnegative().optional().nullable(),
  timeSec: z.number().nonnegative().optional().nullable(),
  distanceM: z.number().nonnegative().optional().nullable(),
  rpe: z.number().min(1).max(10).optional().nullable(),
  status: z.enum(SET_STATUS).default('completed'),
});
export type SetLogInput = z.infer<typeof setLogSchema>;

export const setLogResponseSchema = z.object({
  saved: z.boolean(),
  prCandidate: z.boolean(),
  previousPr: z
    .object({
      value: z.number(),
      metric: z.string(),
      achievedAt: z.string().datetime(),
    })
    .nullable(),
});
export type SetLogResponse = z.infer<typeof setLogResponseSchema>;

// ── Session Complete ──
export const sessionCompleteSchema = z.object({
  totalElapsedSec: z.number().int().nonnegative(),
  notes: z.string().max(2000).optional().nullable(),
});
export type SessionCompleteInput = z.infer<typeof sessionCompleteSchema>;

// ── Session Summary ──
export const sessionSummarySchema = z.object({
  sessionId: z.string().uuid(),
  totalVolumeKg: z.number(),
  setsCompleted: z.number().int(),
  exercisesCompleted: z.number().int(),
  durationSec: z.number().int(),
  prs: z.array(
    z.object({
      exerciseId: z.string().uuid(),
      exerciseName: z.string(),
      metric: z.string(),
      value: z.number(),
      previousValue: z.number().nullable(),
    }),
  ),
});
export type SessionSummary = z.infer<typeof sessionSummarySchema>;

// ── Swap Exercise ──
export const swapExerciseSchema = z.object({
  blockId: z.string().uuid(),
  oldExerciseId: z.string().uuid(),
  newExerciseId: z.string().uuid(),
});
export type SwapExerciseInput = z.infer<typeof swapExerciseSchema>;
