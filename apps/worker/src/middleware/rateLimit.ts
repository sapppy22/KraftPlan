import type { Context, Next } from 'hono';
import type { AppEnv } from '../context';

// In-memory sliding window store for Cloudflare Worker isolation
const requestCounts = new Map<string, { count: number; resetAt: number }>();

/**
 * Rate Limiting Middleware
 * Enforces per-IP / per-user request limits with standard HTTP rate limit headers.
 * Max requests: 120 per minute for standard routes, 15 per minute for auth routes.
 */
export function rateLimit(options?: { maxRequests?: number; windowMs?: number }) {
  const maxRequests = options?.maxRequests ?? 120;
  const windowMs = options?.windowMs ?? 60 * 1000; // 1 minute

  return async (c: Context<AppEnv>, next: Next) => {
    // Derive client key from Cloudflare CF-Connecting-IP, X-Forwarded-For, or Auth userId
    const clientIp =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      '127.0.0.1';
    
    const userId = c.get('userId');
    const key = userId && userId !== '00000000-0000-0000-0000-000000000000'
      ? `user:${userId}`
      : `ip:${clientIp}`;

    const now = Date.now();
    let record = requestCounts.get(key);

    if (!record || now > record.resetAt) {
      record = { count: 1, resetAt: now + windowMs };
      requestCounts.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, maxRequests - record.count);
    const resetSec = Math.ceil((record.resetAt - now) / 1000);

    // Set standard RateLimit headers for Load Balancers and Clients
    c.header('X-RateLimit-Limit', maxRequests.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', resetSec.toString());

    if (record.count > maxRequests) {
      c.header('Retry-After', resetSec.toString());
      return c.json(
        {
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again shortly.',
          retryAfterSec: resetSec,
        },
        429
      );
    }

    await next();
  };
}

/**
 * Edge Caching & Load Balancer Middleware
 * Adds optimal Cache-Control headers for Edge CDN load balancers (Cloudflare Pages/Workers).
 */
export function edgeCache(type: 'static' | 'dynamic' | 'private') {
  return async (c: Context<AppEnv>, next: Next) => {
    await next();

    if (c.res.status === 200) {
      if (type === 'static') {
        // Cache heavily at CDN level for exercises/plans
        c.header('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
        c.header('Vary', 'Accept-Encoding');
      } else if (type === 'dynamic') {
        c.header('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');
      } else if (type === 'private') {
        c.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      }
    }
  };
}
