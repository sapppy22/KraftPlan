import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { planRoutes } from './routes/plans.js';
import { assignmentRoutes } from './routes/assignments.js';

const PORT = parseInt(process.env.PLANS_PORT || '4002', 10);
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://forgefit:forgefit@localhost:5432/forgefit';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(rateLimit, { max: 200, timeWindow: '1 minute' });

  app.decorate('dbUrl', DATABASE_URL);
  app.decorate('redisUrl', REDIS_URL);

  // ── Routes ──
  await app.register(planRoutes, { prefix: '/plans' });
  await app.register(assignmentRoutes, { prefix: '/users/me/plan' });

  // GET /plans/today — alias for today's session (convenience for BFF)
  app.get('/plans/today', async (request, reply) => {
    const userId = (request.headers['x-user-id'] as string) || 'demo-user-id';
    const dateStr = (request.query as any).date || new Date().toISOString().split('T')[0];
    request.headers['x-user-id'] = userId;
    request.query = { ...(request.query as any), date: dateStr };
    // Re-route to the assignment handler
    return reply.redirect(`/users/me/plan/today?date=${dateStr}`);
  });

  app.get('/health', async () => ({ status: 'ok', service: 'plans' }));

  app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`📋 Plans service running on port ${PORT}`);
}

main().catch(console.error);
