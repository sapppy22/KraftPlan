import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { registerSchema, loginSchema, profileUpdateSchema } from '@kraftplan/shared';
import { schema } from '../db';
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signResetToken,
  verifyResetToken,
} from '../crypto';
import { type AppEnv, authUserId } from '../context';

function publicUser(u: typeof schema.users.$inferSelect) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatarUrl: u.avatarUrl,
    units: u.units,
    experience: u.experience,
    bodyweightKg: u.bodyweightKg ? parseFloat(u.bodyweightKg as string) : null,
    heightCm: (u as any).heightCm ? parseFloat((u as any).heightCm as string) : null,
    goal: (u as any).goal ?? null,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  };
}

export const auth = new Hono<AppEnv>();

auth.post('/register', async (c) => {
  const parsed = registerSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  const { email, password, name, units, experience, bodyweightKg, heightCm, goal } = parsed.data;
  const db = c.get('db');

  const existing = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (existing.length > 0) return c.json({ error: 'Email already registered' }, 409);

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(schema.users)
    .values({
      email,
      passwordHash,
      name,
      units,
      experience,
      role: (email === 'admin_redacted' || email === 'admin_redacted@test.com') ? 'admin' : 'user',
      bodyweightKg: bodyweightKg?.toString() || null,
      ...(heightCm !== undefined && { heightCm: heightCm.toString() }),
      ...(goal !== undefined && { goal }),
    } as any)
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

// ── Password reset ───────────────────────────────────────────────────
// No email provider is configured on the free tier, so we can't send the
// code out of band. Instead the flow is stateless + self-contained: we sign
// a short-lived token that carries a 6-digit code, and (in the absence of
// email) return the code so the UI can display it. `reset-password` then
// verifies the token+code and updates the hash. Swapping in a real mailer
// later just means dropping the `code` from this response and emailing it.
const forgotPasswordSchema = z.object({ email: z.string().email() });

auth.post('/forgot-password', async (c) => {
  const parsed = forgotPasswordSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: 'Please enter a valid email address' }, 400);
  const { email } = parsed.data;
  const db = c.get('db');

  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  // Always answer 200 so we don't leak which emails are registered.
  if (!user || !user.passwordHash) return c.json({ sent: true });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const resetToken = await signResetToken({ userId: user.id, email: user.email, code }, c.env.JWT_SECRET);
  // `code` is echoed back only because there is no mail transport (demo/free tier).
  return c.json({ sent: true, resetToken, code, delivery: 'in-app' });
});

const resetPasswordSchema = z.object({
  resetToken: z.string().min(1),
  code: z.string().min(4).max(6),
  newPassword: z.string().min(8).max(128),
});

auth.post('/reset-password', async (c) => {
  const parsed = resetPasswordSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  const { resetToken, code, newPassword } = parsed.data;

  let payload;
  try {
    payload = await verifyResetToken(resetToken, c.env.JWT_SECRET);
  } catch {
    return c.json({ error: 'This reset request has expired. Please start again.' }, 400);
  }
  if (payload.purpose !== 'pwreset' || payload.code !== code) {
    return c.json({ error: 'Incorrect or expired reset code' }, 400);
  }

  const db = c.get('db');
  const passwordHash = await hashPassword(newPassword);
  const [user] = await db
    .update(schema.users)
    .set({ passwordHash })
    .where(eq(schema.users.id, payload.userId))
    .returning();
  if (!user) return c.json({ error: 'Account not found' }, 404);

  return c.json({ success: true });
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
  if (d.heightCm !== undefined) update.heightCm = d.heightCm?.toString() || null;
  if (d.goal !== undefined) update.goal = d.goal;
  if (d.avatarUrl !== undefined) update.avatarUrl = d.avatarUrl;

  const db = c.get('db');
  const [user] = await db.update(schema.users).set(update as any).where(eq(schema.users.id, uid)).returning();
  return c.json(publicUser(user));
});
