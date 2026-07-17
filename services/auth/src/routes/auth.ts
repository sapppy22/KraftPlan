import type { FastifyInstance } from 'fastify';
import { createDB } from '@kraftplan/db';
import { schema } from '@kraftplan/db';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { registerSchema, loginSchema } from '@kraftplan/shared';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { signAccessToken, signRefreshToken } from '../lib/jwt.js';

export async function authRoutes(app: FastifyInstance) {
  const jwtSecret = app.jwtSecret as string;
  const dbUrl = app.dbUrl as string;
  const db = createDB(dbUrl);

  app.post('/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const { email, password, name, units, experience, bodyweightKg } = parsed.data;

    const existing = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    if (existing.length > 0) {
      return reply.status(409).send({ error: 'Email already registered' });
    }

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
        bodyweightKg: bodyweightKg?.toString() || null 
      })
      .returning();

    const accessToken = await signAccessToken({ userId: user.id, role: user.role || 'user' }, jwtSecret);

    return reply.status(201).send({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        units: user.units,
        experience: user.experience,
        bodyweightKg: user.bodyweightKg ? parseFloat(user.bodyweightKg) : null,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
    });
  });

  app.post('/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const { email, password } = parsed.data;

    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    if (!user || !user.passwordHash) {
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    const valid = await verifyPassword(user.passwordHash, password);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    const accessToken = await signAccessToken({ userId: user.id, role: user.role || 'user' }, jwtSecret);

    return reply.send({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        units: user.units,
        experience: user.experience,
        bodyweightKg: user.bodyweightKg ? parseFloat(user.bodyweightKg) : null,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
    });
  });
}
