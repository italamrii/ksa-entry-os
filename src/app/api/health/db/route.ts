import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Lightweight DB connectivity check for Railway/ops.
 * Does not expose secrets or connection strings.
 */
export async function GET() {
  const hasUrl = Boolean(process.env.DATABASE_URL?.trim());

  if (!hasUrl) {
    return NextResponse.json(
      { ok: false, database: "unconfigured" },
      { status: 503 }
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    const userCount = await prisma.user.count();
    return NextResponse.json({
      ok: true,
      database: "connected",
      userCount,
    });
  } catch (err) {
    console.error("[health/db] connection failed", {
      name: err instanceof Error ? err.name : "Error",
      message: err instanceof Error ? err.message : "unknown",
    });
    return NextResponse.json(
      { ok: false, database: "unreachable" },
      { status: 503 }
    );
  }
}
