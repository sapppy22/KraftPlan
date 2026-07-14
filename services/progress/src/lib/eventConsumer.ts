import { createDB } from '@forgefit/db';
import { schema } from '@forgefit/db';
import { eq, and } from 'drizzle-orm';
import { epley1RM } from '@forgefit/shared';
import type { WorkoutCompletedEvent, PRBrokenEvent } from '@forgefit/shared';

/**
 * Process a workout.completed event:
 * 1. For each exercise in the session, find best set
 * 2. Compare to current PR
 * 3. Update if beaten
 */
export async function processWorkoutCompleted(
  event: WorkoutCompletedEvent,
  dbUrl: string,
): Promise<void> {
  const db = createDB(dbUrl);
  const { userId, sessionId, exerciseIds } = event;

  for (const exerciseId of exerciseIds) {
    // Get all completed sets for this exercise across all user sessions
    const bestSet = await db.execute(
      `
        SELECT 
          ws.weight_kg, ws.reps, ws.logged_at, ws.session_id
        FROM workout_sets ws
        JOIN workout_sessions wss ON wss.id = ws.session_id
        WHERE wss.user_id = $1
          AND ws.exercise_id = $2
          AND ws.status = 'completed'
          AND ws.weight_kg IS NOT NULL
          AND ws.reps IS NOT NULL
        ORDER BY CAST(ws.weight_kg AS numeric) * (1 + ws.reps::numeric / 30) DESC
        LIMIT 1
      `,
      [userId, exerciseId],
    );

    if (!(bestSet as any[]).length) continue;
    const best = (bestSet as any[])[0];
    const bestE1RM = epley1RM(parseFloat(best.weight_kg), best.reps);
    const bestWeight = parseFloat(best.weight_kg);

    // Update or insert PR for e1rm
    await db
      .insert(schema.personalRecords)
      .values({
        userId,
        exerciseId,
        metric: 'e1rm',
        value: bestE1RM.toString(),
        achievedAt: best.logged_at,
        setId: best.session_id,
      })
      .onConflictDoUpdate({
        target: [schema.personalRecords.userId, schema.personalRecords.exerciseId, schema.personalRecords.metric],
        set: {
          value: bestE1RM.toString(),
          achievedAt: best.logged_at,
          setId: best.session_id,
        },
        where: sql`CAST(${bestE1RM.toString()} AS numeric) > ${schema.personalRecords.value}`,
      });

    // Update or insert PR for max_weight
    await db
      .insert(schema.personalRecords)
      .values({
        userId,
        exerciseId,
        metric: 'max_weight',
        value: bestWeight.toString(),
        achievedAt: best.logged_at,
        setId: best.session_id,
      })
      .onConflictDoUpdate({
        target: [schema.personalRecords.userId, schema.personalRecords.exerciseId, schema.personalRecords.metric],
        set: {
          value: bestWeight.toString(),
          achievedAt: best.logged_at,
          setId: best.session_id,
        },
        where: sql`CAST(${bestWeight.toString()} AS numeric) > ${schema.personalRecords.value}`,
      });
  }

  // Mark event as processed
  await db
    .update(schema.eventOutbox)
    .set({ status: 'processed' })
    .where(
      and(
        eq(schema.eventOutbox.eventType, 'workout.completed'),
        sql`payload->>'sessionId' = ${sessionId}`,
      ),
    );
}
