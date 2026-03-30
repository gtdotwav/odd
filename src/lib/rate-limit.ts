/**
 * Lightweight in-memory sliding window rate limiter.
 *
 * Works within a single Vercel serverless cold start. Not perfect across
 * instances, but provides meaningful protection against burst abuse and
 * is trivial to swap for @upstash/ratelimit later.
 *
 * The Map auto-cleans expired entries to prevent memory leaks.
 */

export interface RateLimitConfig {
  /** Window size in milliseconds */
  interval: number;
  /** Maximum requests allowed per window */
  limit: number;
}

interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** Remaining requests in the current window */
  remaining: number;
  /** Timestamp (ms) when the window resets */
  reset: number;
  /** Milliseconds until the caller can retry (0 if not limited) */
  retryAfter: number;
}

/** Pre-configured rate limit tiers */
export const rateLimits = {
  /** General API: 60 req/min */
  api: { interval: 60_000, limit: 60 },
  /** Auth endpoints: 10 req/min */
  auth: { interval: 60_000, limit: 10 },
  /** Trade endpoints: 30 req/min */
  trade: { interval: 60_000, limit: 30 },
  /** Comment endpoints: 10 req/min */
  comment: { interval: 60_000, limit: 10 },
  /** Withdraw: 10 req/min */
  withdraw: { interval: 60_000, limit: 10 },
  /** Admin: 100 req/min */
  admin: { interval: 60_000, limit: 100 },
} as const;

// ── Internal store ──────────────────────────────────────────────────────────

interface WindowEntry {
  /** Timestamps of requests within the current window */
  timestamps: number[];
  /** When the window started (for cleanup) */
  windowStart: number;
}

const store = new Map<string, WindowEntry>();

// Cleanup stale entries every 60 seconds to prevent unbounded growth
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60_000;

function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    // Remove entries whose entire window has expired
    if (now - entry.windowStart > CLEANUP_INTERVAL * 2) {
      store.delete(key);
    }
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Check rate limit for a given key (IP, userId, etc.).
 *
 * @example
 * ```ts
 * const rl = checkRateLimit(ip, rateLimits.trade);
 * if (!rl.success) {
 *   return NextResponse.json({ error: "rate_limited" }, { status: 429 });
 * }
 * ```
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  cleanup(now);

  const windowStart = now - config.interval;
  const compositeKey = `${key}:${config.interval}:${config.limit}`;

  let entry = store.get(compositeKey);

  if (!entry) {
    entry = { timestamps: [], windowStart: now };
    store.set(compositeKey, entry);
  }

  // Slide the window: keep only timestamps within the current interval
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);
  entry.windowStart = now;

  const reset = now + config.interval;

  if (entry.timestamps.length >= config.limit) {
    // Rate limited
    const oldestInWindow = entry.timestamps[0];
    const retryAfter = oldestInWindow + config.interval - now;

    return {
      success: false,
      remaining: 0,
      reset,
      retryAfter: Math.max(retryAfter, 0),
    };
  }

  // Allow and record
  entry.timestamps.push(now);

  return {
    success: true,
    remaining: config.limit - entry.timestamps.length,
    reset,
    retryAfter: 0,
  };
}
