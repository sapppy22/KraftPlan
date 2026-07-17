import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { schema } from '../db';
import { authUserId, type AppEnv } from '../context';

export const feedback = new Hono<AppEnv>();

const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'other']),
  message: z.string().min(1).max(2000),
});

// Submit feedback
feedback.post('/', async (c) => {
  const uid = await authUserId(c);
  // Allow guest feedback if not logged in (uid will be null)
  
  const parsed = feedbackSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }

  const db = c.get('db');
  await db.insert(schema.feedback).values({
    userId: uid || null, // null if guest
    type: parsed.data.type,
    message: parsed.data.message,
    status: 'open',
  });

  return c.json({ success: true }, 201);
});

// Admin ONLY: Get feedback
feedback.get('/', async (c) => {
  const uid = await authUserId(c);
  if (!uid) return c.json({ error: 'Unauthorized' }, 401);

  const db = c.get('db');
  
  // Verify admin role
  const [user] = await db.select({ role: schema.users.role }).from(schema.users).where(eq(schema.users.id, uid)).limit(1);
  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const results = await db.select().from(schema.feedback).orderBy(schema.feedback.createdAt);
  return c.json(results);
});
