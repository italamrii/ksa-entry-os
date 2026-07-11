import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/layout/site-header";
import { DashboardShell } from "@/components/layout/dashboard-nav";
import { EntryReportCard, EntryReportsEmpty } from "@/components/requests/entry-report-card";
import { getRequests } from "@/lib/i18n/content";
import type { Locale } from "@/lib/i18n";
import { userHasVerifiedPaidAccess } from "@/lib/payments/entitlement";

export default async function RequestsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const locale = (user.locale as Locale) ?? "en";
  const R = getRequests(locale);

  const requests = await prisma.reportRequest.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      payments: true,
      assessment: { include: { steps: true } },
    },
  });

  const sector = user.sectorId
    ? await prisma.sector.findUnique({ where: { id: user.sectorId } })
    : null;

  const hasPaid = await userHasVerifiedPaidAccess(user.id);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader locale={locale} isAuthenticated isAdmin={user.role === "ADMIN"} />
      <DashboardShell locale={locale} isAdmin={user.role === "ADMIN"} currentPath="/requests">
        <div className="space-y-8">
          <div>
            <h1 className="text-headline text-foreground">{R.title}</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">{R.subtitle}</p>
          </div>

          {requests.length === 0 ? (
            <EntryReportsEmpty locale={locale} />
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <EntryReportCard
                  key={req.id}
                  locale={locale}
                  request={req}
                  companyName={user.companyName ?? user.name}
                  sectorName={sector?.nameEn}
                  entryGoal={user.entryGoal}
                  hasPaidReport={!!hasPaid && !!req.assessmentId}
                />
              ))}
            </div>
          )}
        </div>
      </DashboardShell>
    </div>
  );
}
