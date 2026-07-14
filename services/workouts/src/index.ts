import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { sessionRoutes } from './routes/sessions.js';
import { setRoutes } from './routes/sets.js';

const PORT = parseInt(process.env.WORKOUTS_PORT || '4003', 10);
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://forgefit:forgefit@localhost:5432/forgefit';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(rateLimit, { max: 300, timeWindow: '1 minute' });

  app.decorate('dbUrl', DATABASE_URL);
  app.decorate('redisUrl', REDIS_URL);

  await app.register(sessionRoutes, { prefix: '/workouts' });
  await app.register(setRoutes, { prefix: '/workouts' });

  app.get('/health', async () => ({ status: 'ok', service: 'workouts' }));

  app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`💪 Workouts service running on port ${PORT}`);
}

main().catch(console.error);
