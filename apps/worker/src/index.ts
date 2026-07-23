import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createDB } from './db';
import { type AppEnv, authUserId, DEMO_USER_ID } from './context';
import { rateLimit, edgeCache } from './middleware/rateLimit';
import { auth } from './routes/auth';
import { library } from './routes/library';
import { plans, userPlan } from './routes/plans';
import { workouts } from './routes/workouts';
import { progress, dashboard } from './routes/progress';
import { feedback } from './routes/feedback';

const app = new Hono<AppEnv>();

// CORS — allow the configured origin(s), or all in dev.
app.use('*', async (c, next) => {
  const origin = c.env.CORS_ORIGIN || '*';
  const origins = origin === '*' ? '*' : origin.split(',').map((o) => o.trim());
  return cors({
    origin: origins,
    credentials: origin !== '*',
    allowHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-RateLimit-Limit'],
  })(c, next);
});

// Per-request DB (Neon HTTP) + resolve the caller (JWT → userId, else demo).
app.use('*', async (c, next) => {
  c.set('db', createDB(c.env.DATABASE_URL));
  c.set('userId', (await authUserId(c)) ?? DEMO_USER_ID);
  await next();
});

// Global Rate Limiting (120 reqs/min per IP/User)
app.use('*', rateLimit({ maxRequests: 120, windowMs: 60 * 1000 }));

// Auth rate limiting (20 reqs/min for login/register protection)
app.use('/auth/*', rateLimit({ maxRequests: 20, windowMs: 60 * 1000 }));

// Edge CDN Caching for public endpoints
app.use('/exercises/*', edgeCache('static'));
app.use('/plans/*', edgeCache('static'));
app.use('/dashboard', edgeCache('private'));
app.use('/progress/*', edgeCache('private'));

app.get('/', (c) =>
  c.json({
    name: 'KraftPlan API',
    runtime: 'cloudflare-workers',
    status: 'ok',
    features: ['rate-limiting', 'edge-caching', 'load-balancer-ready', 'session-control'],
  })
);
app.get('/health', (c) =>
  c.json({ status: 'ok', service: 'kraftplan-api', time: new Date().toISOString() })
);

app.route('/auth', auth);
app.route('/exercises', library);
app.route('/plans', plans);
app.route('/users/me/plan', userPlan);
app.route('/workouts', workouts);
app.route('/progress', progress);
app.route('/dashboard', dashboard);
app.route('/feedback', feedback);

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});

export default app;
