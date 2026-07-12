import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader, DisclaimerBanner } from "@/components/layout/site-header";
import { DashboardShell } from "@/components/layout/dashboard-nav";
import { RoadmapStepCard } from "@/components/assessment/roadmap-step-card";
import { Button } from "@/components/ui/button";
import { getPreviewLimit } from "@/lib/rules/engine";
import { DISCLAIMER_EN, DISCLAIMER_AR } from "@/lib/constants";
import { Download, CreditCard, Lock } from "lucide-react";
import { getAssessment } from "@/lib/i18n/content";
import type { Locale } from "@/lib/i18n";
import { userHasVerifiedPaidAccess } from "@/lib/payments/entitlement";

export default async function AssessmentResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const locale = (user.locale as Locale) ?? "en";
  const A = getAssessment(locale);

  const assessment = await prisma.assessment.findFirst({
    where: { id, userId: user.id },
    include: {
      steps: {
        include: { requirement: { include: { authority: true } } },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!assessment) redirect("/dashboard");

  const hasPaid = await userHasVerifiedPaidAccess(user.id, { assessmentId: id });
  const previewLimit = getPreviewLimit(!!hasPaid);
  const steps = assessment.steps.map((s) => s.requirement);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader locale={locale} isAuthenticated isAdmin={user.role === "ADMIN"} />
      <DashboardShell locale={locale} isAdmin={user.role === "ADMIN"} currentPath="/assessment">
        <div className="space-y-6">
          <div className="surface-panel flex flex-col gap-4 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-headline text-foreground">{A.resultTitle}</h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {steps.length} {A.resultSubtitle}
              </p>
            </div>
            <div className="flex gap-2">
              {hasPaid ? (
                <a href={`/api/assessments/${id}/pdf`}>
                  <Button className="cta-glow gap-2">
                    <Download className="h-4 w-4" />
                    {A.download}
                  </Button>
                </a>
              ) : (
                <Link href={`/payments?assessment=${id}&plan=PROFESSIONAL`}>
                  <Button className="gap-2">
                    <CreditCard className="h-4 w-4" />
                    {A.upgrade}
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {!hasPaid && (
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3">
              <p className="text-sm text-emerald-200/90">{A.previewNote}</p>
            </div>
          )}

          <div className="space-y-4">
            {steps.slice(0, previewLimit).map((step, i) => (
              <RoadmapStepCard key={step.id} step={step} index={i} locale={locale} />
            ))}
            {!hasPaid && steps.length > previewLimit && (
              <div className="surface-elevated rounded-2xl border border-dashed border-emerald-500/20 p-8 text-center">
                <Lock className="mx-auto h-8 w-8 text-[var(--muted)]" />
                <p className="mt-3 font-medium text-foreground">
                  {steps.length - previewLimit} {A.lockedNote}
                </p>
                <Link href={`/payments?assessment=${id}&plan=PROFESSIONAL`} className="mt-4 inline-block">
                  <Button>{A.unlock}</Button>
                </Link>
              </div>
            )}
          </div>

          <DisclaimerBanner locale={locale} />
          <p className="text-xs leading-relaxed text-[var(--muted)]">
            {locale === "ar" ? DISCLAIMER_AR : DISCLAIMER_EN}
          </p>
        </div>
      </DashboardShell>
    </div>
  );
}
