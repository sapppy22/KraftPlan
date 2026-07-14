import type { FastifyInstance } from 'fastify';
import { createDB } from '@kraftplan/db';
import { schema } from '@kraftplan/db';
import { eq, and, desc, sql, gte } from 'drizzle-orm';
import { epley1RM } from '@kraftplan/shared';

export async function progressRoutes(app: FastifyInstance) {
  const dbUrl = app.dbUrl as string;
  const db = createDB(dbUrl);

  function getUserId(request: any): string {
    return (request.headers['x-user-id'] as string) || 'demo-user-id';
  }

  // GET /progress/prs — current personal records
  app.get('/prs', async (request) => {
    const userId = getUserId(request);

    const prs = await db
      .select({
        id: schema.personalRecords.id,
        exerciseId: schema.personalRecords.exerciseId,
        metric: schema.personalRecords.metric,
        value: schema.personalRecords.value,
        achievedAt: schema.personalRecords.achievedAt,
        exerciseName: schema.exercises.name,
      })
      .from(schema.personalRecords)
      .leftJoin(schema.exercises, eq(schema.personalRecords.exerciseId, schema.exercises.id))
      .where(eq(schema.personalRecords.userId, userId))
      .orderBy(desc(schema.personalRecords.value));

    return prs.map((pr) => ({
      id: pr.id,
      exerciseId: pr.exerciseId,
      exerciseName: pr.exerciseName,
      metric: pr.metric,
      value: parseFloat(pr.value.toString()),
      previousValue: null,
      achievedAt: pr.achievedAt.toISOString(),
      deltaPct: null,
    }));
  });

  // GET /progress/prs/:exerciseId/history — PR trend
  app.get('/prs/:exerciseId/history', async (request) => {
    const userId = getUserId(request);
    const { exerciseId } = request.params as { exerciseId: string };
    const range = (request.query as any).range || '90d';
    const rangeDate = new Date();
    rangeDate.setDate(rangeDate.getDate() - (range === '30d' ? 30 : range === '1y' ? 365 : 90));

    // Query set history for e1RM trend
    const history = await db
      .select({
        weightKg: schema.workoutSets.weightKg,
        reps: schema.workoutSets.reps,
        loggedAt: schema.workoutSets.loggedAt,
      })
      .from(schema.workoutSets)
      .innerJoin(schema.workoutSessions, eq(schema.workoutSets.sessionId, schema.workoutSessions.id))
      .where(
        and(
          eq(schema.workoutSessions.userId, userId),
          eq(schema.workoutSets.exerciseId, exerciseId),
          eq(schema.workoutSets.status, 'completed'),
          sql`${schema.workoutSets.loggedAt} >= ${rangeDate.toISOString()}`,
          sql`${schema.workoutSets.weightKg} IS NOT NULL`,
          sql`${schema.workoutSets.reps} IS NOT NULL`,
        ),
      )
      .orderBy(schema.workoutSets.loggedAt);

    const dataPoints = [];
    for (const s of history) {
      if (s.weightKg && s.reps) {
        const e1rm = epley1RM(parseFloat(s.weightKg.toString()), s.reps);
        dataPoints.push({ value: Math.round(e1rm * 10) / 10, achievedAt: s.loggedAt.toISOString() });
      }
    }

    return dataPoints;
  });

  // GET /progress/volume — volume over time
  app.get('/volume', async (request) => {
    const userId = getUserId(request);
    const range = (request.query as any).range || '30d';
    const rangeDate = new Date();
    rangeDate.setDate(rangeDate.getDate() - (range === '30d' ? 30 : range === '1y' ? 365 : 90));

    // Aggregate volume by week
    const rows = await db.execute(
      sql`
        SELECT 
          date_trunc('week', ws.logged_at) as week,
          SUM(CAST(ws.weight_kg AS numeric) * ws.reps) as total_volume
        FROM workout_sets ws
        JOIN workout_sessions wss ON wss.id = ws.session_id
        WHERE wss.user_id = ${userId}
          AND ws.status = 'completed'
          AND ws.logged_at >= ${rangeDate.toISOString()}
          AND ws.weight_kg IS NOT NULL
          AND ws.reps IS NOT NULL
        GROUP BY date_trunc('week', ws.logged_at)
        ORDER BY week ASC
      `,
    );

    return rows.map((r: any) => ({
      week: r.week.toISOString().split('T')[0],
      volumeKg: parseFloat(r.total_volume?.toString() || '0'),
    }));
  });

  // GET /progress/adherence — session adherence
  app.get('/adherence', async (request) => {
    const userId = getUserId(request);
    const range = (request.query as any).range || '1y';
    const rangeDate = new Date();
    rangeDate.setDate(rangeDate.getDate() - (range === '30d' ? 30 : range === '1y' ? 365 : 90));

    const sessions = await db
      .select({
        createdAt: schema.workoutSessions.createdAt,
        status: schema.workoutSessions.status,
      })
      .from(schema.workoutSessions)
      .where(
        and(
          eq(schema.workoutSessions.userId, userId),
          gte(schema.workoutSessions.createdAt, rangeDate),
        ),
      )
      .orderBy(schema.workoutSessions.createdAt);

    return sessions.map((s) => ({
      date: s.createdAt.toISOString().split('T')[0],
      completed: s.status === 'completed',
    }));
  });

  // GET /progress/endurance — endurance trends
  app.get('/endurance', async (request) => {
    const userId = getUserId(request);
    const range = (request.query as any).range || '90d';
    const rangeDate = new Date();
    rangeDate.setDate(rangeDate.getDate() - (range === '30d' ? 30 : range === '1y' ? 365 : 90));

    const rows = await db
      .select({
        distanceM: schema.workoutSets.distanceM,
        timeSec: schema.workoutSets.timeSec,
        loggedAt: schema.workoutSets.loggedAt,
      })
      .from(schema.workoutSets)
      .innerJoin(schema.workoutSessions, eq(schema.workoutSets.sessionId, schema.workoutSessions.id))
      .where(
        and(
          eq(schema.workoutSessions.userId, userId),
          eq(schema.workoutSets.status, 'completed'),
          sql`${schema.workoutSets.distanceM} IS NOT NULL`,
          gte(schema.workoutSets.loggedAt, rangeDate),
        ),
      )
      .orderBy(schema.workoutSets.loggedAt);

    return rows.map((r) => ({
      date: r.loggedAt.toISOString().split('T')[0],
      distanceKm: r.distanceM ? parseFloat(r.distanceM.toString()) / 1000 : 0,
      durationSec: r.timeSec ? parseFloat(r.timeSec.toString()) : 0,
      pace: r.distanceM && r.timeSec ? `${Math.floor(parseFloat(r.timeSec.toString()) / (parseFloat(r.distanceM.toString()) / 1000) / 60)}:${String(Math.round(parseFloat(r.timeSec.toString()) / (parseFloat(r.distanceM.toString()) / 1000) % 60)).padStart(2, '0')} /km` : null,
    }));
  });
}
