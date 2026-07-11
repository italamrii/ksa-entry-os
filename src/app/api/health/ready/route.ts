import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Internal readiness: process is up and required production config shape is present.
 * Does not expose secret values.
 */
export async function GET() {
  const required = ["DATABASE_URL", "AUTH_SECRET"] as const;
  const missing = required.filter((k) => !process.env[k]?.trim());
  const authOk = (process.env.AUTH_SECRET?.length ?? 0) >= 32;
  const redisOk =
    process.env.NODE_ENV !== "production" ||
    Boolean(process.env.REDIS_URL?.trim()) ||
    process.env.ALLOW_MEMORY_RATE_LIMIT === "true";

  const ok = missing.length === 0 && authOk && redisOk;

  return NextResponse.json(
    {
      ok,
      checks: {
        databaseUrl: !missing.includes("DATABASE_URL"),
        authSecret: authOk,
        redis: redisOk,
      },
    },
    {
      status: ok ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
