// ══════════════════════════════════════
// NUTRITION & ENERGY BALANCE
// ══════════════════════════════════════
// Pure formulas shared by the API (targets, energy balance) and the web app
// (live recalculation as the user edits their numbers).

// ── Biological sex (drives the BMR equation, not identity) ──
export const SEXES = ['male', 'female'] as const;
export type Sex = (typeof SEXES)[number];

// ── Activity levels (Mifflin-St Jeor multipliers) ──
export const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary', hint: 'Desk job, little movement', factor: 1.2 },
  { id: 'light', label: 'Lightly active', hint: 'Light exercise 1-3 days/week', factor: 1.375 },
  { id: 'moderate', label: 'Moderately active', hint: 'Training 3-5 days/week', factor: 1.55 },
  { id: 'active', label: 'Very active', hint: 'Hard training 6-7 days/week', factor: 1.725 },
  { id: 'athlete', label: 'Athlete', hint: 'Twice-a-day or physical job', factor: 1.9 },
] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number]['id'];

export function activityFactor(level?: string | null): number {
  return ACTIVITY_LEVELS.find((l) => l.id === level)?.factor ?? 1.375;
}

// ── Diet goals ──
export const DIET_GOALS = ['cut', 'maintain', 'bulk'] as const;
export type DietGoal = (typeof DIET_GOALS)[number];

/** Calorie delta applied to maintenance, as a fraction of TDEE. */
export const DIET_GOAL_ADJUSTMENT: Record<DietGoal, number> = {
  cut: -0.2,
  maintain: 0,
  bulk: 0.15,
};

// ── Meals ──
export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type MealType = (typeof MEAL_TYPES)[number];

// ── Manual activity types ──
export const ACTIVITY_TYPES = ['steps', 'cardio', 'sport', 'other'] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

/** Energy in one kilogram of body mass — used for weekly rate projections. */
export const KCAL_PER_KG = 7700;

// ── Body metrics ──
/** Body Mass Index (kg/m²). Returns null when inputs are missing/implausible. */
export function bmi(weightKg?: number | null, heightCm?: number | null): number | null {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) return null;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export const BMI_BANDS = [
  { id: 'underweight', label: 'Underweight', min: 0, max: 18.5 },
  { id: 'healthy', label: 'Healthy', min: 18.5, max: 25 },
  { id: 'overweight', label: 'Overweight', min: 25, max: 30 },
  { id: 'obese', label: 'Obese', min: 30, max: Infinity },
] as const;
export type BMIBand = (typeof BMI_BANDS)[number]['id'];

export function bmiCategory(value?: number | null): BMIBand | null {
  if (!value || value <= 0) return null;
  return (BMI_BANDS.find((b) => value >= b.min && value < b.max)?.id ?? 'obese') as BMIBand;
}

/** Healthy-BMI weight range (kg) for a given height. */
export function healthyWeightRange(heightCm?: number | null): { minKg: number; maxKg: number } | null {
  if (!heightCm || heightCm <= 0) return null;
  const m = heightCm / 100;
  return {
    minKg: Math.round(18.5 * m * m * 10) / 10,
    maxKg: Math.round(24.9 * m * m * 10) / 10,
  };
}

// ── Energy expenditure ──
/**
 * Mifflin-St Jeor basal metabolic rate (kcal/day) — the modern default, more
 * accurate than Harris-Benedict for the general population.
 */
export function bmr(input: {
  weightKg?: number | null;
  heightCm?: number | null;
  age?: number | null;
  sex?: string | null;
}): number | null {
  const { weightKg, heightCm, age } = input;
  if (!weightKg || !heightCm || !age || weightKg <= 0 || heightCm <= 0 || age <= 0) return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const value = input.sex === 'female' ? base - 161 : base + 5;
  return Math.max(0, Math.round(value));
}

/** Maintenance calories (kcal/day) = BMR × activity factor. */
export function tdee(bmrValue?: number | null, level?: string | null): number | null {
  if (!bmrValue || bmrValue <= 0) return null;
  return Math.round(bmrValue * activityFactor(level));
}

/**
 * Daily calorie target for a goal. Cuts are floored at BMR × 1.1 so the plan
 * never prescribes an unsafe deficit.
 */
export function goalCalories(
  maintenance?: number | null,
  goal: DietGoal = 'maintain',
  bmrValue?: number | null,
): number | null {
  if (!maintenance || maintenance <= 0) return null;
  const target = Math.round(maintenance * (1 + DIET_GOAL_ADJUSTMENT[goal]));
  if (goal === 'cut' && bmrValue) return Math.max(target, Math.round(bmrValue * 1.1));
  return target;
}

/** Projected weekly bodyweight change (kg) for a daily calorie delta. */
export function weeklyWeightChangeKg(dailyDelta: number): number {
  return Math.round(((dailyDelta * 7) / KCAL_PER_KG) * 100) / 100;
}

// ── Macros ──
export interface MacroTargets {
  proteinG: number;
  carbsG: number;
  fatG: number;
}

/**
 * Split a calorie target into macros: protein anchored to bodyweight (higher on
 * a cut to protect lean mass), fat at 25% of calories, carbs take the rest.
 */
export function macroTargets(
  calories?: number | null,
  weightKg?: number | null,
  goal: DietGoal = 'maintain',
): MacroTargets | null {
  if (!calories || calories <= 0) return null;
  const proteinPerKg = goal === 'cut' ? 2.2 : goal === 'bulk' ? 2.0 : 1.8;
  const proteinG = Math.round((weightKg && weightKg > 0 ? weightKg : 70) * proteinPerKg);
  const fatG = Math.round((calories * 0.25) / 9);
  const carbsG = Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4));
  return { proteinG, carbsG, fatG };
}

/** Calories represented by a macro breakdown (4/4/9 kcal per gram). */
export function caloriesFromMacros(m: Partial<MacroTargets>): number {
  return Math.round((m.proteinG ?? 0) * 4 + (m.carbsG ?? 0) * 4 + (m.fatG ?? 0) * 9);
}

// ── Calories out ──
/**
 * Resting + daily-living burn (kcal/day) before any logged exercise. Uses the
 * sedentary multiplier deliberately: logged workouts, steps and cardio are
 * added on top, so a higher factor here would double-count them.
 */
export function baselineBurn(bmrValue?: number | null): number | null {
  if (!bmrValue || bmrValue <= 0) return null;
  return Math.round(bmrValue * 1.2);
}

/**
 * Kcal burned for `minutes` of an activity with a given MET value.
 * kcal = MET × 3.5 × kg / 200 per minute (ACSM).
 */
export function metCalories(met: number, weightKg: number | null | undefined, minutes: number): number {
  const kg = weightKg && weightKg > 0 ? weightKg : 70;
  if (!minutes || minutes <= 0) return 0;
  return Math.round(((met * 3.5 * kg) / 200) * minutes);
}

/** MET estimates for the workout categories we schedule. */
export const WORKOUT_METS: Record<string, number> = {
  strength: 5,
  hypertrophy: 5,
  powerlifting: 5.5,
  mobility: 2.5,
  endurance: 8,
  hyrox: 9,
  conditioning: 8,
  athletic: 7,
  weightloss: 6,
};

export function workoutMet(category?: string | null): number {
  return WORKOUT_METS[(category || '').toLowerCase()] ?? 5;
}

/** MET estimates for manually logged cardio. */
export const CARDIO_ACTIVITIES = [
  { id: 'walking', label: 'Walking', met: 3.5 },
  { id: 'running', label: 'Running', met: 9.8 },
  { id: 'cycling', label: 'Cycling', met: 7.5 },
  { id: 'swimming', label: 'Swimming', met: 8.3 },
  { id: 'rowing', label: 'Rowing', met: 7 },
  { id: 'elliptical', label: 'Elliptical', met: 5 },
  { id: 'jump-rope', label: 'Jump rope', met: 11 },
  { id: 'hiking', label: 'Hiking', met: 6 },
  { id: 'sports', label: 'Team sport', met: 7 },
] as const;

export function cardioMet(id?: string | null): number {
  return CARDIO_ACTIVITIES.find((a) => a.id === id)?.met ?? 6;
}

/**
 * Kcal burned walking `steps`. Roughly 0.04 kcal per step for a 70 kg adult,
 * scaled linearly by bodyweight.
 */
export function stepsCalories(steps: number, weightKg?: number | null): number {
  if (!steps || steps <= 0) return 0;
  const kg = weightKg && weightKg > 0 ? weightKg : 70;
  return Math.round(steps * 0.04 * (kg / 70));
}

/** Approximate distance (km) covered by a step count (0.75 m stride). */
export function stepsToKm(steps: number): number {
  return Math.round((steps * 0.75) / 100) / 10;
}

// ── Energy balance ──
export interface EnergyBalance {
  caloriesIn: number;
  /** Baseline burn (BMR × activity factor) before logged exercise. */
  baselineOut: number;
  /** Burn from logged workouts, steps and cardio. */
  exerciseOut: number;
  caloriesOut: number;
  /** in − out. Negative = deficit. */
  net: number;
  /** Target for the chosen goal (kcal/day), when the profile is complete. */
  target: number | null;
  /** in − target. Negative = under target. */
  vsTarget: number | null;
}

export function energyBalance(input: {
  caloriesIn: number;
  baselineOut?: number | null;
  exerciseOut?: number | null;
  target?: number | null;
}): EnergyBalance {
  const caloriesIn = Math.round(input.caloriesIn || 0);
  const baselineOut = Math.round(input.baselineOut || 0);
  const exerciseOut = Math.round(input.exerciseOut || 0);
  const caloriesOut = baselineOut + exerciseOut;
  return {
    caloriesIn,
    baselineOut,
    exerciseOut,
    caloriesOut,
    net: caloriesIn - caloriesOut,
    target: input.target ?? null,
    vsTarget: input.target ? caloriesIn - input.target : null,
  };
}

/** Age in whole years from a birth year (nullable passthrough). */
export function ageFromBirthYear(birthYear?: number | null, now = new Date()): number | null {
  if (!birthYear || birthYear < 1900) return null;
  const age = now.getFullYear() - birthYear;
  return age > 0 && age < 120 ? age : null;
}
