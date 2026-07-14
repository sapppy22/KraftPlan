import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { registerSchema, loginSchema, profileUpdateSchema } from '@kraftplan/shared';
import { schema } from '../db';
import { hashPassword, verifyPassword, signAccessToken } from '../crypto';
import { type AppEnv, authUserId } from '../context';

function publicUser(u: typeof schema.users.$inferSelect) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatarUrl: u.avatarUrl,
    units: u.units,
    experience: u.experience,
    bodyweightKg: u.bodyweightKg ? parseFloat(u.bodyweightKg) : null,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  };
}

export const auth = new Hono<AppEnv>();

auth.post('/register', async (c) => {
  const parsed = registerSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  const { email, password, name, units, experience, bodyweightKg } = parsed.data;
  const db = c.get('db');

  const existing = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (existing.length > 0) return c.json({ error: 'Email already registered' }, 409);

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(schema.users)
    .values({ email, passwordHash, name, units, experience, bodyweightKg: bodyweightKg?.toString() || null })
    .returning();

  const accessToken = await signAccessToken({ userId: user.id, role: user.role || 'user' }, c.env.JWT_SECRET);
  return c.json({ accessToken, user: publicUser(user) }, 201);
});

auth.post('/login', async (c) => {
  const parsed = loginSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  const { email, password } = parsed.data;
  const db = c.get('db');

  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (!user || !user.passwordHash) return c.json({ error: 'Invalid email or password' }, 401);

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) return c.json({ error: 'Invalid email or password' }, 401);

  const accessToken = await signAccessToken({ userId: user.id, role: user.role || 'user' }, c.env.JWT_SECRET);
  return c.json({ accessToken, user: publicUser(user) });
});

auth.get('/me', async (c) => {
  const uid = await authUserId(c);
  if (!uid) return c.json({ error: 'Unauthorized' }, 401);
  const db = c.get('db');
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, uid)).limit(1);
  if (!user) return c.json({ error: 'User not found' }, 404);
  return c.json(publicUser(user));
});

auth.patch('/me', async (c) => {
  const uid = await authUserId(c);
  if (!uid) return c.json({ error: 'Unauthorized' }, 401);
  const parsed = profileUpdateSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);

  const d = parsed.data;
  const update: Record<string, unknown> = {};
  if (d.name !== undefined) update.name = d.name;
  if (d.units !== undefined) update.units = d.units;
  if (d.experience !== undefined) update.experience = d.experience;
  if (d.bodyweightKg !== undefined) update.bodyweightKg = d.bodyweightKg?.toString() || null;
  if (d.avatarUrl !== undefined) update.avatarUrl = d.avatarUrl;

  const db = c.get('db');
  const [user] = await db.update(schema.users).set(update).where(eq(schema.users.id, uid)).returning();
  return c.json(publicUser(user));
});
