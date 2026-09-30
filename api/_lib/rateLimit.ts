/**
 * Basic sliding-window rate limiter held in function-instance memory.
 *
 * Good enough to stop casual abuse of a portfolio contact form. Instances are
 * reused across requests (Fluid Compute) but not shared, so this is a
 * per-instance limit, not a global one. For a hard global limit, swap this for
 * a Redis-backed limiter (e.g. Upstash from the Vercel Marketplace).
 */

const MAX_KEYS = 5000
const buckets = new Map<string, number[]>()

export interface RateLimitResult {
  ok: boolean
  /** Seconds until the next request would be allowed (when !ok). */
  retryAfter: number
}

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  const cutoff = now - windowMs
  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff)

  if (hits.length >= limit) {
    buckets.set(key, hits)
    return { ok: false, retryAfter: Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000)) }
  }

  hits.push(now)
  buckets.set(key, hits)

  // Bound memory: drop the oldest keys if a flood of distinct IPs arrives
  if (buckets.size > MAX_KEYS) {
    for (const k of buckets.keys()) {
      buckets.delete(k)
      if (buckets.size <= MAX_KEYS * 0.8) break
    }
  }
  return { ok: true, retryAfter: 0 }
}

/** Test helper. */
export function resetRateLimits() {
  buckets.clear()
}
