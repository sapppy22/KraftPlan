import { z } from 'zod';
import { BLOCK_TYPES, DIFFICULTY_LEVELS, EQUIPMENT_TYPES, LOAD_SCHEMES, PLAN_CATEGORIES } from '../constants.js';

// ── Plan ──
export const planSchema = z.object({
  id: z.string().uuid(),
  category: z.enum(PLAN_CATEGORIES),
  title: z.string(),
  description: z.string(),
  durationWeeks: z.number().int().positive(),
  daysPerWeek: z.number().int().min(1).max(7),
  difficulty: z.enum(DIFFICULTY_LEVELS),
  equipment: z.array(z.enum(EQUIPMENT_TYPES)),
  coverImage: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type Plan = z.infer<typeof planSchema>;

export const planFilterSchema = z.object({
  category: z.enum(PLAN_CATEGORIES).optional(),
  difficulty: z.enum(DIFFICULTY_LEVELS).optional(),
  equipment: z.enum(EQUIPMENT_TYPES).optional(),
  maxWeeks: z.number().int().positive().optional(),
  minDaysPerWeek: z.number().int().min(1).optional(),
  search: z.string().max(200).optional(),
});
export type PlanFilter = z.infer<typeof planFilterSchema>;

// ── Block Exercise ──
export const blockExerciseSchema = z.object({
  id: z.string().uuid(),
  exerciseId: z.string().uuid(),
  sortOrder: z.number().int().nonnegative(),
  sets: z.number().int().positive(),
  repsScheme: z.string(),
  loadScheme: z.enum(LOAD_SCHEMES),
  targetLoad: z.string().nullable(),
  restSec: z.number().int().nonnegative().default(60),
  tempo: z.string().nullable(),
  notes: z.string().nullable(),
});
export type BlockExercise = z.infer<typeof blockExerciseSchema>;

// ── Block ──
export const planBlockSchema = z.object({
  id: z.string().uuid(),
  blockType: z.enum(BLOCK_TYPES),
  sortOrder: z.number().int().nonnegative(),
  exercises: z.array(blockExerciseSchema),
});
export type PlanBlock = z.infer<typeof planBlockSchema>;

// ── Day ──
export const planDaySchema = z.object({
  id: z.string().uuid(),
  dayNumber: z.number().int().positive(),
  title: z.string().nullable(),
  isRestDay: z.boolean().default(false),
  blocks: z.array(planBlockSchema),
});
export type PlanDay = z.infer<typeof planDaySchema>;

// ── Week ──
export const planWeekSchema = z.object({
  id: z.string().uuid(),
  weekNumber: z.number().int().positive(),
  days: z.array(planDaySchema),
});
export type PlanWeek = z.infer<typeof planWeekSchema>;

// ── Plan Detail ──
export const planDetailSchema = planSchema.extend({
  weeks: z.array(planWeekSchema),
});
export type PlanDetail = z.infer<typeof planDetailSchema>;

// ── Plan Assignment ──
export const planAssignmentSchema = z.object({
  id: z.string().uuid(),
  planId: z.string().uuid(),
  startDate: z.string(),
  currentWeek: z.number().int().positive().default(1),
  status: z.enum(['active', 'completed', 'abandoned']).default('active'),
  plan: planSchema.optional(),
});
export type PlanAssignment = z.infer<typeof planAssignmentSchema>;

export const assignPlanSchema = z.object({
  planId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type AssignPlanInput = z.infer<typeof assignPlanSchema>;

// ── Onboarding ──
export const onboardingSchema = z.object({
  goal: z.enum(PLAN_CATEGORIES),
  experience: z.enum(DIFFICULTY_LEVELS),
  equipment: z.array(z.enum(EQUIPMENT_TYPES)),
  daysPerWeek: z.number().int().min(1).max(7),
  sessionLength: z.number().int().positive(),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

// ── Session Manifest (what the player renders) ──
export const sessionManifestExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  name: z.string(),
  primaryMuscles: z.array(z.string()),
  category: z.string(),
  sets: z.number().int(),
  repsScheme: z.string(),
  loadScheme: z.enum(LOAD_SCHEMES),
  targetLoad: z.string().nullable(),
  restSec: z.number().int(),
  tempo: z.string().nullable(),
  tutorialUrl: z.string().nullable(),
  instructions: z.array(z.string()),
  cues: z.array(z.string()),
  mistakes: z.array(z.string()),
});
export type SessionManifestExercise = z.infer<typeof sessionManifestExerciseSchema>;

export const sessionManifestBlockSchema = z.object({
  id: z.string().uuid(),
  blockType: z.enum(BLOCK_TYPES),
  exercises: z.array(sessionManifestExerciseSchema),
});
export type SessionManifestBlock = z.infer<typeof sessionManifestBlockSchema>;

export const sessionManifestSchema = z.object({
  dayId: z.string().uuid(),
  title: z.string().nullable(),
  estimatedMinutes: z.number().int(),
  isRestDay: z.boolean(),
  blocks: z.array(sessionManifestBlockSchema),
});
export type SessionManifest = z.infer<typeof sessionManifestSchema>;

// ── Plan Progress ──
export const planProgressSchema = z.object({
  currentWeek: z.number().int(),
  totalWeeks: z.number().int(),
  percentComplete: z.number().min(0).max(100),
  startDate: z.string(),
  estimatedEndDate: z.string(),
});
export type PlanProgress = z.infer<typeof planProgressSchema>;
