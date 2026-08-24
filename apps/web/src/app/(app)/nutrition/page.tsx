'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity as ActivityIcon,
  ChefHat,
  Flame,
  Loader2,
  Pencil,
  Plus,
  Scale,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';
import { DIET_GOALS, MEAL_TYPES, type DietGoal, type MealType } from '@kraftplan/shared';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/Card';
import { BodyMetricsForm } from '@/components/nutrition/BodyMetricsForm';
import { RecipeCard } from '@/components/nutrition/RecipeCard';
import { suggestRecipes, type Recipe } from '@/lib/recipes';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { MembersOnlyGate } from '@/components/MembersOnlyGate';

const GOAL_COPY: Record<DietGoal, { label: string; blurb: string }> = {
  cut: { label: 'Cut', blurb: 'Lose fat' },
  maintain: { label: 'Maintain', blurb: 'Hold weight' },
  bulk: { label: 'Bulk', blurb: 'Build mass' },
};

const BMI_COPY: Record<string, { label: string; tint: string }> = {
  underweight: { label: 'Underweight', tint: 'text-warning' },
  healthy: { label: 'Healthy', tint: 'text-success' },
  overweight: { label: 'Overweight', tint: 'text-warning' },
  obese: { label: 'Obese', tint: 'text-danger' },
};

/** Calorie ring — consumed vs the day's target. */
function CalorieRing({ consumed, target }: { consumed: number; target: number | null }) {
  const pct = target ? Math.min(100, Math.round((consumed / target) * 100)) : 0;
  const r = 54;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="relative w-36 h-36 shrink-0">
      <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="11" />
        <circle
          cx="64" cy="64" r={r} fill="none"
          stroke="var(--brand-green)" strokeWidth="11" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (circumference * pct) / 100}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-bold leading-none">{consumed}</span>
        <span className="text-[11px] text-text-secondary mt-1">
          {target ? `of ${target} kcal` : 'kcal eaten'}
        </span>
      </div>
    </div>
  );
}

function MacroBar({ label, value, target, tint }: { label: string; value: number; target?: number | null; tint: string }) {
  const pct = target ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-text-secondary">{label}</span>
        <span className="font-medium">
          {value}
          {target ? <span className="text-text-secondary"> / {target}g</span> : 'g'}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', tint)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function NutritionPage() {
  const { isGuest } = useAuth();
  const queryClient = useQueryClient();
  const [editingMetrics, setEditingMetrics] = useState(false);
  const [mealFilter, setMealFilter] = useState<MealType | 'all'>('all');
  const [vegOnly, setVegOnly] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState({ name: '', calories: '', proteinG: '', carbsG: '', fatG: '', meal: 'snack' as MealType });

  const { data, isLoading } = useQuery({
    queryKey: ['nutrition', 'day'],
    queryFn: () => api.getNutritionDay(),
    enabled: !isGuest,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['nutrition'] });
    queryClient.invalidateQueries({ queryKey: ['activity'] });
  };

  const saveProfile = useMutation({
    mutationFn: (patch: Record<string, unknown>) => api.updateNutritionProfile(patch),
    onSuccess: () => {
      setEditingMetrics(false);
      refresh();
    },
  });

  const addFood = useMutation({
    mutationFn: (entry: any) => api.logFood(entry),
    onSuccess: refresh,
  });

  const removeFood = useMutation({
    mutationFn: (id: string) => api.deleteFoodLog(id),
    onSuccess: refresh,
  });

  const complete = !!data?.complete;
  const goal: DietGoal = data?.profile?.dietGoal ?? 'maintain';
  const target: number | null = data?.target ?? null;
  const consumed: number = data?.food?.totals?.calories ?? 0;
  const remaining = target != null ? target - consumed : null;
  const burned = data?.activity?.exerciseOut ?? 0;
  const macros = data?.targetMacros ?? null;
  const totals = data?.food?.totals ?? { proteinG: 0, carbsG: 0, fatG: 0 };

  const recipes = useMemo(
    () =>
      suggestRecipes({
        remaining: remaining ?? 600,
        remainingProteinG: macros ? Math.max(0, macros.proteinG - totals.proteinG) : null,
        goal,
        meal: mealFilter,
        vegetarianOnly: vegOnly,
        limit: 6,
      }),
    [remaining, macros, totals.proteinG, goal, mealFilter, vegOnly],
  );

  function handleAddRecipe(recipe: Recipe) {
    addFood.mutate({
      meal: recipe.meals[0],
      name: recipe.name,
      servings: 1,
      calories: recipe.calories,
      proteinG: recipe.proteinG,
      carbsG: recipe.carbsG,
      fatG: recipe.fatG,
      source: 'recipe',
    });
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const calories = parseFloat(manual.calories);
    if (!manual.name.trim() || !Number.isFinite(calories)) return;
    addFood.mutate(
      {
        meal: manual.meal,
        name: manual.name.trim(),
        servings: 1,
        calories,
        proteinG: parseFloat(manual.proteinG) || null,
        carbsG: parseFloat(manual.carbsG) || null,
        fatG: parseFloat(manual.fatG) || null,
        source: 'manual',
      },
      {
        onSuccess: () => {
          setManual({ name: '', calories: '', proteinG: '', carbsG: '', fatG: '', meal: manual.meal });
          setShowManual(false);
        },
      },
    );
  }

  // Guests all share one demo account, so body metrics and food logs — which
  // are personal — need a real one.
  if (isGuest) {
    return (
      <MembersOnlyGate
        feature="Nutrition"
        plural={false}
        description="Your BMI, calorie targets and food log are tied to your own body metrics, so they need a free account. Workouts you can still do right now."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
      </div>
    );
  }

  const bmiBand = data?.bmiCategory ? BMI_COPY[data.bmiCategory] : null;
  const entries: any[] = data?.food?.entries ?? [];
  const inputClass =
    'w-full px-3 py-2.5 bg-bg-elevated border border-hairline rounded-xl text-text-primary text-sm focus:outline-none focus:border-brand-green';

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-brand-green">Nutrition</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Fuel the work</h1>
        </div>
        <Link
          href="/activity"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-surface-1 border border-hairline text-xs font-medium text-text-secondary hover:text-text-primary"
        >
          <ActivityIcon className="w-3.5 h-3.5" />
          Calories out
        </Link>
      </div>

      {/* ── Body metrics ───────────────────────────────────────────────────── */}
      {!complete || editingMetrics ? (
        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-brand-green" />
            <h2 className="font-semibold">Your numbers</h2>
          </div>
          <p className="text-sm text-text-secondary">
            BMI and your maintenance calories come straight from these — we don&apos;t guess.
          </p>
          <BodyMetricsForm
            profile={data?.profile}
            saving={saveProfile.isPending}
            onSave={(patch) => saveProfile.mutate(patch)}
          />
          {complete && (
            <button
              onClick={() => setEditingMetrics(false)}
              className="w-full text-sm text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="sm:col-span-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-text-secondary">BMI</p>
                <p className="font-display text-3xl font-bold mt-0.5">{data.bmi}</p>
                {bmiBand && <p className={cn('text-sm font-medium mt-0.5', bmiBand.tint)}>{bmiBand.label}</p>}
              </div>
              <button
                onClick={() => setEditingMetrics(true)}
                className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-1"
                aria-label="Edit body metrics"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            {data.healthyWeightRange && (
              <p className="text-xs text-text-secondary mt-3">
                Healthy range for {data.profile.heightCm} cm:{' '}
                <span className="text-text-primary font-medium">
                  {data.healthyWeightRange.minKg}–{data.healthyWeightRange.maxKg} kg
                </span>
              </p>
            )}
          </Card>

          <Card>
            <p className="text-xs text-text-secondary">Maintenance</p>
            <p className="font-display text-3xl font-bold mt-0.5">
              {data.maintenanceCalories}
              <span className="text-base font-medium text-text-secondary ml-1">kcal</span>
            </p>
            <p className="text-xs text-text-secondary mt-3">
              Resting burn {data.bmr} kcal, scaled by your daily activity.
            </p>
          </Card>

          <Card>
            <p className="text-xs text-text-secondary">Today&apos;s target</p>
            <p className="font-display text-3xl font-bold mt-0.5">
              {target}
              <span className="text-base font-medium text-text-secondary ml-1">kcal</span>
            </p>
            <p className="text-xs text-text-secondary mt-3">
              {GOAL_COPY[goal].label} ·{' '}
              {data.goals?.find((g: any) => g.goal === goal)?.weeklyChangeKg
                ? `${data.goals.find((g: any) => g.goal === goal).weeklyChangeKg > 0 ? '+' : ''}${
                    data.goals.find((g: any) => g.goal === goal).weeklyChangeKg
                  } kg/week`
                : 'holding steady'}
            </p>
          </Card>
        </div>
      )}

      {/* ── Goal picker ────────────────────────────────────────────────────── */}
      {complete && (
        <Card className="space-y-3">
          <h2 className="font-semibold">Bulk or cut?</h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {DIET_GOALS.map((g) => {
              const info = data.goals?.find((x: any) => x.goal === g);
              const active = goal === g;
              return (
                <button
                  key={g}
                  onClick={() => saveProfile.mutate({ dietGoal: g })}
                  disabled={saveProfile.isPending}
                  className={cn(
                    'p-3 rounded-2xl border text-left transition-all disabled:opacity-60',
                    active
                      ? 'border-brand-green bg-brand-green/10'
                      : 'border-hairline bg-bg-surface hover:border-text-secondary/30',
                  )}
                >
                  <p className={cn('text-sm font-bold', active && 'text-brand-green')}>{GOAL_COPY[g].label}</p>
                  <p className="text-[11px] text-text-secondary">{GOAL_COPY[g].blurb}</p>
                  <p className="font-display text-lg font-bold mt-1.5">{info?.calories ?? '—'}</p>
                  <p className="text-[11px] text-text-secondary">
                    {info?.weeklyChangeKg
                      ? `${info.weeklyChangeKg > 0 ? '+' : ''}${info.weeklyChangeKg} kg/wk`
                      : 'kcal/day'}
                  </p>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Today's intake ─────────────────────────────────────────────────── */}
      <Card className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Flame className="w-4 h-4 text-brand-green" />
            Today
          </h2>
          {burned > 0 && (
            <Link href="/activity" className="text-xs text-text-secondary hover:text-brand-green">
              +{burned} kcal burned →
            </Link>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <CalorieRing consumed={consumed} target={target} />
          <div className="flex-1 w-full space-y-3">
            {remaining != null ? (
              <p className="text-sm">
                {remaining >= 0 ? (
                  <>
                    <span className="font-display text-2xl font-bold">{remaining}</span>{' '}
                    <span className="text-text-secondary">kcal left today</span>
                  </>
                ) : (
                  <>
                    <span className="font-display text-2xl font-bold text-warning">{Math.abs(remaining)}</span>{' '}
                    <span className="text-text-secondary">kcal over target</span>
                  </>
                )}
              </p>
            ) : (
              <p className="text-sm text-text-secondary">
                Add your height, weight, age and sex above to get a calorie target.
              </p>
            )}
            <MacroBar label="Protein" value={totals.proteinG} target={macros?.proteinG} tint="bg-brand-green" />
            <MacroBar label="Carbs" value={totals.carbsG} target={macros?.carbsG} tint="bg-brand-teal" />
            <MacroBar label="Fat" value={totals.fatG} target={macros?.fatG} tint="bg-brand-mint" />
          </div>
        </div>
      </Card>

      {/* ── Recipe suggestions ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-brand-green" />
            {remaining != null && remaining > 0 ? `Fill the last ${remaining} kcal` : 'Meal ideas'}
          </h2>
          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={cn(
              'px-3 py-1.5 rounded-pill text-xs font-medium border transition-colors',
              vegOnly
                ? 'border-brand-green text-brand-green bg-brand-green/10'
                : 'border-hairline text-text-secondary hover:text-text-primary',
            )}
          >
            Vegetarian only
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['all', ...MEAL_TYPES] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMealFilter(m as MealType | 'all')}
              className={cn(
                'px-3 py-1.5 rounded-pill text-xs font-medium capitalize whitespace-nowrap border transition-colors',
                mealFilter === m
                  ? 'border-brand-green text-brand-green bg-brand-green/10'
                  : 'border-hairline text-text-secondary hover:text-text-primary',
              )}
            >
              {m === 'all' ? 'Any meal' : m}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {recipes.map((r) => (
            <RecipeCard
              key={r.id}
              recipe={r}
              remaining={remaining}
              adding={addFood.isPending}
              onAdd={handleAddRecipe}
            />
          ))}
        </div>
      </div>

      {/* ── Food log ───────────────────────────────────────────────────────── */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-brand-green" />
            What you ate
          </h2>
          <button
            onClick={() => setShowManual(!showManual)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill border border-hairline text-xs font-medium text-text-secondary hover:text-text-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            Add food
          </button>
        </div>

        {showManual && (
          <form onSubmit={handleManualSubmit} className="space-y-3 p-3 rounded-2xl bg-bg-elevated border border-hairline">
            <input
              value={manual.name}
              onChange={(e) => setManual({ ...manual, name: e.target.value })}
              placeholder="What did you eat?"
              className={inputClass}
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number" min={0} inputMode="numeric"
                value={manual.calories}
                onChange={(e) => setManual({ ...manual, calories: e.target.value })}
                placeholder="Calories"
                className={inputClass}
                required
              />
              <select
                value={manual.meal}
                onChange={(e) => setManual({ ...manual, meal: e.target.value as MealType })}
                className={cn(inputClass, 'capitalize')}
              >
                {MEAL_TYPES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number" min={0} inputMode="numeric"
                value={manual.proteinG}
                onChange={(e) => setManual({ ...manual, proteinG: e.target.value })}
                placeholder="Protein g"
                className={inputClass}
              />
              <input
                type="number" min={0} inputMode="numeric"
                value={manual.carbsG}
                onChange={(e) => setManual({ ...manual, carbsG: e.target.value })}
                placeholder="Carbs g"
                className={inputClass}
              />
              <input
                type="number" min={0} inputMode="numeric"
                value={manual.fatG}
                onChange={(e) => setManual({ ...manual, fatG: e.target.value })}
                placeholder="Fat g"
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={addFood.isPending}
              className="w-full py-2.5 gradient-bg rounded-pill text-white text-sm font-semibold disabled:opacity-60"
            >
              {addFood.isPending ? 'Adding…' : 'Add to today'}
            </button>
          </form>
        )}

        {entries.length === 0 ? (
          <p className="text-sm text-text-secondary py-4 text-center">
            Nothing logged yet today. Add a meal above, or tap a recipe suggestion.
          </p>
        ) : (
          <div className="space-y-4">
            {MEAL_TYPES.filter((m) => entries.some((e) => e.meal === m)).map((meal) => (
              <div key={meal}>
                <p className="text-xs uppercase tracking-wide text-text-secondary font-medium mb-2">{meal}</p>
                <div className="space-y-2">
                  {entries.filter((e) => e.meal === meal).map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-bg-elevated border border-hairline"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{e.name}</p>
                        <p className="text-xs text-text-secondary">
                          {e.proteinG != null || e.carbsG != null || e.fatG != null
                            ? `P ${e.proteinG ?? 0}g · C ${e.carbsG ?? 0}g · F ${e.fatG ?? 0}g`
                            : 'No macros logged'}
                        </p>
                      </div>
                      <span className="text-sm font-bold shrink-0">{e.calories}</span>
                      <button
                        onClick={() => removeFood.mutate(e.id)}
                        disabled={removeFood.isPending}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-danger hover:bg-danger/10 disabled:opacity-50"
                        aria-label={`Remove ${e.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
