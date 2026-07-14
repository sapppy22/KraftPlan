import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Load the monorepo-root .env for local dev. In production (Render/Cloudflare)
// the platform injects real env vars, which dotenv will not override.
const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, '../../../.env') });
loadEnv();

import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';

// Route modules from every service — combined into one deployable so the
// whole API runs from a single process (free-tier friendly). All services
// use the same `app.decorate('dbUrl' | 'jwtSecret' | 'redisUrl')` contract
// and non-overlapping route prefixes, so they compose cleanly.
import { verifyToken } from '../../../services/auth/src/lib/jwt.js';
import { authRoutes } from '../../../services/auth/src/routes/auth.js';
import { profileRoutes } from '../../../services/auth/src/routes/profile.js';
import { planRoutes } from '../../../services/plans/src/routes/plans.js';
import { assignmentRoutes } from '../../../services/plans/src/routes/assignments.js';
import { sessionRoutes } from '../../../services/workouts/src/routes/sessions.js';
import { setRoutes } from '../../../services/workouts/src/routes/sets.js';
import { progressRoutes } from '../../../services/progress/src/routes/progress.js';
import { dashboardRoutes } from '../../../services/progress/src/routes/dashboard.js';
import { exerciseRoutes } from '../../../services/library/src/routes/exercises.js';

const PORT = parseInt(process.env.PORT || process.env.API_PORT || '4001', 10);
const HOST = process.env.HOST || '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';
const DATABASE_URL =
  process.env.DATABASE_URL || 'postgres://kraftplan:kraftplan@localhost:5432/kraftplan';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
// Valid-format UUID used for unauthenticated/demo browsing so read-only
// endpoints return empty results instead of crashing on an invalid UUID.
const DEMO_USER_ID = process.env.DEMO_USER_ID || '00000000-0000-0000-0000-000000000000';

// Comma-separated list of allowed origins for production; `*` in dev.
const CORS_ORIGINS = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : true;

async function main() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport:
        process.env.NODE_ENV === 'production'
          ? undefined
          : { target: 'pino-pretty', options: { colorize: true } },
    },
    trustProxy: true,
  });

  await app.register(cors, { origin: CORS_ORIGINS, credentials: true });
  await app.register(cookie);
  await app.register(rateLimit, { max: 300, timeWindow: '1 minute' });

  // Shared decorators consumed by every route module.
  app.decorate('jwtSecret', JWT_SECRET);
  app.decorate('dbUrl', DATABASE_URL);
  app.decorate('redisUrl', REDIS_URL);

  // BFF auth propagation: downstream route modules identify the caller via the
  // `x-user-id` header. Decode the Bearer JWT once here and inject it, falling
  // back to a valid demo UUID so unauthenticated reads degrade gracefully.
  app.addHook('onRequest', async (request) => {
    if (request.headers['x-user-id']) return;
    const auth = request.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      try {
        const payload = await verifyToken<{ userId: string }>(auth.slice(7), JWT_SECRET);
        if (payload?.userId) {
          request.headers['x-user-id'] = payload.userId;
          return;
        }
      } catch {
        /* invalid/expired token — fall through to demo id */
      }
    }
    request.headers['x-user-id'] = DEMO_USER_ID;
  });

  // ── Auth ──
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(profileRoutes, { prefix: '/auth' });

  // ── Plans ──
  await app.register(planRoutes, { prefix: '/plans' });
  await app.register(assignmentRoutes, { prefix: '/users/me/plan' });

  // ── Workouts ──
  await app.register(sessionRoutes, { prefix: '/workouts' });
  await app.register(setRoutes, { prefix: '/workouts' });

  // ── Progress ──
  await app.register(progressRoutes, { prefix: '/progress' });
  await app.register(dashboardRoutes, { prefix: '/dashboard' });

  // ── Library ──
  await app.register(exerciseRoutes, { prefix: '/exercises' });

  // Convenience alias used by the web BFF: GET /plans/today
  app.get('/plans/today', async (request, reply) => {
    const dateStr =
      (request.query as any)?.date || new Date().toISOString().split('T')[0];
    return reply.redirect(`/users/me/plan/today?date=${dateStr}`);
  });

  app.get('/health', async () => ({
    status: 'ok',
    service: 'kraftplan-api',
    time: new Date().toISOString(),
  }));
  app.get('/', async () => ({ name: 'KraftPlan API', status: 'ok' }));

  await app.listen({ port: PORT, host: HOST });
  app.log.info(`🏋️  KraftPlan API listening on http://${HOST}:${PORT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
