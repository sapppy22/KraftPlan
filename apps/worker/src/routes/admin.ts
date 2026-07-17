import { Hono } from 'hono';
import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { schema } from '../db';
import { authUserId, type AppEnv } from '../context';

export const admin = new Hono<AppEnv>();

// Middleware to ensure admin
admin.use('*', async (c, next) => {
  const uid = await authUserId(c);
  if (!uid) return c.json({ error: 'Unauthorized' }, 401);

  const db = c.get('db');
  const [user] = await db.select({ role: schema.users.role }).from(schema.users).where(eq(schema.users.id, uid)).limit(1);
  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Forbidden' }, 403);
  }

  await next();
});

// GET /admin/stats
admin.get('/stats', async (c) => {
  const db = c.get('db');
  const [{ count: users }] = await db.select({ count: sql<number>`cast(count(${schema.users.id}) as int)` }).from(schema.users);
  const [{ count: feedback }] = await db.select({ count: sql<number>`cast(count(${schema.feedback.id}) as int)` }).from(schema.feedback).where(eq(schema.feedback.status, 'open'));
  const [{ count: plans }] = await db.select({ count: sql<number>`cast(count(${schema.plans.id}) as int)` }).from(schema.plans);
  const [{ count: exercises }] = await db.select({ count: sql<number>`cast(count(${schema.exercises.id}) as int)` }).from(schema.exercises);

  return c.json({ users, feedback, plans, exercises });
});

// GET /admin/users
admin.get('/users', async (c) => {
  const db = c.get('db');
  const users = await db.select({
    id: schema.users.id,
    email: schema.users.email,
    name: schema.users.name,
    role: schema.users.role,
    createdAt: schema.users.createdAt,
  }).from(schema.users).orderBy(sql`${schema.users.createdAt} DESC`);
  return c.json(users);
});

// PATCH /admin/users/:id/role
const roleSchema = z.object({ role: z.enum(['admin', 'user']) });
admin.patch('/users/:id/role', async (c) => {
  const id = c.req.param('id');
  const parsed = roleSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: 'Validation failed' }, 400);

  const db = c.get('db');
  await db.update(schema.users).set({ role: parsed.data.role }).where(eq(schema.users.id, id));
  return c.json({ success: true });
});

// GET /admin/feedback
admin.get('/feedback', async (c) => {
  const db = c.get('db');
  const results = await db.select({
    id: schema.feedback.id,
    type: schema.feedback.type,
    message: schema.feedback.message,
    status: schema.feedback.status,
    createdAt: schema.feedback.createdAt,
    userId: schema.feedback.userId,
  }).from(schema.feedback).orderBy(sql`${schema.feedback.createdAt} DESC`);
  return c.json(results);
});

// PATCH /admin/feedback/:id/status
const feedbackStatusSchema = z.object({ status: z.enum(['open', 'closed', 'in_progress']) });
admin.patch('/feedback/:id/status', async (c) => {
  const id = c.req.param('id');
  const parsed = feedbackStatusSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: 'Validation failed' }, 400);

  const db = c.get('db');
  await db.update(schema.feedback).set({ status: parsed.data.status }).where(eq(schema.feedback.id, id));
  return c.json({ success: true });
});
