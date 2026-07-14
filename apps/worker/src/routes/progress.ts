import { Hono } from 'hono';
import { eq, and, desc, gte, sql } from 'drizzle-orm';
import { epley1RM } from '@kraftplan/shared';
import { schema } from '../db';
import { resolveToday } from './plans';
import type { AppEnv } from '../context';

function rangeStart(range: string): Date {
  const d = new Date();
  d.setDate(d.getDate() - (range === '30d' ? 30 : range === '1y' ? 365 : 90));
  return d;
}

export const progress = new Hono<AppEnv>();

// GET /progress/prs
progress.get('/prs', async (c) => {
  const db = c.get('db');
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
    .where(eq(schema.personalRecords.userId, c.get('userId')))
    .orderBy(desc(schema.personalRecords.value));
  return c.json(
    prs.map((pr) => ({
      id: pr.id,
      exerciseId: pr.exerciseId,
      exerciseName: pr.exerciseName,
      metric: pr.metric,
      value: parseFloat(pr.value.toString()),
      previousValue: null,
      achievedAt: pr.achievedAt.toISOString(),
      deltaPct: null,
    })),
  );
});

// GET /progress/prs/:exerciseId/history
progress.get('/prs/:exerciseId/history', async (c) => {
  const exerciseId = c.req.param('exerciseId');
  const since = rangeStart(c.req.query('range') || '90d');
  const db = c.get('db');
  const history = await db
    .select({ weightKg: schema.workoutSets.weightKg, reps: schema.workoutSets.reps, loggedAt: schema.workoutSets.loggedAt })
    .from(schema.workoutSets)
    .innerJoin(schema.workoutSessions, eq(schema.workoutSets.sessionId, schema.workoutSessions.id))
    .where(
      and(
        eq(schema.workoutSessions.userId, c.get('userId')),
        eq(schema.workoutSets.exerciseId, exerciseId),
        eq(schema.workoutSets.status, 'completed'),
        gte(schema.workoutSets.loggedAt, since),
      ),
    )
    .orderBy(schema.workoutSets.loggedAt);

  const points = [];
  for (const s of history) {
    if (s.weightKg && s.reps) {
      points.push({ value: Math.round(epley1RM(parseFloat(s.weightKg.toString()), s.reps) * 10) / 10, achievedAt: s.loggedAt.toISOString() });
    }
  }
  return c.json(points);
});

// GET /progress/volume — weekly volume
progress.get('/volume', async (c) => {
  const since = rangeStart(c.req.query('range') || '30d');
  const db = c.get('db');
  const weekExpr = sql<string>`date_trunc('week', ${schema.workoutSets.loggedAt})`;
  const rows = await db
    .select({ week: weekExpr, total: sql<string>`SUM(CAST(${schema.workoutSets.weightKg} AS numeric) * ${schema.workoutSets.reps})` })
    .from(schema.workoutSets)
    .innerJoin(schema.workoutSessions, eq(schema.workoutSets.sessionId, schema.workoutSessions.id))
    .where(
      and(
        eq(schema.workoutSessions.userId, c.get('userId')),
        eq(schema.workoutSets.status, 'completed'),
        gte(schema.workoutSets.loggedAt, since),
      ),
    )
    .groupBy(weekExpr)
    .orderBy(weekExpr);
  return c.json(rows.map((r) => ({ week: new Date(r.week).toISOString().split('T')[0], volumeKg: parseFloat(r.total || '0') })));
});

// GET /progress/adherence — completed sessions over time
progress.get('/adherence', async (c) => {
  const since = rangeStart(c.req.query('range') || '1y');
  const db = c.get('db');
  const sessions = await db
    .select({ createdAt: schema.workoutSessions.createdAt, status: schema.workoutSessions.status })
    .from(schema.workoutSessions)
    .where(and(eq(schema.workoutSessions.userId, c.get('userId')), gte(schema.workoutSessions.createdAt, since)))
    .orderBy(schema.workoutSessions.createdAt);
  return c.json(sessions.map((s) => ({ date: s.createdAt.toISOString().split('T')[0], completed: s.status === 'completed' })));
});

// GET /progress/endurance — distance/pace trend
progress.get('/endurance', async (c) => {
  const since = rangeStart(c.req.query('range') || '90d');
  const db = c.get('db');
  const rows = await db
    .select({ distanceM: schema.workoutSets.distanceM, timeSec: schema.workoutSets.timeSec, loggedAt: schema.workoutSets.loggedAt })
    .from(schema.workoutSets)
    .innerJoin(schema.workoutSessions, eq(schema.workoutSets.sessionId, schema.workoutSessions.id))
    .where(
      and(
        eq(schema.workoutSessions.userId, c.get('userId')),
        eq(schema.workoutSets.status, 'completed'),
        sql`${schema.workoutSets.distanceM} IS NOT NULL`,
        gte(schema.workoutSets.loggedAt, since),
      ),
    )
    .orderBy(schema.workoutSets.loggedAt);
  return c.json(
    rows.map((r) => {
      const dist = r.distanceM ? parseFloat(r.distanceM.toString()) : 0;
      const time = r.timeSec ? parseFloat(r.timeSec.toString()) : 0;
      const km = dist / 1000;
      const pace = dist && time ? `${Math.floor(time / km / 60)}:${String(Math.round((time / km) % 60)).padStart(2, '0')} /km` : null;
      return { date: r.loggedAt.toISOString().split('T')[0], distanceKm: km, durationSec: time, pace };
    }),
  );
});

// GET /dashboard — aggregated payload
export const dashboard = new Hono<AppEnv>();

dashboard.get('/', async (c) => {
  const userId = c.get('userId');
  const db = c.get('db');

  const [assignment] = await db
    .select()
    .from(schema.userPlanAssignments)
    .where(and(eq(schema.userPlanAssignments.userId, userId), eq(schema.userPlanAssignments.status, 'active')))
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
    const t = await resolveToday(db, userId, new Date().toISOString().split('T')[0]);
    today = { title: t.title, estimatedMinutes: t.estimatedMinutes, isRestDay: t.isRestDay, dayId: t.dayId };
  }

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekSessions = await db
    .select({ status: schema.workoutSessions.status })
    .from(schema.workoutSessions)
    .where(and(eq(schema.workoutSessions.userId, userId), gte(schema.workoutSessions.createdAt, weekStart)));
  const thisWeekCompleted = weekSessions.filter((s) => s.status === 'completed').length;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const [vol] = await db
    .select({ total: sql<string>`COALESCE(SUM(CAST(${schema.workoutSets.weightKg} AS numeric) * ${schema.workoutSets.reps}), 0)` })
    .from(schema.workoutSets)
    .innerJoin(schema.workoutSessions, eq(schema.workoutSets.sessionId, schema.workoutSessions.id))
    .where(
      and(
        eq(schema.workoutSessions.userId, userId),
        eq(schema.workoutSets.status, 'completed'),
        gte(schema.workoutSets.loggedAt, thirtyDaysAgo),
      ),
    );
  const volume30d = parseFloat(vol?.total || '0');

  const recent = await db
    .select({ createdAt: schema.workoutSessions.createdAt, status: schema.workoutSessions.status })
    .from(schema.workoutSessions)
    .where(eq(schema.workoutSessions.userId, userId))
    .orderBy(desc(schema.workoutSessions.createdAt))
    .limit(30);
  let streak = 0;
  const seen = new Set<string>();
  for (const s of recent) {
    if (s.status !== 'completed') break;
    const d = s.createdAt.toISOString().split('T')[0];
    if (seen.has(d)) continue;
    seen.add(d);
    streak++;
  }

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

  const last3 = await db
    .select({ id: schema.workoutSessions.id, createdAt: schema.workoutSessions.createdAt, totalVolumeKg: schema.workoutSessions.totalVolumeKg })
    .from(schema.workoutSessions)
    .where(eq(schema.workoutSessions.userId, userId))
    .orderBy(desc(schema.workoutSessions.createdAt))
    .limit(3);

  return c.json({
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
    recentSessions: last3.map((s) => ({
      id: s.id,
      title: 'Workout',
      date: s.createdAt.toISOString().split('T')[0],
      durationSec: 0,
      totalVolumeKg: s.totalVolumeKg ? parseFloat(s.totalVolumeKg.toString()) : null,
    })),
  });
});
