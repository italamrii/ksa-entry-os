import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/layout/site-header";
import { evaluateAssessment, buildEvaluationView } from "@/lib/rules/service";
import { buildWorkspaceViewModel } from "@/lib/view-models/adapters";
import type { EvaluationViewInput, Locale, WorkspaceContext } from "@/lib/view-models/types";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { NoAssessmentState, ErrorState } from "@/components/workspace/states";
import { AppShell } from "@/components/layout/app-shell";

export const runtime = "nodejs";

export default async function WorkspacePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboardingDone) redirect("/onboarding");

  const locale = (user.locale as Locale) ?? "en";
  const context: WorkspaceContext = {
    companyName: user.companyName,
    country: user.country,
    companyType: user.companyType,
    entryGoal: user.entryGoal,
    hasAssessment: false,
  };

  const [assessment, paidPayment] = await Promise.all([
    prisma.assessment.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    }),
    prisma.payment.findFirst({ where: { userId: user.id, status: "PAID" }, select: { id: true } }),
  ]);
  context.hasAssessment = Boolean(assessment);

  let vm: ReturnType<typeof buildWorkspaceViewModel> | null = null;
  let evaluationFailed = false;
  if (assessment) {
    try {
      const { result } = await evaluateAssessment({ id: user.id }, assessment.id);
      const view = await buildEvaluationView(result);
      vm = buildWorkspaceViewModel(view as unknown as EvaluationViewInput, context, locale);
    } catch {
      evaluationFailed = true;
    }
  }

  let body: React.ReactNode;
  if (!assessment) {
    body = (
      <AppShell locale={locale} isAdmin={user.role === "ADMIN"} currentPath="/workspace" companyName={user.companyName}>
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <NoAssessmentState locale={locale} />
        </div>
      </AppShell>
    );
  } else if (evaluationFailed || !vm) {
    body = (
      <AppShell locale={locale} isAdmin={user.role === "ADMIN"} currentPath="/workspace" companyName={user.companyName}>
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <ErrorState locale={locale} />
        </div>
      </AppShell>
    );
  } else {
    body = (
      <WorkspaceShell
        vm={vm}
        assessmentId={assessment.id}
        canExport={Boolean(paidPayment)}
        isAdmin={user.role === "ADMIN"}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader locale={locale} isAuthenticated isAdmin={user.role === "ADMIN"} />
      {body}
    </div>
  );
}
