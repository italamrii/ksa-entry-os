import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, authErrorResponse } from "@/lib/auth";
import { onboardingSchema } from "@/lib/validation/schemas";
import { createAuditLog } from "@/lib/audit";
import { logServerError } from "@/lib/log";
import { rateLimitAsync, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

const noStore = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  try {
    // Canonical Stage 2 session resolution (httpOnly cookie -> tokenHash lookup).
    // Throws 401 when unauthenticated; any other throw is a persistence/infra
    // failure and is surfaced as a logged 500 by authErrorResponse below.
    const user = await requireUser();
    const ip = getClientIp(request);

    const limit = await rateLimitAsync(`onboarding:${user.id}`, 10, 60 * 60 * 1000);
    if (!limit.success) return rateLimitResponse(limit);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400, headers: noStore });
    }

    const parsed = onboardingSchema.strict().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400, headers: noStore });
    }

    // Persist ONLY the authenticated user's own profile. A failure here is a
    // genuine persistence error -> 500 with a safe log (never leak the cause).
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          companyName: parsed.data.companyName,
          country: parsed.data.country,
          // Optional: leave an existing sector untouched when omitted.
          sectorId: parsed.data.sectorId,
          companyType: parsed.data.companyType,
          entryGoal: parsed.data.entryGoal,
          locale: parsed.data.locale,
          onboardingDone: true,
        },
      });
    } catch (err) {
      logServerError("onboarding", err);
      return NextResponse.json({ error: "Request failed" }, { status: 500, headers: noStore });
    }

    // Secondary work — must never fail the request. createAuditLog swallows its
    // own errors, and we defensively guard here as well.
    try {
      await createAuditLog({
        userId: user.id,
        action: "onboarding.completed",
        entity: "User",
        entityId: user.id,
        ipAddress: ip,
      });
    } catch (err) {
      logServerError("onboarding.audit", err);
    }

    return NextResponse.json({ success: true }, { headers: noStore });
  } catch (err) {
    return authErrorResponse(err);
  }
}
