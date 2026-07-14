import type { FastifyInstance } from 'fastify';
import { createDB } from '@forgefit/db';
import { schema } from '@forgefit/db';
import { eq, and } from 'drizzle-orm';
import { assignPlanSchema } from '@forgefit/shared';

export async function assignmentRoutes(app: FastifyInstance) {
  const dbUrl = app.dbUrl as string;
  const db = createDB(dbUrl);

  // For MVP, use a header-based userId (JWT middleware will replace this in prod)
  function getUserId(request: any): string {
    return (request.headers['x-user-id'] as string) || 'demo-user-id';
  }

  // POST /users/me/plan — assign active plan
  app.post('/', async (request, reply) => {
    const userId = getUserId(request);
    const parsed = assignPlanSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const { planId, startDate } = parsed.data;

    // Deactivate any existing active plan
    await db
      .update(schema.userPlanAssignments)
      .set({ status: 'completed' })
      .where(
        and(
          eq(schema.userPlanAssignments.userId, userId),
          eq(schema.userPlanAssignments.status, 'active'),
        ),
      );

    const [assignment] = await db
      .insert(schema.userPlanAssignments)
      .values({ userId, planId, startDate, currentWeek: 1, status: 'active' })
      .returning();

    return reply.status(201).send({
      id: assignment.id,
      planId: assignment.planId,
      startDate: assignment.startDate,
      currentWeek: assignment.currentWeek,
      status: assignment.status,
    });
  });

  // GET /plans/today — resolve today's session
  app.get('/today', async (request, reply) => {
    const userId = getUserId(request);
    const dateStr = (request.query as any).date || new Date().toISOString().split('T')[0];
    const today = new Date(dateStr);

    const [assignment] = await db
      .select()
      .from(schema.userPlanAssignments)
      .where(
        and(eq(schema.userPlanAssignments.userId, userId), eq(schema.userPlanAssignments.status, 'active')),
      )
      .limit(1);

    if (!assignment) {
      return { dayId: null, title: 'No active plan', estimatedMinutes: 0, isRestDay: true, blocks: [] };
    }

    // Get plan
    const [plan] = await db.select().from(schema.plans).where(eq(schema.plans.id, assignment.planId)).limit(1);
    if (!plan) return reply.status(404).send({ error: 'Plan not found' });

    // Compute day offset
    const startDate = new Date(assignment.startDate);
    const diffDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const absoluteDay = diffDays + 1;
    const weekNumber = Math.min(Math.ceil(absoluteDay / 7), plan.durationWeeks);

    // Find the week
    const [week] = await db
      .select()
      .from(schema.planWeeks)
      .where(
        and(eq(schema.planWeeks.planId, plan.id), eq(schema.planWeeks.weekNumber, weekNumber)),
      )
      .limit(1);

    if (!week) {
      return { dayId: null, title: 'Plan complete!', estimatedMinutes: 0, isRestDay: true, blocks: [] };
    }

    // Find the day
    const dayInWeek = ((absoluteDay - 1) % 7) + 1;
    const [day] = await db
      .select()
      .from(schema.planDays)
      .where(and(eq(schema.planDays.weekId, week.id), eq(schema.planDays.dayNumber, dayInWeek)))
      .limit(1);

    if (!day || day.isRestDay) {
      return {
        dayId: day?.id || null,
        title: day?.title || 'Rest Day',
        estimatedMinutes: 0,
        isRestDay: true,
        blocks: [],
      };
    }

    // Get blocks with exercises
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
          id: schema.blockExercises.id,
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

      // Rough estimate: (sets × (repsTime + restSec)) per exercise
      for (const be of blockExs) {
        totalMinutes += Math.ceil(((be.sets || 1) * (60 + (be.restSec || 60))) / 60);
      }

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
  });

  // GET /users/me/plan/progress — plan progress
  app.get('/progress', async (request, reply) => {
    const userId = getUserId(request);

    const [assignment] = await db
      .select()
      .from(schema.userPlanAssignments)
      .where(
        and(eq(schema.userPlanAssignments.userId, userId), eq(schema.userPlanAssignments.status, 'active')),
      )
      .limit(1);

    if (!assignment) {
      return { currentWeek: 0, totalWeeks: 0, percentComplete: 0, startDate: null, estimatedEndDate: null };
    }

    const [plan] = await db.select().from(schema.plans).where(eq(schema.plans.id, assignment.planId)).limit(1);
    if (!plan) return reply.status(404).send({ error: 'Plan not found' });

    const startDate = new Date(assignment.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationWeeks * 7);

    return {
      currentWeek: assignment.currentWeek,
      totalWeeks: plan.durationWeeks,
      percentComplete: Math.round((assignment.currentWeek / plan.durationWeeks) * 100),
      startDate: assignment.startDate,
      estimatedEndDate: endDate.toISOString().split('T')[0],
    };
  });
}
