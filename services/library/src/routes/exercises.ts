import type { FastifyInstance } from 'fastify';
import { createDB } from '@forgefit/db';
import { schema } from '@forgefit/db';
import { eq, and, like, or, sql } from 'drizzle-orm';
import { exerciseSearchSchema } from '@forgefit/shared';

export async function exerciseRoutes(app: FastifyInstance) {
  const dbUrl = app.dbUrl as string;
  const db = createDB(dbUrl);

  // GET /exercises — search and filter
  app.get('/', async (request, reply) => {
    const parsed = exerciseSearchSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const { q, muscle, equipment, category, difficulty, page, limit } = parsed.data;
    const conditions = [];

    if (q) {
      conditions.push(
        or(
          sql`to_tsvector('english', ${schema.exercises.name}) @@ plainto_tsquery('english', ${q})`,
          like(schema.exercises.name, `%${q}%`),
        ),
      );
    }
    if (muscle) {
      conditions.push(sql`${muscle} = ANY(${schema.exercises.primaryMuscles})`);
    }
    if (equipment) {
      conditions.push(sql`${equipment} = ANY(${schema.exercises.equipment})`);
    }
    if (category) conditions.push(eq(schema.exercises.category, category));
    if (difficulty) conditions.push(eq(schema.exercises.difficulty, difficulty));

    const offset = (page - 1) * limit;

    const exercises = await db
      .select({
        id: schema.exercises.id,
        name: schema.exercises.name,
        primaryMuscles: schema.exercises.primaryMuscles,
        equipment: schema.exercises.equipment,
        difficulty: schema.exercises.difficulty,
        thumbnailUrl: schema.exercises.thumbnailUrl,
        category: schema.exercises.category,
      })
      .from(schema.exercises)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(schema.exercises.name)
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.exercises)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return {
      exercises: exercises.map((e) => ({
        id: e.id,
        name: e.name,
        primaryMuscles: e.primaryMuscles,
        equipment: e.equipment,
        difficulty: e.difficulty,
        thumbnailUrl: e.thumbnailUrl,
        category: e.category,
      })),
      total: Number(countResult?.count || 0),
      page,
      limit,
    };
  });

  // GET /exercises/:id — full detail with alternatives
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const [exercise] = await db.select().from(schema.exercises).where(eq(schema.exercises.id, id)).limit(1);
    if (!exercise) return reply.status(404).send({ error: 'Exercise not found' });

    // Get alternatives
    const altRows = await db
      .select({
        alternativeId: schema.exerciseAlternatives.alternativeId,
      })
      .from(schema.exerciseAlternatives)
      .where(eq(schema.exerciseAlternatives.exerciseId, id));

    const alternatives = [];
    for (const row of altRows) {
      const [alt] = await db
        .select({
          id: schema.exercises.id,
          name: schema.exercises.name,
          primaryMuscles: schema.exercises.primaryMuscles,
          equipment: schema.exercises.equipment,
          difficulty: schema.exercises.difficulty,
          thumbnailUrl: schema.exercises.thumbnailUrl,
        })
        .from(schema.exercises)
        .where(eq(schema.exercises.id, row.alternativeId))
        .limit(1);
      if (alt) alternatives.push(alt);
    }

    return {
      id: exercise.id,
      name: exercise.name,
      category: exercise.category,
      primaryMuscles: exercise.primaryMuscles,
      secondaryMuscles: exercise.secondaryMuscles,
      equipment: exercise.equipment,
      difficulty: exercise.difficulty,
      tutorialUrl: exercise.tutorialUrl,
      thumbnailUrl: exercise.thumbnailUrl,
      instructions: exercise.instructions,
      cues: exercise.cues,
      mistakes: exercise.mistakes,
      alternatives: alternatives.map((a) => ({
        id: a.id,
        name: a.name,
        primaryMuscles: a.primaryMuscles,
        equipment: a.equipment,
        difficulty: a.difficulty,
        thumbnailUrl: a.thumbnailUrl,
      })),
    };
  });
}
