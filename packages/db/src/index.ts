import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

export type DB = ReturnType<typeof createDB>;

export function createDB(connectionString: string) {
  const client = postgres(connectionString, {
    max: 10,
    idle_timeout: 30,
    connect_timeout: 10,
  });
  return drizzle(client, { schema });
}

export { schema };
