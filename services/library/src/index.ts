import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { exerciseRoutes } from './routes/exercises.js';

const PORT = parseInt(process.env.LIBRARY_PORT || '4005', 10);
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://forgefit:forgefit@localhost:5432/forgefit';

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true, credentials: true });
  app.decorate('dbUrl', DATABASE_URL);

  await app.register(exerciseRoutes, { prefix: '/exercises' });

  app.get('/health', async () => ({ status: 'ok', service: 'library' }));

  app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`📚 Library service running on port ${PORT}`);
}

main().catch(console.error);
