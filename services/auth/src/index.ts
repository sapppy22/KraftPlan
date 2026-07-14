import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { authRoutes } from './routes/auth.js';
import { profileRoutes } from './routes/profile.js';

const PORT = parseInt(process.env.AUTH_PORT || '4001', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://kraftplan:kraftplan@localhost:5432/kraftplan';

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(cookie);
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

  app.decorate('jwtSecret', JWT_SECRET);
  app.decorate('dbUrl', DATABASE_URL);

  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(profileRoutes, { prefix: '/auth' });

  app.get('/health', async () => ({ status: 'ok', service: 'auth' }));

  app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`🔐 Auth service running on port ${PORT}`);
}

main().catch(console.error);
