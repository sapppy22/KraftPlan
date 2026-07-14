import type { FastifyInstance } from 'fastify';
import { createDB } from '@kraftplan/db';
import { schema } from '@kraftplan/db';
import { eq, and } from 'drizzle-orm';
import { setLogSchema } from '@kraftplan/shared';
import { randomUUID } from 'crypto';

export async function setRoutes(app: FastifyInstance) {
  const dbUrl = app.dbUrl as string;
  const db = createDB(dbUrl);

  function getUserId(request: any): string {
    return (request.headers['x-user-id'] as string) || 'demo-user-id';
  }

  // POST /workouts/:sessionId/sets — log a set
  app.post('/:sessionId/sets', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    const idempotencyKey = (request.headers['idempotency-key'] as string) || randomUUID();
    const userId = getUserId(request);

    // Verify session belongs to user and is active
    const [session] = await db
      .select()
      .from(schema.workoutSessions)
      .where(and(eq(schema.workoutSessions.id, sessionId), eq(schema.workoutSessions.userId, userId)))
      .limit(1);

    if (!session) return reply.status(404).send({ error: 'Session not found' });
    if (session.status !== 'active') return reply.status(409).send({ error: 'Session is not active' });

    const parsed = setLogSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const { exerciseId, setIndex, weightKg, reps, timeSec, distanceM, rpe, status } = parsed.data;

    // Upsert set (idempotent)
    await db
      .insert(schema.workoutSets)
      .values({
        sessionId,
        exerciseId,
        setIndex,
        weightKg: weightKg?.toString() || null,
        reps: reps || null,
        timeSec: timeSec?.toString() || null,
        distanceM: distanceM?.toString() || null,
        rpe: rpe?.toString() || null,
        status: status || 'completed',
        idempotencyKey,
      })
      .onConflictDoUpdate({
        target: [schema.workoutSets.sessionId, schema.workoutSets.exerciseId, schema.workoutSets.setIndex],
        set: {
          weightKg: weightKg?.toString() || null,
          reps: reps || null,
          rpe: rpe?.toString() || null,
          status: status || 'completed',
        },
      });

    // Check PR candidate (simple check — real PR logic in progress service)
    let prCandidate = false;
    if (weightKg && reps) {
      const [currentPr] = await db
        .select()
        .from(schema.personalRecords)
        .where(
          and(
            eq(schema.personalRecords.userId, userId),
            eq(schema.personalRecords.exerciseId, exerciseId),
            eq(schema.personalRecords.metric, 'max_weight'),
          ),
        )
        .limit(1);

      if (!currentPr || weightKg > parseFloat(currentPr.value.toString())) {
        prCandidate = true;
      }
    }

    return {
      saved: true,
      prCandidate,
      previousPr: null, // Full PR computation happens in progress service
    };
  });
}
