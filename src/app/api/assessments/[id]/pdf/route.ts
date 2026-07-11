import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, assertResourceOwner, authErrorResponse } from "@/lib/auth";
import { generateRoadmapPdf } from "@/lib/pdf/generate";
import { rateLimitAsync, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit";
import { localizedField } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import { userHasVerifiedPaidAccess } from "@/lib/payments/entitlement";

export const runtime = "nodejs";

const noStore = {
  "Cache-Control": "no-store",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const ip = getClientIp(request);
    const limit = await rateLimitAsync(`pdf:${user.id}`, 5, 60 * 60 * 1000);
    if (!limit.success) {
      return rateLimitResponse(limit, "Too many PDF requests");
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        steps: {
          include: { requirement: { include: { authority: true } } },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Not found" }, { status: 404, headers: noStore });
    }
    assertResourceOwner(assessment.userId, user.id);

    const hasPaid = await userHasVerifiedPaidAccess(user.id, { assessmentId: id });
    if (!hasPaid) {
      return NextResponse.json(
        { error: "PDF export requires a verified payment" },
        { status: 403, headers: noStore }
      );
    }

    const locale = (user.locale as "en" | "ar") ?? "en";
    const pdfBytes = await generateRoadmapPdf({
      companyName: user.companyName ?? "Company",
      sector: assessment.businessActivity ?? "General",
      generatedAt: formatDate(new Date(), locale),
      summary: "Personalized Saudi market entry roadmap based on your assessment responses.",
      steps: assessment.steps.map((s) => ({
        title: localizedField(locale, s.requirement, "title"),
        authority: s.requirement.authority
          ? localizedField(locale, s.requirement.authority, "name")
          : "N/A",
        description: localizedField(locale, s.requirement, "description"),
        complexity: s.requirement.complexity,
        riskLevel: s.requirement.riskLevel,
        officialUrl: s.requirement.officialUrl,
        disclaimer: localizedField(locale, s.requirement, "disclaimer") || null,
      })),
    });

    await createAuditLog({
      userId: user.id,
      action: "report.pdf_generated",
      entity: "Assessment",
      entityId: id,
      ipAddress: ip,
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ksa-roadmap-${id}.pdf"`,
        ...noStore,
      },
    });
  } catch (err) {
    return authErrorResponse(err);
  }
}
