import type { FastifyInstance } from 'fastify';
import { createDB } from '@kraftplan/db';
import { schema } from '@kraftplan/db';
import { eq, and, inArray, like, sql } from 'drizzle-orm';

export async function planRoutes(app: FastifyInstance) {
  const dbUrl = app.dbUrl as string;
  const db = createDB(dbUrl);

  // GET /plans — catalog with filters
  app.get('/', async (request, reply) => {
    const query = request.query as Record<string, string>;
    const conditions = [];

    if (query.category) conditions.push(eq(schema.plans.category, query.category));
    if (query.difficulty) conditions.push(eq(schema.plans.difficulty, query.difficulty));
    if (query.maxWeeks) conditions.push(sql`${schema.plans.durationWeeks} <= ${parseInt(query.maxWeeks)}`);
    if (query.minDaysPerWeek) {
      conditions.push(sql`${schema.plans.daysPerWeek} >= ${parseInt(query.minDaysPerWeek)}`);
    }

    const plans = await db
      .select()
      .from(schema.plans)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(schema.plans.title);

    return plans.map((p) => ({
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
    }));
  });

  // GET /plans/:id — full detail with weeks/days/blocks/exercises
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const [plan] = await db.select().from(schema.plans).where(eq(schema.plans.id, id)).limit(1);
    if (!plan) return reply.status(404).send({ error: 'Plan not found' });

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
        const blocks = await db
          .select()
          .from(schema.planBlocks)
          .where(eq(schema.planBlocks.dayId, day.id))
          .orderBy(schema.planBlocks.sortOrder);

        const blocksWithExercises = [];
        for (const block of blocks) {
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
              primaryMuscles: schema.exercises.primaryMuscles,
              category: schema.exercises.category,
            })
            .from(schema.blockExercises)
            .leftJoin(schema.exercises, eq(schema.blockExercises.exerciseId, schema.exercises.id))
            .where(eq(schema.blockExercises.blockId, block.id))
            .orderBy(schema.blockExercises.sortOrder);

          blocksWithExercises.push({
            id: block.id,
            blockType: block.blockType,
            sortOrder: block.sortOrder,
            exercises: blockExs.map((be) => ({
              id: be.id,
              exerciseId: be.exerciseId,
              sortOrder: be.sortOrder,
              sets: be.sets,
              repsScheme: be.repsScheme,
              loadScheme: be.loadScheme,
              targetLoad: be.targetLoad,
              restSec: be.restSec,
              tempo: be.tempo,
              notes: be.notes,
              exerciseName: be.exerciseName,
            })),
          });
        }

        daysWithBlocks.push({
          id: day.id,
          dayNumber: day.dayNumber,
          title: day.title,
          isRestDay: day.isRestDay,
          blocks: blocksWithExercises,
        });
      }

      weeksWithDays.push({
        id: week.id,
        weekNumber: week.weekNumber,
        days: daysWithBlocks,
      });
    }

    return {
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
    };
  });
}
