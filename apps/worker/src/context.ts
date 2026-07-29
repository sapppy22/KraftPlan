import type { Context } from 'hono';
import { schema } from './db';
import type { Env, Vars, DB } from './db';
import { verifyToken } from './crypto';

export type AppEnv = { Bindings: Env; Variables: Vars };

// Valid-format UUID for unauthenticated/demo reads (returns empty instead of crashing).
export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

// Literal bearer token the web app sends for "Continue as guest" / Explore Mode.
// Must stay in sync with GUEST_TOKEN in apps/web/src/lib/AuthContext.tsx.
export const GUEST_TOKEN = 'GUEST_MODE';

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

/** True when the caller is an explicit "Continue as guest" session. */
export function isGuest(c: Context<AppEnv>): boolean {
  return c.req.header('authorization') === `Bearer ${GUEST_TOKEN}`;
}

/**
 * Ensure the shared demo/guest user row exists so guest writes (workout
 * sessions, plan assignments, …) satisfy the users foreign key. Idempotent.
 */
export async function ensureDemoUser(db: DB): Promise<void> {
  await db
    .insert(schema.users)
    .values({ id: DEMO_USER_ID, email: 'guest@kraftplan.app', name: 'Guest', role: 'user' } as any)
    .onConflictDoNothing({ target: schema.users.id });
}

/**
 * For write endpoints: real userId for a signed-in user, the shared demo user
 * for an explicit guest ("Explore Mode"), or a ready-to-return 401 otherwise.
 */
export async function requireUserId(c: Context<AppEnv>): Promise<string | Response> {
  const uid = await authUserId(c);
  if (uid) return uid;
  if (isGuest(c)) {
    await ensureDemoUser(c.get('db'));
    return DEMO_USER_ID;
  }
  return c.json({ error: 'Sign in required for this action' }, 401);
}
