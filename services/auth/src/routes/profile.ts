import type { FastifyInstance } from 'fastify';
import { createDB } from '@forgefit/db';
import { schema } from '@forgefit/db';
import { eq } from 'drizzle-orm';
import { profileUpdateSchema } from '@forgefit/shared';
import { verifyJwt } from '../middleware/verifyJwt.js';

export async function profileRoutes(app: FastifyInstance) {
  const jwtSecret = app.jwtSecret as string;
  const dbUrl = app.dbUrl as string;
  const db = createDB(dbUrl);

  app.get('/me', async (request, reply) => {
    const payload = await verifyJwt(request, reply, jwtSecret);
    if (!payload) return;

    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, payload.userId)).limit(1);
    if (!user) return reply.status(404).send({ error: 'User not found' });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      units: user.units,
      experience: user.experience,
      bodyweightKg: user.bodyweightKg ? parseFloat(user.bodyweightKg) : null,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  });

  app.patch('/me', async (request, reply) => {
    const payload = await verifyJwt(request, reply, jwtSecret);
    if (!payload) return;

    const parsed = profileUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.units !== undefined) updateData.units = parsed.data.units;
    if (parsed.data.experience !== undefined) updateData.experience = parsed.data.experience;
    if (parsed.data.bodyweightKg !== undefined) updateData.bodyweightKg = parsed.data.bodyweightKg?.toString() || null;
    if (parsed.data.avatarUrl !== undefined) updateData.avatarUrl = parsed.data.avatarUrl;

    const [user] = await db
      .update(schema.users)
      .set(updateData)
      .where(eq(schema.users.id, payload.userId))
      .returning();

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      units: user.units,
      experience: user.experience,
      bodyweightKg: user.bodyweightKg ? parseFloat(user.bodyweightKg) : null,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  });
}
