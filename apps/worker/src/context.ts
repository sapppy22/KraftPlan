import type { Context } from 'hono';
import type { Env, Vars } from './db';
import { verifyToken } from './crypto';

export type AppEnv = { Bindings: Env; Variables: Vars };

// Valid-format UUID for unauthenticated/demo reads (returns empty instead of crashing).
export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

/** Verify the Bearer token and return its userId, or null if missing/invalid. */
export async function authUserId(c: Context<AppEnv>): Promise<string | null> {
  const auth = c.req.header('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const payload = await verifyToken<{ userId: string }>(auth.slice(7), c.env.JWT_SECRET);
    return payload?.userId ?? null;
  } catch {
    return null;
  }
}
