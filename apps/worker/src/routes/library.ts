import { Hono } from 'hono';
import { eq, and, like, or, sql } from 'drizzle-orm';
import { exerciseSearchSchema } from '@kraftplan/shared';
import { schema } from '../db';
import type { AppEnv } from '../context';

export const library = new Hono<AppEnv>();

// GET /exercises — search & filter
library.get('/', async (c) => {
  const parsed = exerciseSearchSchema.safeParse(c.req.query());
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  const { q, muscle, equipment, category, difficulty, page, limit } = parsed.data;
  const db = c.get('db');

  const conditions = [];
  if (q) {
    conditions.push(
      or(
        sql`to_tsvector('english', ${schema.exercises.name}) @@ plainto_tsquery('english', ${q})`,
        like(schema.exercises.name, `%${q}%`),
      ),
    );
  }
  if (muscle) conditions.push(sql`${muscle} = ANY(${schema.exercises.primaryMuscles})`);
  if (equipment) conditions.push(sql`${equipment} = ANY(${schema.exercises.equipment})`);
  if (category) conditions.push(eq(schema.exercises.category, category));
  if (difficulty) conditions.push(eq(schema.exercises.difficulty, difficulty));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
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
      tutorialUrl: schema.exercises.tutorialUrl,
    })
    .from(schema.exercises)
    .where(where)
    .orderBy(schema.exercises.name)
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.exercises)
    .where(where);

  return c.json({ exercises, total: Number(countResult?.count || 0), page, limit });
});

// GET /exercises/:id — detail with alternatives
library.get('/:id', async (c) => {
  const id = c.req.param('id');
  const db = c.get('db');

  const [exercise] = await db.select().from(schema.exercises).where(eq(schema.exercises.id, id)).limit(1);
  if (!exercise) return c.json({ error: 'Exercise not found' }, 404);

  const altRows = await db
    .select({ alternativeId: schema.exerciseAlternatives.alternativeId })
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

  return c.json({
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
    alternatives,
  });
});
