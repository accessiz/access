/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Designed for Edge/Node.js API routes. Uses a Map with automatic
 * cleanup to prevent memory leaks. NOT suitable for multi-instance
 * deployments — use Redis/Upstash for that. Fine for single-instance
 * Vercel serverless functions where cold starts reset the map.
 *
 * @example
 * ```ts
 * const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 10 });
 *
 * export async function GET(req: NextRequest) {
 *   const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
 *   const result = limiter.check(ip);
 *   if (!result.allowed) {
 *     return NextResponse.json({ error: 'Too many requests' }, {
 *       status: 429,
 *       headers: { 'Retry-After': String(Math.ceil(result.retryAfterMs / 1000)) },
 *     });
 *   }
 *   // ... handle request
 * }
 * ```
 */

interface RateLimiterOptions {
  /** Time window in milliseconds (default: 60_000 = 1 minute) */
  windowMs?: number;
  /** Maximum requests allowed in the window (default: 10) */
  maxRequests?: number;
  /** How often to run cleanup of expired entries in ms (default: 5 minutes) */
  cleanupIntervalMs?: number;
}

interface RateLimitResult {
  allowed: boolean;
  /** Remaining requests in current window */
  remaining: number;
  /** Ms until window resets (only meaningful when !allowed) */
  retryAfterMs: number;
  /** Total limit */
  limit: number;
}

interface RateLimitEntry {
  timestamps: number[];
  /** Earliest timestamp — used for fast expiry check */
  windowStart: number;
}

export function createRateLimiter(options: RateLimiterOptions = {}) {
  const {
    windowMs = 60_000,
    maxRequests = 10,
    cleanupIntervalMs = 5 * 60_000,
  } = options;

  const store = new Map<string, RateLimitEntry>();

  // Periodic cleanup to prevent memory leaks from abandoned keys
  let lastCleanup = Date.now();

  function cleanup(now: number) {
    if (now - lastCleanup < cleanupIntervalMs) return;
    lastCleanup = now;
    for (const [key, entry] of store.entries()) {
      if (now - entry.windowStart > windowMs * 2) {
        store.delete(key);
      }
    }
  }

  function check(key: string): RateLimitResult {
    const now = Date.now();
    cleanup(now);

    const windowStart = now - windowMs;
    let entry = store.get(key);

    if (!entry) {
      entry = { timestamps: [now], windowStart: now };
      store.set(key, entry);
      return { allowed: true, remaining: maxRequests - 1, retryAfterMs: 0, limit: maxRequests };
    }

    // Prune timestamps outside the window
    entry.timestamps = entry.timestamps.filter(t => t > windowStart);
    entry.windowStart = entry.timestamps[0] ?? now;

    if (entry.timestamps.length >= maxRequests) {
      const oldestInWindow = entry.timestamps[0];
      const retryAfterMs = oldestInWindow + windowMs - now;
      return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, retryAfterMs), limit: maxRequests };
    }

    entry.timestamps.push(now);
    return {
      allowed: true,
      remaining: maxRequests - entry.timestamps.length,
      retryAfterMs: 0,
      limit: maxRequests,
    };
  }

  /** Reset a single key (useful for tests) */
  function reset(key: string) {
    store.delete(key);
  }

  /** Clear all entries (useful for tests) */
  function clear() {
    store.clear();
  }

  return { check, reset, clear };
}

// ── Pre-configured limiters for API routes ──

import { NextRequest, NextResponse } from 'next/server';

/** Standard API limiter: 30 req/min per IP */
export const apiLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 30 });

/** Strict limiter for mutating/expensive endpoints: 10 req/min per IP */
export const strictLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 10 });

/**
 * Extract client IP from request headers (Vercel/Cloudflare compatible).
 * Falls back to 'unknown' if no forwarded header is present.
 */
export function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Apply rate limit check and return a 429 response if exceeded.
 * Returns `null` when the request is allowed (caller should continue).
 *
 * @example
 * ```ts
 * export async function GET(req: NextRequest) {
 *   const blocked = applyRateLimit(req, apiLimiter);
 *   if (blocked) return blocked;
 *   // ... handle request
 * }
 * ```
 */
export function applyRateLimit(
  req: NextRequest,
  limiter: ReturnType<typeof createRateLimiter> = apiLimiter,
): NextResponse | null {
  const ip = getClientIP(req);
  const result = limiter.check(ip);

  if (!result.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(result.retryAfterMs / 1000)),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': '0',
        },
      },
    );
  }

  return null;
}
