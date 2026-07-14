import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

export type DB = ReturnType<typeof createDB>;

// Cache one pool per connection string. Every service/route module calls
// createDB(app.dbUrl); memoizing means the whole process shares a single
// pool instead of opening one per module — fewer Neon connections, lower
// latency, and safe reuse under the pooled (PgBouncer) endpoint.
const pools = new Map<string, ReturnType<typeof drizzle<typeof schema>>>();

export function createDB(connectionString: string) {
  let db = pools.get(connectionString);
  if (!db) {
    const client = postgres(connectionString, {
      max: 10,
      idle_timeout: 30,
      connect_timeout: 10,
    });
    db = drizzle(client, { schema });
    pools.set(connectionString, db);
  }
  return db;
}

export { schema };
