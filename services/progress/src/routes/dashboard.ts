import type { FastifyInstance } from 'fastify';
import { createDB } from '@kraftplan/db';
import { schema } from '@kraftplan/db';
import { eq, and, desc, sql, gte } from 'drizzle-orm';

export async function dashboardRoutes(app: FastifyInstance) {
  const dbUrl = app.dbUrl as string;
  const db = createDB(dbUrl);

  function getUserId(request: any): string {
    return (request.headers['x-user-id'] as string) || 'demo-user-id';
  }

  // GET /dashboard — aggregated dashboard payload
  app.get('/', async (request) => {
    const userId = getUserId(request);

    // 1. Get active plan + today's session
    const [assignment] = await db
      .select()
      .from(schema.userPlanAssignments)
      .where(
        and(eq(schema.userPlanAssignments.userId, userId), eq(schema.userPlanAssignments.status, 'active')),
      )
      .limit(1);

    let programProgress = null;
    let today = null;

    if (assignment) {
      const [plan] = await db.select().from(schema.plans).where(eq(schema.plans.id, assignment.planId)).limit(1);
      if (plan) {
        programProgress = {
          currentWeek: assignment.currentWeek,
          totalWeeks: plan.durationWeeks,
          percent: Math.round((assignment.currentWeek / plan.durationWeeks) * 100),
        };
      }
    }

    // 2. Get this week's sessions
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekSessions = await db
      .select()
      .from(schema.workoutSessions)
      .where(
        and(eq(schema.workoutSessions.userId, userId), gte(schema.workoutSessions.createdAt, weekStart)),
      );

    const thisWeekCompleted = weekSessions.filter((s) => s.status === 'completed').length;

    // 3. Get volume for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const volumeRow = await db.execute(
      sql`
        SELECT COALESCE(SUM(CAST(ws.weight_kg AS numeric) * ws.reps), 0) as total_volume
        FROM workout_sets ws
        JOIN workout_sessions wss ON wss.id = ws.session_id
        WHERE wss.user_id = ${userId}
          AND ws.status = 'completed'
          AND ws.logged_at >= ${thirtyDaysAgo.toISOString()}
          AND ws.weight_kg IS NOT NULL
          AND ws.reps IS NOT NULL
      `,
    );
    const volume30d = parseFloat((volumeRow as any[])[0]?.total_volume?.toString() || '0');

    // 4. Get streak (simplified — count consecutive days with completed sessions)
    const recentSessions = await db
      .select({ createdAt: schema.workoutSessions.createdAt, status: schema.workoutSessions.status })
      .from(schema.workoutSessions)
      .where(eq(schema.workoutSessions.userId, userId))
      .orderBy(desc(schema.workoutSessions.createdAt))
      .limit(30);

    let streak = 0;
    const seenDates = new Set<string>();
    for (const session of recentSessions) {
      if (session.status !== 'completed') break;
      const dateStr = session.createdAt.toISOString().split('T')[0];
      if (seenDates.has(dateStr)) continue;
      seenDates.add(dateStr);
      streak++;
    }

    // 5. Get PRs
    const prs = await db
      .select({
        exerciseId: schema.personalRecords.exerciseId,
        metric: schema.personalRecords.metric,
        value: schema.personalRecords.value,
        achievedAt: schema.personalRecords.achievedAt,
        exerciseName: schema.exercises.name,
      })
      .from(schema.personalRecords)
      .leftJoin(schema.exercises, eq(schema.personalRecords.exerciseId, schema.exercises.id))
      .where(eq(schema.personalRecords.userId, userId))
      .orderBy(desc(schema.personalRecords.value))
      .limit(5);

    // 6. Get recent sessions
    const last3Sessions = await db
      .select({
        id: schema.workoutSessions.id,
        createdAt: schema.workoutSessions.createdAt,
        totalVolumeKg: schema.workoutSessions.totalVolumeKg,
        status: schema.workoutSessions.status,
      })
      .from(schema.workoutSessions)
      .where(eq(schema.workoutSessions.userId, userId))
      .orderBy(desc(schema.workoutSessions.createdAt))
      .limit(3);

    return {
      today,
      streak,
      thisWeek: { completed: thisWeekCompleted, scheduled: assignment ? (programProgress?.totalWeeks || 8) * 7 : 0 },
      volume30d,
      programProgress,
      prs: prs.map((pr) => ({
        exerciseId: pr.exerciseId,
        exerciseName: pr.exerciseName,
        metric: pr.metric,
        value: parseFloat(pr.value.toString()),
        previousValue: null,
        achievedAt: pr.achievedAt.toISOString(),
        deltaPct: null,
      })),
      recentSessions: last3Sessions.map((s) => ({
        id: s.id,
        title: 'Workout',
        date: s.createdAt.toISOString().split('T')[0],
        durationSec: 0,
        totalVolumeKg: s.totalVolumeKg ? parseFloat(s.totalVolumeKg.toString()) : null,
      })),
    };
  });
}
