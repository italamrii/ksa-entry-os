import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { assessmentSchema } from "@/lib/validation/schemas";
import { evaluateRules } from "@/lib/rules/engine";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(request);
  const limit = rateLimit(`assessment:${user.id}`, 10, 60 * 60 * 1000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many assessments. Please try again later." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = assessmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
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

    const hasPaid = await prisma.payment.findFirst({
      where: { userId: user.id, status: "PAID" },
    });

    const assessment = await prisma.assessment.create({
      data: {
        userId: user.id,
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
        isPreview: !hasPaid,
        steps: {
          create: matched.map((req, i) => ({
            requirementId: req.id,
            order: i,
          })),
        },
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "assessment.created",
      entity: "Assessment",
      entityId: assessment.id,
      ipAddress: ip,
    });

    return NextResponse.json({ assessmentId: assessment.id, stepCount: matched.length });
  } catch {
    return NextResponse.json({ error: "Failed to create assessment" }, { status: 500 });
  }
}
