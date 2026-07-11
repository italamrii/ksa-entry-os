import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { generateRoadmapPdf } from "@/lib/pdf/generate";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit";
import { localizedField } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ip = getClientIp(request);
  const limit = rateLimit(`pdf:${user.id}`, 5, 60 * 60 * 1000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many PDF requests" }, { status: 429 });
  }

  const assessment = await prisma.assessment.findFirst({
    where: { id, userId: user.id },
    include: {
      steps: {
        include: { requirement: { include: { authority: true } } },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!assessment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const hasPaid = await prisma.payment.findFirst({
    where: { userId: user.id, status: "PAID" },
  });

  if (!hasPaid) {
    return NextResponse.json({ error: "PDF export requires a paid plan" }, { status: 403 });
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
    },
  });
}
