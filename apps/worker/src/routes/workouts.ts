import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { createSessionSchema, setLogSchema, sessionCompleteSchema } from '@kraftplan/shared';
import { schema } from '../db';
import type { AppEnv } from '../context';

export const workouts = new Hono<AppEnv>();

// POST /workouts — start a session
workouts.post('/', async (c) => {
  const userId = c.get('userId');
  const parsed = createSessionSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  const db = c.get('db');

  const [session] = await db
    .insert(schema.workoutSessions)
    .values({ userId, planDayId: parsed.data.planDayId, status: 'active', startedAt: new Date() })
    .returning();

  return c.json({ id: session.id, planDayId: session.planDayId, status: session.status, startedAt: session.startedAt.toISOString() }, 201);
});

// GET /workouts/:sessionId
workouts.get('/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId');
  const userId = c.get('userId');
  const db = c.get('db');

  const [session] = await db
    .select()
    .from(schema.workoutSessions)
    .where(and(eq(schema.workoutSessions.id, sessionId), eq(schema.workoutSessions.userId, userId)))
    .limit(1);
  if (!session) return c.json({ error: 'Session not found' }, 404);

  const sets = await db
    .select()
    .from(schema.workoutSets)
    .where(eq(schema.workoutSets.sessionId, sessionId))
    .orderBy(schema.workoutSets.setIndex);

  return c.json({
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
  });
});

// POST /workouts/:sessionId/sets — log a set (idempotent upsert)
workouts.post('/:sessionId/sets', async (c) => {
  const sessionId = c.req.param('sessionId');
  const userId = c.get('userId');
  const idempotencyKey = c.req.header('idempotency-key') || crypto.randomUUID();
  const db = c.get('db');

  const [session] = await db
    .select()
    .from(schema.workoutSessions)
    .where(and(eq(schema.workoutSessions.id, sessionId), eq(schema.workoutSessions.userId, userId)))
    .limit(1);
  if (!session) return c.json({ error: 'Session not found' }, 404);
  if (session.status !== 'active') return c.json({ error: 'Session is not active' }, 409);

  const parsed = setLogSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  const { exerciseId, setIndex, weightKg, reps, timeSec, distanceM, rpe, status } = parsed.data;

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
      set: { weightKg: weightKg?.toString() || null, reps: reps || null, rpe: rpe?.toString() || null, status: status || 'completed' },
    });

  // Lightweight PR flag (full PR computed on session complete)
  let prCandidate = false;
  if (weightKg && reps) {
    const [pr] = await db
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
    if (!pr || weightKg > parseFloat(pr.value.toString())) prCandidate = true;
  }

  return c.json({ saved: true, prCandidate, previousPr: null });
});

// POST /workouts/:sessionId/complete
workouts.post('/:sessionId/complete', async (c) => {
  const sessionId = c.req.param('sessionId');
  const userId = c.get('userId');
  const parsed = sessionCompleteSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  const db = c.get('db');

  const [session] = await db
    .select()
    .from(schema.workoutSessions)
    .where(and(eq(schema.workoutSessions.id, sessionId), eq(schema.workoutSessions.userId, userId)))
    .limit(1);
  if (!session) return c.json({ error: 'Session not found' }, 404);
  if (session.status === 'completed') return c.json({ error: 'Session already completed' }, 409);

  const sets = await db.select().from(schema.workoutSets).where(eq(schema.workoutSets.sessionId, sessionId));

  let totalVolumeKg = 0;
  let setsCompleted = 0;
  const exerciseIds = new Set<string>();
  for (const s of sets) {
    exerciseIds.add(s.exerciseId);
    if (s.status === 'completed') setsCompleted++;
    if (s.weightKg && s.reps) totalVolumeKg += parseFloat(s.weightKg.toString()) * s.reps;
  }

  const now = new Date();
  await db
    .update(schema.workoutSessions)
    .set({ status: 'completed', endedAt: now, totalVolumeKg: totalVolumeKg.toString(), notes: parsed.data.notes || null })
    .where(eq(schema.workoutSessions.id, sessionId));

  // Compute PRs inline (e1RM per exercise) — the Node service did this via an
  // event consumer; on Workers we do it synchronously so PRs update immediately.
  await updatePRs(db, userId, Array.from(exerciseIds));

  await db.insert(schema.eventOutbox).values({
    eventType: 'workout.completed',
    payload: { userId, sessionId, exerciseIds: Array.from(exerciseIds), endedAt: now.toISOString() },
  });

  return c.json({ sessionId, totalVolumeKg, setsCompleted, exercisesCompleted: exerciseIds.size, durationSec: parsed.data.totalElapsedSec });
});

// Recompute the best e1RM PR for each exercise the user just trained.
async function updatePRs(db: AppEnv['Variables']['db'], userId: string, exerciseIds: string[]) {
  const { epley1RM } = await import('@kraftplan/shared');
  for (const exerciseId of exerciseIds) {
    const rows = await db
      .select({ weightKg: schema.workoutSets.weightKg, reps: schema.workoutSets.reps })
      .from(schema.workoutSets)
      .innerJoin(schema.workoutSessions, eq(schema.workoutSets.sessionId, schema.workoutSessions.id))
      .where(
        and(
          eq(schema.workoutSessions.userId, userId),
          eq(schema.workoutSets.exerciseId, exerciseId),
          eq(schema.workoutSets.status, 'completed'),
        ),
      );
    let best = 0;
    for (const r of rows) {
      if (r.weightKg && r.reps) best = Math.max(best, epley1RM(parseFloat(r.weightKg.toString()), r.reps));
    }
    if (best <= 0) continue;
    const value = (Math.round(best * 10) / 10).toString();
    await db
      .insert(schema.personalRecords)
      .values({ userId, exerciseId, metric: 'e1rm', value, achievedAt: new Date() })
      .onConflictDoUpdate({
        target: [schema.personalRecords.userId, schema.personalRecords.exerciseId, schema.personalRecords.metric],
        set: { value, achievedAt: new Date() },
      });
  }
}
