import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser, authErrorResponse } from "@/lib/auth";
import { assessmentSchema } from "@/lib/validation/schemas";
import { evaluateRules } from "@/lib/rules/engine";
import { rateLimitAsync, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit";
import { getOrCreatePrimaryOrganizationId } from "@/lib/organizations";
import { userHasVerifiedPaidAccess } from "@/lib/payments/entitlement";
import { assessCoverage, alertZeroCoverage } from "@/lib/knowledge/coverage";

export const runtime = "nodejs";

const noStore = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const ip = getClientIp(request);
    const limit = await rateLimitAsync(`assessment:${user.id}`, 10, 60 * 60 * 1000);
    if (!limit.success) {
      return rateLimitResponse(limit, "Too many assessments. Please try again later.");
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400, headers: noStore });
    }

    const parsed = assessmentSchema.strict().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400, headers: noStore });
    }

    const data = parsed.data;
    let sectorSlug: string | null = null;
    if (data.sectorId) {
      const sector = await prisma.sector.findUnique({ where: { id: data.sectorId } });
      sectorSlug = sector?.slug ?? null;
    }

    const requirements = await prisma.requirement.findMany({
      where: { isActive: true },
      include: { authority: true },
    });

    const matched = evaluateRules(requirements, {
      ...data,
      sectorSlug,
      companyType: user.companyType,
      entryGoal: user.entryGoal,
    });

    const hasPaid = await userHasVerifiedPaidAccess(user.id);
    const organizationId = await getOrCreatePrimaryOrganizationId(user);

    // Persist the raw answers as normalized key/value rows for the domain model.
    const answerEntries: { key: string; value: Prisma.InputJsonValue }[] = Object.entries({
      companyOrigin: data.companyOrigin,
      hasForeignEntity: data.hasForeignEntity,
      sectorId: data.sectorId ?? null,
      businessActivity: data.businessActivity ?? null,
      hiringEmployees: data.hiringEmployees,
      sellingToGov: data.sellingToGov,
      needsLocalOffice: data.needsLocalOffice,
      invoiceCustomers: data.invoiceCustomers,
      sectorLicensing: data.sectorLicensing,
      launchTimeline: data.launchTimeline ?? null,
    }).map(([key, value]) => ({ key, value: value as Prisma.InputJsonValue }));

    const assessment = await prisma.assessment.create({
      data: {
        userId: user.id,
        organizationId,
        companyOrigin: data.companyOrigin,
        hasForeignEntity: data.hasForeignEntity,
        sectorId: data.sectorId || null,
        businessActivity: data.businessActivity,
        hiringEmployees: data.hiringEmployees,
        sellingToGov: data.sellingToGov,
        needsLocalOffice: data.needsLocalOffice,
        invoiceCustomers: data.invoiceCustomers,
        sectorLicensing: data.sectorLicensing,
        launchTimeline: data.launchTimeline,
        normalizedFacts: {
          ...data,
          sectorSlug,
          companyType: user.companyType,
          entryGoal: user.entryGoal,
        } as Prisma.InputJsonValue,
        isPreview: !hasPaid,
        answers: { create: answerEntries },
        steps: {
          create: matched.map((req, i) => ({
            requirementId: req.id,
            order: i,
          })),
        },
      },
    });

    // Never present an empty roadmap as a completed result: classify coverage and
    // raise an admin governance alert when nothing governed matched.
    const coverage = await assessCoverage({
      matchedCount: matched.length,
      context: {
        sectorId: data.sectorId ?? null,
        companyType: user.companyType,
        entryGoal: user.entryGoal,
        businessActivity: data.businessActivity ?? null,
      },
    });
    if (coverage.status === "INSUFFICIENT_KNOWLEDGE") {
      await alertZeroCoverage({
        assessmentId: assessment.id,
        knowledgeBaseEmpty: coverage.knowledgeBaseEmpty,
        missingInputKeys: coverage.missingInputs.map((i) => i.key),
      });
    }

    await createAuditLog({
      userId: user.id,
      organizationId,
      action: "assessment.created",
      entity: "Assessment",
      entityId: assessment.id,
      ipAddress: ip,
    });

    return NextResponse.json(
      { assessmentId: assessment.id, stepCount: matched.length, coverage: coverage.status },
      { headers: noStore }
    );
  } catch (err) {
    return authErrorResponse(err);
  }
}
