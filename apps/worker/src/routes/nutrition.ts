import { Hono } from 'hono';
import { and, desc, eq, gte, lt } from 'drizzle-orm';
import {
  activityLogSchema,
  ageFromBirthYear,
  baselineBurn,
  bmi,
  bmiCategory,
  bmr,
  cardioMet,
  energyBalance,
  foodLogSchema,
  goalCalories,
  healthyWeightRange,
  macroTargets,
  metCalories,
  nutritionProfileSchema,
  stepsCalories,
  tdee,
  weeklyWeightChangeKg,
  workoutMet,
  type DietGoal,
} from '@kraftplan/shared';
import { schema } from '../db';
import type { DB } from '../db';
import { requireUserId, type AppEnv } from '../context';

// ── Day boundaries ────────────────────────────────────────────────────────
// Food and activity rows are keyed by the user's local calendar day, but
// workout sessions carry a real timestamp. `tzOffset` (minutes, as returned by
// Date.getTimezoneOffset()) converts one to the other so an evening session
// lands on the day the user actually trained.
function todayFor(tzOffsetMin: number): string {
  return new Date(Date.now() - tzOffsetMin * 60_000).toISOString().slice(0, 10);
}

function dayRange(date: string, tzOffsetMin: number): { start: Date; end: Date } {
  const startUtcMs = Date.parse(`${date}T00:00:00Z`) + tzOffsetMin * 60_000;
  return { start: new Date(startUtcMs), end: new Date(startUtcMs + 86_400_000) };
}

function readDayParams(c: any): { date: string; tzOffset: number } {
  const tzOffset = parseInt(c.req.query('tzOffset') ?? '', 10);
  const tz = Number.isFinite(tzOffset) ? tzOffset : 0;
  return { date: c.req.query('date') || todayFor(tz), tzOffset: tz };
}

const num = (v: unknown): number => (v == null ? 0 : parseFloat(v.toString()) || 0);

// ── Profile → metrics ─────────────────────────────────────────────────────
type UserRow = typeof schema.users.$inferSelect;

async function loadUser(db: DB, userId: string): Promise<UserRow | null> {
  const [row] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  return row ?? null;
}

/**
 * Everything derived from the body metrics: BMI + band, BMR, maintenance
 * calories, and the calorie/macro target for each goal so the UI can show what
 * bulking or cutting would cost without a round trip.
 */
function computeMetrics(user: UserRow | null) {
  const weightKg = user?.bodyweightKg ? num(user.bodyweightKg) : null;
  const heightCm = (user as any)?.heightCm ? num((user as any).heightCm) : null;
  const age = ageFromBirthYear((user as any)?.birthYear ?? null);
  const sex = (user as any)?.sex ?? null;
  const activityLevel = (user as any)?.activityLevel ?? null;
  const dietGoal = ((user as any)?.dietGoal ?? 'maintain') as DietGoal;
  const override = (user as any)?.calorieTargetOverride ?? null;

  const bmiValue = bmi(weightKg, heightCm);
  const bmrValue = bmr({ weightKg, heightCm, age, sex });
  const maintenance = tdee(bmrValue, activityLevel);

  const goals = (['cut', 'maintain', 'bulk'] as DietGoal[]).map((goal) => {
    const calories = goalCalories(maintenance, goal, bmrValue);
    return {
      goal,
      calories,
      macros: macroTargets(calories, weightKg, goal),
      weeklyChangeKg: calories && maintenance ? weeklyWeightChangeKg(calories - maintenance) : null,
    };
  });

  const computedTarget = goals.find((g) => g.goal === dietGoal)?.calories ?? null;
  const target = override ?? computedTarget;

  return {
    profile: {
      sex,
      birthYear: (user as any)?.birthYear ?? null,
      age,
      bodyweightKg: weightKg,
      heightCm,
      activityLevel,
      dietGoal,
      calorieTargetOverride: override,
      units: user?.units ?? 'metric',
    },
    // `complete` gates the UI: without these we can't compute a real target.
    complete: !!(weightKg && heightCm && age && sex),
    bmi: bmiValue,
    bmiCategory: bmiCategory(bmiValue),
    healthyWeightRange: healthyWeightRange(heightCm),
    bmr: bmrValue,
    maintenanceCalories: maintenance,
    baselineBurn: baselineBurn(bmrValue),
    goals,
    target,
    targetMacros: macroTargets(target, weightKg, dietGoal),
  };
}

// ── Day aggregation ───────────────────────────────────────────────────────
async function loadFood(db: DB, userId: string, date: string) {
  const rows = await db
    .select()
    .from(schema.foodLogs)
    .where(and(eq(schema.foodLogs.userId, userId), eq(schema.foodLogs.date, date)))
    .orderBy(desc(schema.foodLogs.createdAt));

  const entries = rows.map((r) => ({
    id: r.id,
    date: r.date,
    meal: r.meal,
    name: r.name,
    servings: num(r.servings),
    calories: Math.round(num(r.calories)),
    proteinG: r.proteinG == null ? null : Math.round(num(r.proteinG)),
    carbsG: r.carbsG == null ? null : Math.round(num(r.carbsG)),
    fatG: r.fatG == null ? null : Math.round(num(r.fatG)),
    source: r.source,
    createdAt: r.createdAt.toISOString(),
  }));

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      proteinG: acc.proteinG + (e.proteinG ?? 0),
      carbsG: acc.carbsG + (e.carbsG ?? 0),
      fatG: acc.fatG + (e.fatG ?? 0),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );

  return { entries, totals };
}

/**
 * Workouts done in the app become activity entries automatically — no manual
 * logging. Completed sessions use the burn frozen at completion; a session
 * still in progress is estimated live from elapsed time.
 */
async function loadWorkoutBurn(db: DB, userId: string, date: string, tzOffset: number, weightKg: number | null) {
  const { start, end } = dayRange(date, tzOffset);
  const rows = await db
    .select({
      id: schema.workoutSessions.id,
      status: schema.workoutSessions.status,
      startedAt: schema.workoutSessions.startedAt,
      endedAt: schema.workoutSessions.endedAt,
      durationSec: schema.workoutSessions.durationSec,
      estimatedKcal: schema.workoutSessions.estimatedKcal,
      totalVolumeKg: schema.workoutSessions.totalVolumeKg,
      title: schema.planDays.title,
      category: schema.plans.category,
    })
    .from(schema.workoutSessions)
    .leftJoin(schema.planDays, eq(schema.workoutSessions.planDayId, schema.planDays.id))
    .leftJoin(schema.planWeeks, eq(schema.planDays.weekId, schema.planWeeks.id))
    .leftJoin(schema.plans, eq(schema.planWeeks.planId, schema.plans.id))
    .where(
      and(
        eq(schema.workoutSessions.userId, userId),
        gte(schema.workoutSessions.startedAt, start),
        lt(schema.workoutSessions.startedAt, end),
      ),
    )
    .orderBy(desc(schema.workoutSessions.startedAt));

  return rows
    .filter((r) => r.status !== 'abandoned')
    .map((r) => {
      // Finished sessions report the in-app clock; a live one is still ticking,
      // so fall back to wall-clock for it.
      const endMs = r.endedAt ? r.endedAt.getTime() : Date.now();
      const durationMin =
        r.durationSec != null
          ? Math.min(300, r.durationSec / 60)
          : Math.min(300, Math.max(0, (endMs - r.startedAt.getTime()) / 60_000));
      const kcal = r.estimatedKcal ?? metCalories(workoutMet(r.category), weightKg, durationMin);
      return {
        id: r.id,
        source: 'workout' as const,
        type: 'workout' as const,
        name: r.title || 'Workout',
        category: r.category,
        status: r.status,
        durationMin: Math.round(durationMin),
        volumeKg: r.totalVolumeKg ? Math.round(num(r.totalVolumeKg)) : null,
        caloriesOut: Math.round(kcal),
        loggedAt: r.startedAt.toISOString(),
      };
    });
}

async function loadManualActivity(db: DB, userId: string, date: string) {
  const rows = await db
    .select()
    .from(schema.activityLogs)
    .where(and(eq(schema.activityLogs.userId, userId), eq(schema.activityLogs.date, date)))
    .orderBy(desc(schema.activityLogs.createdAt));

  return rows.map((r) => ({
    id: r.id,
    source: 'manual' as const,
    type: r.type,
    activityId: r.activityId,
    name: r.note || r.activityId || r.type,
    steps: r.steps,
    durationMin: r.durationMin == null ? null : Math.round(num(r.durationMin)),
    distanceM: r.distanceM == null ? null : Math.round(num(r.distanceM)),
    caloriesOut: Math.round(num(r.caloriesOut)),
    loggedAt: r.createdAt.toISOString(),
  }));
}

/** One round trip that answers "calories in vs calories out" for a day. */
async function buildDay(db: DB, userId: string, date: string, tzOffset: number) {
  const user = await loadUser(db, userId);
  const metrics = computeMetrics(user);
  const weightKg = metrics.profile.bodyweightKg;

  const [food, workouts, manual] = await Promise.all([
    loadFood(db, userId, date),
    loadWorkoutBurn(db, userId, date, tzOffset, weightKg),
    loadManualActivity(db, userId, date),
  ]);

  const exerciseOut =
    workouts.reduce((a, w) => a + w.caloriesOut, 0) + manual.reduce((a, m) => a + m.caloriesOut, 0);
  const steps = manual.reduce((a, m) => a + (m.steps ?? 0), 0);

  return {
    date,
    ...metrics,
    food,
    activity: { workouts, manual, steps, exerciseOut },
    balance: energyBalance({
      caloriesIn: food.totals.calories,
      baselineOut: metrics.baselineBurn,
      exerciseOut,
      target: metrics.target,
    }),
  };
}

// ══════════════════════════════════════
// /nutrition
// ══════════════════════════════════════
export const nutrition = new Hono<AppEnv>();

// GET /nutrition/day?date=&tzOffset= — metrics, food log, activity, balance.
nutrition.get('/day', async (c) => {
  const userId = await requireUserId(c);
  if (userId instanceof Response) return userId;
  const { date, tzOffset } = readDayParams(c);
  return c.json(await buildDay(c.get('db'), userId, date, tzOffset));
});

// GET /nutrition/profile — body metrics + targets only (no day data).
nutrition.get('/profile', async (c) => {
  const userId = await requireUserId(c);
  if (userId instanceof Response) return userId;
  return c.json(computeMetrics(await loadUser(c.get('db'), userId)));
});

// PATCH /nutrition/profile — the inputs BMI/BMR/TDEE need.
nutrition.patch('/profile', async (c) => {
  const userId = await requireUserId(c);
  if (userId instanceof Response) return userId;
  const parsed = nutritionProfileSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  const d = parsed.data;
  const db = c.get('db');

  const patch: Record<string, unknown> = {};
  if (d.sex !== undefined) patch.sex = d.sex;
  if (d.birthYear !== undefined) patch.birthYear = d.birthYear;
  if (d.bodyweightKg !== undefined) patch.bodyweightKg = d.bodyweightKg?.toString() ?? null;
  if (d.heightCm !== undefined) patch.heightCm = d.heightCm?.toString() ?? null;
  if (d.activityLevel !== undefined) patch.activityLevel = d.activityLevel;
  if (d.dietGoal !== undefined) patch.dietGoal = d.dietGoal;
  if (d.calorieTargetOverride !== undefined) patch.calorieTargetOverride = d.calorieTargetOverride;

  if (Object.keys(patch).length) {
    await db.update(schema.users).set(patch).where(eq(schema.users.id, userId));
  }
  return c.json(computeMetrics(await loadUser(db, userId)));
});

// POST /nutrition/log — record something eaten.
nutrition.post('/log', async (c) => {
  const userId = await requireUserId(c);
  if (userId instanceof Response) return userId;
  const parsed = foodLogSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  const d = parsed.data;
  const tzOffset = parseInt(c.req.query('tzOffset') ?? '', 10);
  const date = d.date || todayFor(Number.isFinite(tzOffset) ? tzOffset : 0);

  const [row] = await c
    .get('db')
    .insert(schema.foodLogs)
    .values({
      userId,
      date,
      meal: d.meal,
      name: d.name,
      servings: d.servings.toString(),
      calories: Math.round(d.calories * d.servings).toString(),
      proteinG: d.proteinG == null ? null : (d.proteinG * d.servings).toString(),
      carbsG: d.carbsG == null ? null : (d.carbsG * d.servings).toString(),
      fatG: d.fatG == null ? null : (d.fatG * d.servings).toString(),
      source: d.source,
    })
    .returning();

  return c.json({ id: row.id, date: row.date, calories: Math.round(num(row.calories)) }, 201);
});

// DELETE /nutrition/log/:id
nutrition.delete('/log/:id', async (c) => {
  const userId = await requireUserId(c);
  if (userId instanceof Response) return userId;
  const deleted = await c
    .get('db')
    .delete(schema.foodLogs)
    .where(and(eq(schema.foodLogs.id, c.req.param('id')), eq(schema.foodLogs.userId, userId)))
    .returning({ id: schema.foodLogs.id });
  if (!deleted.length) return c.json({ error: 'Entry not found' }, 404);
  return c.json({ deleted: true });
});

// ══════════════════════════════════════
// /activity
// ══════════════════════════════════════
export const activity = new Hono<AppEnv>();

// GET /activity?date=&tzOffset= — same payload as /nutrition/day.
activity.get('/', async (c) => {
  const userId = await requireUserId(c);
  if (userId instanceof Response) return userId;
  const { date, tzOffset } = readDayParams(c);
  return c.json(await buildDay(c.get('db'), userId, date, tzOffset));
});

// GET /activity/trend?days=7&tzOffset= — daily in/out for the balance chart.
activity.get('/trend', async (c) => {
  const userId = await requireUserId(c);
  if (userId instanceof Response) return userId;
  const tzRaw = parseInt(c.req.query('tzOffset') ?? '', 10);
  const tzOffset = Number.isFinite(tzRaw) ? tzRaw : 0;
  const days = Math.min(31, Math.max(1, parseInt(c.req.query('days') ?? '7', 10) || 7));
  const db = c.get('db');

  const user = await loadUser(db, userId);
  const metrics = computeMetrics(user);
  const weightKg = metrics.profile.bodyweightKg;
  const baseline = metrics.baselineBurn ?? 0;

  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    dates.push(new Date(Date.now() - tzOffset * 60_000 - i * 86_400_000).toISOString().slice(0, 10));
  }

  const rows = await Promise.all(
    dates.map(async (date) => {
      const [food, workouts, manual] = await Promise.all([
        loadFood(db, userId, date),
        loadWorkoutBurn(db, userId, date, tzOffset, weightKg),
        loadManualActivity(db, userId, date),
      ]);
      const exerciseOut =
        workouts.reduce((a, w) => a + w.caloriesOut, 0) + manual.reduce((a, m) => a + m.caloriesOut, 0);
      return {
        date,
        caloriesIn: food.totals.calories,
        caloriesOut: baseline + exerciseOut,
        exerciseOut,
        steps: manual.reduce((a, m) => a + (m.steps ?? 0), 0),
        net: food.totals.calories - (baseline + exerciseOut),
      };
    }),
  );

  return c.json({ target: metrics.target, baselineBurn: metrics.baselineBurn, days: rows });
});

// POST /activity — log steps or cardio the player can't capture itself.
activity.post('/', async (c) => {
  const userId = await requireUserId(c);
  if (userId instanceof Response) return userId;
  const parsed = activityLogSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  const d = parsed.data;
  const db = c.get('db');

  const tzRaw = parseInt(c.req.query('tzOffset') ?? '', 10);
  const date = d.date || todayFor(Number.isFinite(tzRaw) ? tzRaw : 0);

  const user = await loadUser(db, userId);
  const weightKg = user?.bodyweightKg ? num(user.bodyweightKg) : null;

  // Trust a device reading when given; otherwise estimate from steps or METs.
  let kcal = d.caloriesOut ?? 0;
  if (!kcal) {
    kcal =
      d.type === 'steps'
        ? stepsCalories(d.steps ?? 0, weightKg)
        : metCalories(cardioMet(d.activityId), weightKg, d.durationMin ?? 0);
  }

  // Steps are a running daily total, not an event — replace the day's row so
  // re-entering a higher count doesn't double-count the same walking.
  if (d.type === 'steps') {
    await db
      .delete(schema.activityLogs)
      .where(
        and(
          eq(schema.activityLogs.userId, userId),
          eq(schema.activityLogs.date, date),
          eq(schema.activityLogs.type, 'steps'),
        ),
      );
  }

  const [row] = await db
    .insert(schema.activityLogs)
    .values({
      userId,
      date,
      type: d.type,
      activityId: d.activityId ?? null,
      steps: d.steps ?? null,
      durationMin: d.durationMin?.toString() ?? null,
      distanceM: d.distanceM?.toString() ?? null,
      caloriesOut: Math.round(kcal).toString(),
      note: d.note ?? null,
    })
    .returning();

  return c.json({ id: row.id, date: row.date, caloriesOut: Math.round(num(row.caloriesOut)) }, 201);
});

// DELETE /activity/:id
activity.delete('/:id', async (c) => {
  const userId = await requireUserId(c);
  if (userId instanceof Response) return userId;
  const deleted = await c
    .get('db')
    .delete(schema.activityLogs)
    .where(and(eq(schema.activityLogs.id, c.req.param('id')), eq(schema.activityLogs.userId, userId)))
    .returning({ id: schema.activityLogs.id });
  if (!deleted.length) return c.json({ error: 'Entry not found' }, 404);
  return c.json({ deleted: true });
});
