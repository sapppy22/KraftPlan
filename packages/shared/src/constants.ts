// ── Plan Categories ──
export const PLAN_CATEGORIES = [
  'mobility',
  'strength',
  'hypertrophy',
  'powerlifting',
  'hyrox',
  'endurance',
  'athletic',
  'conditioning',
  'weightloss',
] as const;
export type PlanCategory = (typeof PLAN_CATEGORIES)[number];

// ── Difficulty ──
export const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type Difficulty = (typeof DIFFICULTY_LEVELS)[number];

// ── Equipment ──
export const EQUIPMENT_TYPES = [
  'none',
  'dumbbells',
  'barbell',
  'kettlebell',
  'resistance-bands',
  'cable-machine',
  'pull-up-bar',
  'bench',
  'squat-rack',
  'cardio-machine',
  'medicine-ball',
  'foam-roller',
  'mat',
  'sled',
  'battle-ropes',
  'box',
] as const;
export type Equipment = (typeof EQUIPMENT_TYPES)[number];

// ── Block Types ──
export const BLOCK_TYPES = ['warmup', 'main', 'accessory', 'finisher', 'cooldown'] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

// ── Exercise Categories ──
export const EXERCISE_CATEGORIES = [
  'resistance',
  'time',
  'bodyweight',
  'plyo',
  'mobility',
  'cardio',
] as const;
export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];

// ── Units ──
export const UNITS = ['metric', 'imperial'] as const;
export type Units = (typeof UNITS)[number];

// ── Workout Status ──
export const WORKOUT_STATUS = ['active', 'completed', 'abandoned'] as const;
export type WorkoutStatus = (typeof WORKOUT_STATUS)[number];

// ── Set Status ──
export const SET_STATUS = ['completed', 'failed', 'skipped'] as const;
export type SetStatus = (typeof SET_STATUS)[number];

// ── Experience Levels ──
export const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

// ── User Roles ──
export const USER_ROLES = ['user', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

// ── Assignment Status ──
export const ASSIGNMENT_STATUS = ['active', 'completed', 'abandoned'] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUS)[number];

// ── PR Metrics ──
export const PR_METRICS = ['e1rm', 'max_weight', 'best_pace', 'longest_distance'] as const;
export type PRMetric = (typeof PR_METRICS)[number];

// ── Load Schemes ──
export const LOAD_SCHEMES = ['percentage', 'rpe', 'fixed', 'bodyweight'] as const;
export type LoadScheme = (typeof LOAD_SCHEMES)[number];

// ── Formulas ──
/** Epley formula: estimated 1RM = weight * (1 + reps / 30) */
export function epley1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

// ── Unit Conversion ──
export const KG_TO_LB = 2.20462;
export const LB_TO_KG = 0.453592;
export const MI_TO_KM = 1.60934;
export const KM_TO_MI = 0.621371;

export function kgToLb(kg: number): number {
  return Math.round(kg * KG_TO_LB * 10) / 10;
}
export function lbToKg(lb: number): number {
  return Math.round(lb * LB_TO_KG * 10) / 10;
}
export function miToKm(mi: number): number {
  return Math.round(mi * MI_TO_KM * 100) / 100;
}
export function kmToMi(km: number): number {
  return Math.round(km * KM_TO_MI * 100) / 100;
}

// ── Pace helpers ──
/** Convert total seconds and distance meters to pace string (min:sec per km/mi) */
export function paceToString(totalSec: number, distanceM: number, perKm = true): string {
  if (distanceM <= 0) return '--:--';
  const dist = perKm ? distanceM / 1000 : distanceM / 1609.34;
  const paceSec = totalSec / dist;
  const min = Math.floor(paceSec / 60);
  const sec = Math.round(paceSec % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}
