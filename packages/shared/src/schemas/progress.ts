import { z } from 'zod';
import { PR_METRICS } from '../constants.js';

// ── Personal Record ──
export const personalRecordSchema = z.object({
  id: z.string().uuid(),
  exerciseId: z.string().uuid(),
  exerciseName: z.string(),
  metric: z.enum(PR_METRICS),
  value: z.number(),
  previousValue: z.number().nullable(),
  achievedAt: z.string().datetime(),
  deltaPct: z.number().nullable(),
});
export type PersonalRecord = z.infer<typeof personalRecordSchema>;

// ── PR History Point ──
export const prHistoryPointSchema = z.object({
  value: z.number(),
  achievedAt: z.string().datetime(),
});
export type PRHistoryPoint = z.infer<typeof prHistoryPointSchema>;

// ── Volume Data Point ──
export const volumePointSchema = z.object({
  week: z.string(),
  volumeKg: z.number(),
});
export type VolumePoint = z.infer<typeof volumePointSchema>;

// ── Adherence Data ──
export const adherencePointSchema = z.object({
  date: z.string(),
  completed: z.boolean(),
});
export type AdherencePoint = z.infer<typeof adherencePointSchema>;

export const adherenceSummarySchema = z.object({
  yearHeatmap: z.array(adherencePointSchema),
  weeklyCounts: z.array(z.object({ week: z.string(), completed: z.number(), scheduled: z.number() })),
  currentStreak: z.number().int(),
  longestStreak: z.number().int(),
});
export type AdherenceSummary = z.infer<typeof adherenceSummarySchema>;

// ── Endurance Data ──
export const endurancePointSchema = z.object({
  date: z.string(),
  pace: z.string().nullable(),
  distanceKm: z.number(),
  durationSec: z.number(),
});
export type EndurancePoint = z.infer<typeof endurancePointSchema>;

// ── Dashboard ──
export const dashboardSchema = z.object({
  today: z
    .object({
      dayId: z.string().uuid(),
      title: z.string().nullable(),
      estimatedMinutes: z.number().int(),
      isRestDay: z.boolean(),
    })
    .nullable(),
  streak: z.number().int(),
  thisWeek: z.object({
    completed: z.number().int(),
    scheduled: z.number().int(),
  }),
  volume30d: z.number(),
  programProgress: z
    .object({
      currentWeek: z.number().int(),
      totalWeeks: z.number().int(),
      percent: z.number(),
    })
    .nullable(),
  prs: z.array(personalRecordSchema),
  recentSessions: z.array(
    z.object({
      id: z.string().uuid(),
      title: z.string().nullable(),
      date: z.string(),
      durationSec: z.number().int(),
      totalVolumeKg: z.number().nullable(),
    }),
  ),
});
export type Dashboard = z.infer<typeof dashboardSchema>;

// ── Event Messages ──
export const workoutCompletedEventSchema = z.object({
  userId: z.string().uuid(),
  sessionId: z.string().uuid(),
  exerciseIds: z.array(z.string().uuid()),
  endedAt: z.string().datetime(),
});
export type WorkoutCompletedEvent = z.infer<typeof workoutCompletedEventSchema>;

export const prBrokenEventSchema = z.object({
  userId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  metric: z.enum(PR_METRICS),
  previousValue: z.number(),
  newValue: z.number(),
});
export type PRBrokenEvent = z.infer<typeof prBrokenEventSchema>;
