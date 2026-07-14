import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { progressRoutes } from './routes/progress.js';
import { dashboardRoutes } from './routes/dashboard.js';

const PORT = parseInt(process.env.PROGRESS_PORT || '4004', 10);
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://forgefit:forgefit@localhost:5432/forgefit';

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true, credentials: true });
  app.decorate('dbUrl', DATABASE_URL);

  await app.register(progressRoutes, { prefix: '/progress' });
  await app.register(dashboardRoutes, { prefix: '/dashboard' });

  app.get('/health', async () => ({ status: 'ok', service: 'progress' }));

  app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`📊 Progress service running on port ${PORT}`);
}

main().catch(console.error);
