import { z } from 'zod';
import { ACTIVITY_LEVELS, ACTIVITY_TYPES, DIET_GOALS, MEAL_TYPES, SEXES } from '../nutrition.js';

const activityLevelIds = ACTIVITY_LEVELS.map((l) => l.id) as [string, ...string[]];
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// ── Nutrition profile (the inputs BMI / BMR / TDEE need) ──
export const nutritionProfileSchema = z.object({
  sex: z.enum(SEXES).optional().nullable(),
  birthYear: z.number().int().min(1900).max(new Date().getFullYear()).optional().nullable(),
  bodyweightKg: z.number().positive().max(500).optional().nullable(),
  heightCm: z.number().positive().max(300).optional().nullable(),
  activityLevel: z.enum(activityLevelIds).optional().nullable(),
  dietGoal: z.enum(DIET_GOALS).optional().nullable(),
  /** Overrides the computed target when the user knows their own number. */
  calorieTargetOverride: z.number().int().min(800).max(10000).optional().nullable(),
});
export type NutritionProfileInput = z.infer<typeof nutritionProfileSchema>;

// ── Food log ──
export const foodLogSchema = z.object({
  date: dateString.optional(),
  meal: z.enum(MEAL_TYPES).default('snack'),
  name: z.string().min(1).max(160),
  servings: z.number().positive().max(50).default(1),
  calories: z.number().nonnegative().max(10000),
  proteinG: z.number().nonnegative().max(1000).optional().nullable(),
  carbsG: z.number().nonnegative().max(1000).optional().nullable(),
  fatG: z.number().nonnegative().max(1000).optional().nullable(),
  /** 'manual' when typed by hand, 'recipe' when added from a suggestion. */
  source: z.string().max(40).default('manual'),
});
export type FoodLogInput = z.infer<typeof foodLogSchema>;

// ── Activity log (steps / cardio the app can't capture itself) ──
export const activityLogSchema = z.object({
  date: dateString.optional(),
  type: z.enum(ACTIVITY_TYPES).default('cardio'),
  /** Cardio modality id (running, cycling, …) — drives the MET estimate. */
  activityId: z.string().max(40).optional().nullable(),
  steps: z.number().int().nonnegative().max(200000).optional().nullable(),
  durationMin: z.number().nonnegative().max(1440).optional().nullable(),
  distanceM: z.number().nonnegative().max(1000000).optional().nullable(),
  /** Overrides the MET/step estimate when the user has a device reading. */
  caloriesOut: z.number().nonnegative().max(20000).optional().nullable(),
  note: z.string().max(200).optional().nullable(),
});
export type ActivityLogInput = z.infer<typeof activityLogSchema>;
