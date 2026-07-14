import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createDB } from './db';
import { type AppEnv, authUserId, DEMO_USER_ID } from './context';
import { auth } from './routes/auth';
import { library } from './routes/library';
import { plans, userPlan } from './routes/plans';
import { workouts } from './routes/workouts';
import { progress, dashboard } from './routes/progress';

const app = new Hono<AppEnv>();

// CORS — allow the configured origin(s), or all in dev.
app.use('*', async (c, next) => {
  const origin = c.env.CORS_ORIGIN || '*';
  const origins = origin === '*' ? '*' : origin.split(',').map((o) => o.trim());
  return cors({ origin: origins, credentials: origin !== '*', allowHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'] })(c, next);
});

// Per-request DB (Neon HTTP) + resolve the caller (JWT → userId, else demo).
app.use('*', async (c, next) => {
  c.set('db', createDB(c.env.DATABASE_URL));
  c.set('userId', (await authUserId(c)) ?? DEMO_USER_ID);
  await next();
});

app.get('/', (c) => c.json({ name: 'KraftPlan API', runtime: 'cloudflare-workers', status: 'ok' }));
app.get('/health', (c) => c.json({ status: 'ok', service: 'kraftplan-api', time: new Date().toISOString() }));

app.route('/auth', auth);
app.route('/exercises', library);
app.route('/plans', plans);
app.route('/users/me/plan', userPlan);
app.route('/workouts', workouts);
app.route('/progress', progress);
app.route('/dashboard', dashboard);

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});

export default app;
