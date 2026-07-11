/**
 * Distributed rate limiting.
 * Production: Redis (REDIS_URL required unless ALLOW_MEMORY_RATE_LIMIT=true).
 * Development/test: in-memory fallback.
 */

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitEntry>();

type RedisClient = {
  incr(key: string): Promise<number>;
  pexpire(key: string, ms: number): Promise<number>;
  pttl(key: string): Promise<number>;
  quit(): Promise<"OK">;
};

let redisClient: RedisClient | null | undefined;
let redisInitError: string | null = null;

function allowMemoryRateLimitFallback(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.ALLOW_MEMORY_RATE_LIMIT === "true";
}

async function getRedis(): Promise<RedisClient | null> {
  if (redisClient !== undefined) return redisClient;

  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    if (process.env.NODE_ENV === "production" && !allowMemoryRateLimitFallback()) {
      redisInitError = "REDIS_URL is required in production";
      redisClient = null;
      return null;
    }
    redisClient = null;
    return null;
  }

  try {
    // Dynamic import so local/dev builds without Redis still work
    const { default: Redis } = await import("ioredis");
    const client = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: true,
    });
    await client.connect();
    redisClient = client as unknown as RedisClient;
    return redisClient;
  } catch (err) {
    redisInitError = err instanceof Error ? err.message : "redis_connect_failed";
    console.error("[rate-limit] Redis unavailable", { message: redisInitError });
    redisClient = null;
    return null;
  }
}

function memoryLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt < now) {
    const resetAt = now + windowMs;
    memoryStore.set(key, { count: 1, resetAt });
    return {
      success: true,
      remaining: limit - 1,
      resetAt,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (entry.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  entry.count += 1;
  return {
    success: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
  };
}

async function redisLimit(
  client: RedisClient,
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const redisKey = `rl:${key}`;
  const count = await client.incr(redisKey);
  if (count === 1) {
    await client.pexpire(redisKey, windowMs);
  }
  const ttl = await client.pttl(redisKey);
  const resetAt = Date.now() + (ttl > 0 ? ttl : windowMs);
  const retryAfterSeconds = Math.max(1, Math.ceil((ttl > 0 ? ttl : windowMs) / 1000));

  if (count > limit) {
    return {
      success: false,
      remaining: 0,
      resetAt,
      retryAfterSeconds,
    };
  }

  return {
    success: true,
    remaining: Math.max(0, limit - count),
    resetAt,
    retryAfterSeconds,
  };
}

/**
 * Async rate limit. Prefer this in API routes.
 * Fails closed in production when Redis is required but missing.
 */
export async function rateLimitAsync(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const client = await getRedis();

  if (client) {
    try {
      return await redisLimit(client, key, limit, windowMs);
    } catch (err) {
      console.error("[rate-limit] Redis command failed", {
        message: err instanceof Error ? err.message : "unknown",
      });
      if (allowMemoryRateLimitFallback()) {
        return memoryLimit(key, limit, windowMs);
      }
      return {
        success: false,
        remaining: 0,
        resetAt: Date.now() + windowMs,
        retryAfterSeconds: Math.ceil(windowMs / 1000),
      };
    }
  }

  if (process.env.NODE_ENV === "production" && !allowMemoryRateLimitFallback()) {
    console.error("[rate-limit] fail-closed", { reason: redisInitError ?? "no_redis" });
    return {
      success: false,
      remaining: 0,
      resetAt: Date.now() + windowMs,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  return memoryLimit(key, limit, windowMs);
}

/**
 * Sync wrapper for tests / places that cannot await.
 * Uses memory only — prefer rateLimitAsync in production paths.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  if (process.env.NODE_ENV === "production" && !allowMemoryRateLimitFallback()) {
    // Sync path cannot talk to Redis; fail closed unless memory explicitly allowed
    return {
      success: false,
      remaining: 0,
      resetAt: Date.now() + windowMs,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }
  return memoryLimit(key, limit, windowMs);
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function rateLimitResponse(result: RateLimitResult, message = "Too many requests") {
  return Response.json(
    { error: message },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
        "Cache-Control": "no-store",
      },
    }
  );
}

/** Normalize email for auth throttling without user enumeration side channels. */
export function normalizeEmailKey(email: string): string {
  return email.trim().toLowerCase();
}

/** Reset memory store (tests only). */
export function __resetMemoryRateLimitForTests() {
  memoryStore.clear();
}
