import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimitAsync, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

const noStore = { "Cache-Control": "no-store" };

/**
 * Minimal DB connectivity check for Railway/ops.
 * Does not expose secrets, connection strings, or infrastructure details.
 */
export async function GET(request: Request) {
  const ip = getClientIp(request);
  const limit = await rateLimitAsync(`health:db:${ip}`, 30, 60 * 1000);
  if (!limit.success) {
    return rateLimitResponse(limit);
  }

  const hasUrl = Boolean(process.env.DATABASE_URL?.trim());

  if (!hasUrl) {
    return NextResponse.json(
      { ok: false, database: "unconfigured" },
      { status: 503, headers: noStore }
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, database: "connected" }, { headers: noStore });
  } catch (err) {
    console.error("[health/db] connection failed", {
      name: err instanceof Error ? err.name : "Error",
      message: err instanceof Error ? err.message : "unknown",
    });
    return NextResponse.json(
      { ok: false, database: "unreachable" },
      { status: 503, headers: noStore }
    );
  }
}
