import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
// Schema is imported directly from source (no relative .js specifiers inside it),
// so esbuild bundles it without pulling in the Node postgres-js driver.
import * as schema from '../../../packages/db/src/schema/index';

export { schema };
export type DB = ReturnType<typeof createDB>;

// Neon HTTP driver: stateless fetch-per-query, ideal for Workers (no pools,
// no cold-start connection setup).
export function createDB(connectionString: string) {
  return drizzle(neon(connectionString), { schema });
}

export interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
  CORS_ORIGIN?: string;
}

export type Vars = {
  db: DB;
  userId: string;
};
