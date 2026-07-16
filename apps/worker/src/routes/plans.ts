import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { assignPlanSchema } from '@kraftplan/shared';
import { schema, type DB } from '../db';
import type { AppEnv } from '../context';

// ── Shared: resolve the session scheduled for a given date ──
export async function resolveToday(db: DB, userId: string, dateStr: string) {
  const today = new Date(dateStr);
  const [assignment] = await db
    .select()
    .from(schema.userPlanAssignments)
    .where(and(eq(schema.userPlanAssignments.userId, userId), eq(schema.userPlanAssignments.status, 'active')))
    .limit(1);
  if (!assignment) return { dayId: null, title: 'No active plan', estimatedMinutes: 0, isRestDay: true, blocks: [] };

  const [plan] = await db.select().from(schema.plans).where(eq(schema.plans.id, assignment.planId)).limit(1);
  if (!plan) return { dayId: null, title: 'No active plan', estimatedMinutes: 0, isRestDay: true, blocks: [] };

  const startDate = new Date(assignment.startDate);
  const diffDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const absoluteDay = diffDays + 1;
  const weekNumber = Math.min(Math.ceil(absoluteDay / 7), plan.durationWeeks);

  const [week] = await db
    .select()
    .from(schema.planWeeks)
    .where(and(eq(schema.planWeeks.planId, plan.id), eq(schema.planWeeks.weekNumber, weekNumber)))
    .limit(1);
  if (!week) return { dayId: null, title: 'Plan complete!', estimatedMinutes: 0, isRestDay: true, blocks: [] };

  const dayInWeek = ((absoluteDay - 1) % 7) + 1;
  const [day] = await db
    .select()
    .from(schema.planDays)
    .where(and(eq(schema.planDays.weekId, week.id), eq(schema.planDays.dayNumber, dayInWeek)))
    .limit(1);
  if (!day || day.isRestDay) {
    return { dayId: day?.id || null, title: day?.title || 'Rest Day', estimatedMinutes: 0, isRestDay: true, blocks: [] };
  }

  const blocks = await db
    .select()
    .from(schema.planBlocks)
    .where(eq(schema.planBlocks.dayId, day.id))
    .orderBy(schema.planBlocks.sortOrder);

  const blocksWithExs = [];
  let totalMinutes = 0;
  for (const block of blocks) {
    const blockExs = await db
      .select({
        exerciseId: schema.blockExercises.exerciseId,
        sets: schema.blockExercises.sets,
        repsScheme: schema.blockExercises.repsScheme,
        loadScheme: schema.blockExercises.loadScheme,
        targetLoad: schema.blockExercises.targetLoad,
        restSec: schema.blockExercises.restSec,
        tempo: schema.blockExercises.tempo,
        exerciseName: schema.exercises.name,
        primaryMuscles: schema.exercises.primaryMuscles,
        category: schema.exercises.category,
        tutorialUrl: schema.exercises.tutorialUrl,
        instructions: schema.exercises.instructions,
        cues: schema.exercises.cues,
        mistakes: schema.exercises.mistakes,
      })
      .from(schema.blockExercises)
      .leftJoin(schema.exercises, eq(schema.blockExercises.exerciseId, schema.exercises.id))
      .where(eq(schema.blockExercises.blockId, block.id))
      .orderBy(schema.blockExercises.sortOrder);

    for (const be of blockExs) totalMinutes += Math.ceil(((be.sets || 1) * (60 + (be.restSec || 60))) / 60);

    blocksWithExs.push({
      id: block.id,
      blockType: block.blockType,
      exercises: blockExs.map((be) => ({
        exerciseId: be.exerciseId,
        name: be.exerciseName,
        primaryMuscles: be.primaryMuscles,
        category: be.category,
        sets: be.sets,
        repsScheme: be.repsScheme,
        loadScheme: be.loadScheme,
        targetLoad: be.targetLoad,
        restSec: be.restSec,
        tempo: be.tempo,
        tutorialUrl: be.tutorialUrl,
        instructions: be.instructions,
        cues: be.cues,
        mistakes: be.mistakes,
      })),
    });
  }

  return {
    dayId: day.id,
    title: day.title || `${plan.title} — Day ${day.dayNumber}`,
    estimatedMinutes: totalMinutes,
    isRestDay: false,
    blocks: blocksWithExs,
  };
}

// ── /plans ──
export const plans = new Hono<AppEnv>();

plans.get('/today', async (c) => {
  const date = c.req.query('date') || new Date().toISOString().split('T')[0];
  return c.json(await resolveToday(c.get('db'), c.get('userId'), date));
});

plans.get('/', async (c) => {
  const q = c.req.query();
  const db = c.get('db');
  const conditions = [];
  if (q.category) conditions.push(eq(schema.plans.category, q.category));
  if (q.difficulty) conditions.push(eq(schema.plans.difficulty, q.difficulty));
  const rows = await db
    .select()
    .from(schema.plans)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(schema.plans.title);
  return c.json(
    rows.map((p) => ({
      id: p.id,
      category: p.category,
      title: p.title,
      description: p.description,
      durationWeeks: p.durationWeeks,
      daysPerWeek: p.daysPerWeek,
      difficulty: p.difficulty,
      equipment: p.equipment,
      coverImage: p.coverImage,
      createdAt: p.createdAt.toISOString(),
    })),
  );
});

plans.get('/:id', async (c) => {
  const id = c.req.param('id');
  const db = c.get('db');
  const [plan] = await db.select().from(schema.plans).where(eq(schema.plans.id, id)).limit(1);
  if (!plan) return c.json({ error: 'Plan not found' }, 404);

  const weeks = await db
    .select()
    .from(schema.planWeeks)
    .where(eq(schema.planWeeks.planId, id))
    .orderBy(schema.planWeeks.weekNumber);

  const weeksWithDays = [];
  for (const week of weeks) {
    const days = await db
      .select()
      .from(schema.planDays)
      .where(eq(schema.planDays.weekId, week.id))
      .orderBy(schema.planDays.dayNumber);
    const daysWithBlocks = [];
    for (const day of days) {
      const dayBlocks = await db
        .select()
        .from(schema.planBlocks)
        .where(eq(schema.planBlocks.dayId, day.id))
        .orderBy(schema.planBlocks.sortOrder);
      const blocksWithExercises = [];
      for (const block of dayBlocks) {
        const blockExs = await db
          .select({
            id: schema.blockExercises.id,
            exerciseId: schema.blockExercises.exerciseId,
            sortOrder: schema.blockExercises.sortOrder,
            sets: schema.blockExercises.sets,
            repsScheme: schema.blockExercises.repsScheme,
            loadScheme: schema.blockExercises.loadScheme,
            targetLoad: schema.blockExercises.targetLoad,
            restSec: schema.blockExercises.restSec,
            tempo: schema.blockExercises.tempo,
            notes: schema.blockExercises.notes,
            exerciseName: schema.exercises.name,
          })
          .from(schema.blockExercises)
          .leftJoin(schema.exercises, eq(schema.blockExercises.exerciseId, schema.exercises.id))
          .where(eq(schema.blockExercises.blockId, block.id))
          .orderBy(schema.blockExercises.sortOrder);
        blocksWithExercises.push({ id: block.id, blockType: block.blockType, sortOrder: block.sortOrder, exercises: blockExs });
      }
      daysWithBlocks.push({ id: day.id, dayNumber: day.dayNumber, title: day.title, isRestDay: day.isRestDay, blocks: blocksWithExercises });
    }
    weeksWithDays.push({ id: week.id, weekNumber: week.weekNumber, days: daysWithBlocks });
  }

  return c.json({
    id: plan.id,
    category: plan.category,
    title: plan.title,
    description: plan.description,
    durationWeeks: plan.durationWeeks,
    daysPerWeek: plan.daysPerWeek,
    difficulty: plan.difficulty,
    equipment: plan.equipment,
    coverImage: plan.coverImage,
    createdAt: plan.createdAt.toISOString(),
    weeks: weeksWithDays,
  });
});

// POST /plans/custom — create a user-built plan
plans.post('/custom', async (c) => {
  const userId = c.get('userId');
  const db = c.get('db');
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Invalid body' }, 400);

  const { title, category, difficulty, daysPerWeek, days } = body;
  if (!title || !category || !daysPerWeek || !days?.length) {
    return c.json({ error: 'title, category, daysPerWeek and days are required' }, 400);
  }

  // Create the plan
  const [plan] = await db
    .insert(schema.plans)
    .values({
      category: category || 'strength',
      title,
      description: body.description || `Custom plan created by user`,
      durationWeeks: 1,
      daysPerWeek: parseInt(daysPerWeek),
      difficulty: difficulty || 'intermediate',
      equipment: [],
    })
    .returning();

  // Create week 1
  const [week] = await db
    .insert(schema.planWeeks)
    .values({ planId: plan.id, weekNumber: 1 })
    .returning();

  // Create days with blocks & exercises
  for (let i = 0; i < days.length; i++) {
    const dayData = days[i];
    const [day] = await db
      .insert(schema.planDays)
      .values({
        weekId: week.id,
        dayNumber: i + 1,
        title: dayData.title || `Day ${i + 1}`,
        isRestDay: false,
      })
      .returning();

    if (dayData.exercises?.length) {
      const [block] = await db
        .insert(schema.planBlocks)
        .values({ dayId: day.id, blockType: 'main', sortOrder: 0 })
        .returning();

      for (let j = 0; j < dayData.exercises.length; j++) {
        const ex = dayData.exercises[j];
        await db.insert(schema.blockExercises).values({
          blockId: block.id,
          exerciseId: ex.exerciseId,
          sortOrder: j,
          sets: ex.sets || 3,
          repsScheme: ex.repsScheme || '8-12',
          loadScheme: 'rpe',
          targetLoad: ex.targetLoad || null,
          restSec: ex.restSec || 60,
        });
      }
    }
  }

  // Auto-assign to user
  await db
    .update(schema.userPlanAssignments)
    .set({ status: 'completed' })
    .where(and(eq(schema.userPlanAssignments.userId, userId), eq(schema.userPlanAssignments.status, 'active')));

  await db.insert(schema.userPlanAssignments).values({
    userId,
    planId: plan.id,
    startDate: new Date().toISOString().split('T')[0],
    currentWeek: 1,
    status: 'active',
  });

  return c.json({ id: plan.id, title: plan.title, message: 'Custom plan created and assigned' }, 201);
});

// ── /users/me/plan ──
export const userPlan = new Hono<AppEnv>();

userPlan.post('/', async (c) => {
  const userId = c.get('userId');
  const parsed = assignPlanSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  const { planId, startDate } = parsed.data;
  const db = c.get('db');

  await db
    .update(schema.userPlanAssignments)
    .set({ status: 'completed' })
    .where(and(eq(schema.userPlanAssignments.userId, userId), eq(schema.userPlanAssignments.status, 'active')));

  const [assignment] = await db
    .insert(schema.userPlanAssignments)
    .values({ userId, planId, startDate, currentWeek: 1, status: 'active' })
    .returning();

  return c.json(
    { id: assignment.id, planId: assignment.planId, startDate: assignment.startDate, currentWeek: assignment.currentWeek, status: assignment.status },
    201,
  );
});

userPlan.get('/today', async (c) => {
  const date = c.req.query('date') || new Date().toISOString().split('T')[0];
  return c.json(await resolveToday(c.get('db'), c.get('userId'), date));
});

userPlan.get('/progress', async (c) => {
  const userId = c.get('userId');
  const db = c.get('db');
  const [assignment] = await db
    .select()
    .from(schema.userPlanAssignments)
    .where(and(eq(schema.userPlanAssignments.userId, userId), eq(schema.userPlanAssignments.status, 'active')))
    .limit(1);
  if (!assignment) return c.json({ currentWeek: 0, totalWeeks: 0, percentComplete: 0, startDate: null, estimatedEndDate: null });

  const [plan] = await db.select().from(schema.plans).where(eq(schema.plans.id, assignment.planId)).limit(1);
  if (!plan) return c.json({ error: 'Plan not found' }, 404);

  const endDate = new Date(assignment.startDate);
  endDate.setDate(endDate.getDate() + plan.durationWeeks * 7);
  return c.json({
    currentWeek: assignment.currentWeek,
    totalWeeks: plan.durationWeeks,
    percentComplete: Math.round((assignment.currentWeek / plan.durationWeeks) * 100),
    startDate: assignment.startDate,
    estimatedEndDate: endDate.toISOString().split('T')[0],
  });
});
