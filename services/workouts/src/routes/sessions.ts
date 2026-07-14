import type { FastifyInstance } from 'fastify';
import { createDB } from '@forgefit/db';
import { schema } from '@forgefit/db';
import { eq, and } from 'drizzle-orm';
import { createSessionSchema, sessionCompleteSchema } from '@forgefit/shared';

export async function sessionRoutes(app: FastifyInstance) {
  const dbUrl = app.dbUrl as string;
  const db = createDB(dbUrl);

  function getUserId(request: any): string {
    return (request.headers['x-user-id'] as string) || 'demo-user-id';
  }

  // POST /workouts — start a new session
  app.post('/', async (request, reply) => {
    const userId = getUserId(request);
    const parsed = createSessionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const [session] = await db
      .insert(schema.workoutSessions)
      .values({
        userId,
        planDayId: parsed.data.planDayId,
        status: 'active',
        startedAt: new Date(),
      })
      .returning();

    return reply.status(201).send({
      id: session.id,
      planDayId: session.planDayId,
      status: session.status,
      startedAt: session.startedAt.toISOString(),
    });
  });

  // GET /workouts/:sessionId — get session state
  app.get('/:sessionId', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    const userId = getUserId(request);

    const [session] = await db
      .select()
      .from(schema.workoutSessions)
      .where(and(eq(schema.workoutSessions.id, sessionId), eq(schema.workoutSessions.userId, userId)))
      .limit(1);

    if (!session) return reply.status(404).send({ error: 'Session not found' });

    const sets = await db
      .select()
      .from(schema.workoutSets)
      .where(eq(schema.workoutSets.sessionId, sessionId))
      .orderBy(schema.workoutSets.setIndex);

    return {
      id: session.id,
      planDayId: session.planDayId,
      status: session.status,
      startedAt: session.startedAt.toISOString(),
      endedAt: session.endedAt?.toISOString() || null,
      totalVolumeKg: session.totalVolumeKg ? parseFloat(session.totalVolumeKg.toString()) : null,
      sets: sets.map((s) => ({
        exerciseId: s.exerciseId,
        setIndex: s.setIndex,
        weightKg: s.weightKg ? parseFloat(s.weightKg.toString()) : null,
        reps: s.reps,
        timeSec: s.timeSec ? parseFloat(s.timeSec.toString()) : null,
        distanceM: s.distanceM ? parseFloat(s.distanceM.toString()) : null,
        rpe: s.rpe ? parseFloat(s.rpe.toString()) : null,
        status: s.status,
      })),
    };
  });

  // POST /workouts/:sessionId/complete — finish a session
  app.post('/:sessionId/complete', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    const userId = getUserId(request);
    const parsed = sessionCompleteSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const [session] = await db
      .select()
      .from(schema.workoutSessions)
      .where(and(eq(schema.workoutSessions.id, sessionId), eq(schema.workoutSessions.userId, userId)))
      .limit(1);

    if (!session) return reply.status(404).send({ error: 'Session not found' });
    if (session.status === 'completed') return reply.status(409).send({ error: 'Session already completed' });

    // Get all sets for this session
    const sets = await db
      .select()
      .from(schema.workoutSets)
      .where(eq(schema.workoutSets.sessionId, sessionId));

    // Calculate totals
    let totalVolumeKg = 0;
    let setsCompleted = 0;
    const exerciseIds = new Set<string>();
    for (const s of sets) {
      exerciseIds.add(s.exerciseId);
      if (s.status === 'completed') setsCompleted++;
      if (s.weightKg && s.reps) {
        totalVolumeKg += parseFloat(s.weightKg.toString()) * s.reps;
      }
    }

    const now = new Date();
    await db
      .update(schema.workoutSessions)
      .set({
        status: 'completed',
        endedAt: now,
        totalVolumeKg: totalVolumeKg.toString(),
        notes: parsed.data.notes || null,
      })
      .where(eq(schema.workoutSessions.id, sessionId));

    // Publish to event outbox
    await db.insert(schema.eventOutbox).values({
      eventType: 'workout.completed',
      payload: {
        userId,
        sessionId,
        exerciseIds: Array.from(exerciseIds),
        endedAt: now.toISOString(),
      },
    });

    return {
      sessionId,
      totalVolumeKg,
      setsCompleted,
      exercisesCompleted: exerciseIds.size,
      durationSec: parsed.data.totalElapsedSec,
    };
  });
}
