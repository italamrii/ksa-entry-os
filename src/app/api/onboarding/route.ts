import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, authErrorResponse } from "@/lib/auth";
import { onboardingSchema } from "@/lib/validation/schemas";
import { createAuditLog } from "@/lib/audit";
import { logServerError } from "@/lib/log";
import { getOrCreatePrimaryOrganizationId } from "@/lib/organizations";
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

    // Persist ONLY the authenticated user's own profile. The canonical home is
    // the organization's CompanyProfile; the User columns are kept as a
    // compatibility mirror. Both are written in one transaction. A failure here
    // is a genuine persistence error -> 500 with a safe log (never leak cause).
    const organizationId = await getOrCreatePrimaryOrganizationId(user);
    const p = parsed.data;
    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: {
            companyName: p.companyName,
            country: p.country,
            // Optional: leave an existing sector untouched when omitted.
            sectorId: p.sectorId,
            companyType: p.companyType,
            entryGoal: p.entryGoal,
            locale: p.locale,
            onboardingDone: true,
          },
        });
        await tx.companyProfile.upsert({
          where: { organizationId },
          update: {
            companyName: p.companyName,
            originCountry: p.country,
            sectorId: p.sectorId,
            companyType: p.companyType,
            entryGoal: p.entryGoal,
            locale: p.locale,
            onboardingDone: true,
          },
          create: {
            organizationId,
            companyName: p.companyName,
            originCountry: p.country,
            sectorId: p.sectorId ?? null,
            companyType: p.companyType,
            entryGoal: p.entryGoal,
            locale: p.locale,
            onboardingDone: true,
          },
        });
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
        organizationId,
        action: "onboarding.completed",
        entity: "CompanyProfile",
        entityId: organizationId,
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
