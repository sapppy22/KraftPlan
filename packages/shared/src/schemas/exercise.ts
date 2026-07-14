import { z } from 'zod';
import { DIFFICULTY_LEVELS, EQUIPMENT_TYPES, EXERCISE_CATEGORIES } from '../constants.js';

export const exerciseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: z.enum(EXERCISE_CATEGORIES),
  primaryMuscles: z.array(z.string()),
  secondaryMuscles: z.array(z.string()),
  equipment: z.array(z.enum(EQUIPMENT_TYPES)),
  difficulty: z.enum(DIFFICULTY_LEVELS),
  tutorialUrl: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  instructions: z.array(z.string()),
  cues: z.array(z.string()),
  mistakes: z.array(z.string()),
});
export type Exercise = z.infer<typeof exerciseSchema>;

export const exerciseSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  primaryMuscles: z.array(z.string()),
  equipment: z.array(z.enum(EQUIPMENT_TYPES)),
  difficulty: z.enum(DIFFICULTY_LEVELS),
  thumbnailUrl: z.string().nullable(),
});
export type ExerciseSummary = z.infer<typeof exerciseSummarySchema>;

export const exerciseSearchSchema = z.object({
  q: z.string().max(200).optional(),
  muscle: z.string().optional(),
  equipment: z.enum(EQUIPMENT_TYPES).optional(),
  category: z.enum(EXERCISE_CATEGORIES).optional(),
  difficulty: z.enum(DIFFICULTY_LEVELS).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ExerciseSearch = z.infer<typeof exerciseSearchSchema>;

export const exerciseDetailSchema = exerciseSchema.extend({
  alternatives: z.array(exerciseSummarySchema),
});
export type ExerciseDetail = z.infer<typeof exerciseDetailSchema>;
