import Link from "next/link";
import { redirect } from "next/navigation";
import { localeHref, getLocaleFromSearch } from "@/lib/i18n/locale-utils";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  FileSearch,
  Download,
  CreditCard,
  ClipboardList,
  Bell,
  Activity,
  Link2,
  Compass,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/layout/site-header";
import { DashboardShell } from "@/components/layout/dashboard-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/input";
import { getDashboard } from "@/lib/i18n/content";
import { formatDate } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const urlLocale = getLocaleFromSearch((await searchParams).lang);
  const user = await getCurrentUser();
  if (!user) redirect(localeHref("/login", urlLocale));
  if (!user.onboardingDone) redirect(localeHref("/onboarding", (user.locale as "en" | "ar") ?? urlLocale));

  // Rendered locale comes from the URL (single source of truth for every page);
  // the DB preference only seeds ?lang= on the post-login redirect. This is what
  // makes the header language switcher actually change the page language.
  const locale: Locale = urlLocale;
  const D = getDashboard(locale);
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const [latestAssessment, activeRequests, latestPayment, assessmentCount] = await Promise.all([
    prisma.assessment.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { steps: true } } },
    }),
    prisma.reportRequest.findMany({
      where: { userId: user.id, status: { in: ["PENDING", "IN_REVIEW"] } },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.assessment.count({ where: { userId: user.id } }),
  ]);

  const hasPaid = latestPayment?.status === "PAID";
  const progressPct = latestAssessment
    ? Math.min(100, Math.round((latestAssessment._count.steps / 12) * 100))
    : 0;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader locale={locale} isAuthenticated isAdmin={user.role === "ADMIN"} />
      <DashboardShell locale={locale} isAdmin={user.role === "ADMIN"} currentPath="/dashboard" companyName={user.companyName}>
        <div className="space-y-8">
          <div className="surface-panel rounded-2xl p-6 lg:p-8">
            <p className="text-overline">{D.overline}</p>
            <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-headline text-foreground">{D.welcome}</h1>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {user.companyName} — {D.subtitle}
                </p>
              </div>
              <Link href={localeHref("/assessment/new", locale)}>
                <Button className="cta-glow gap-2">
                  <FileSearch className="h-4 w-4" />
                  {D.newAssessment}
                </Button>
              </Link>
            </div>
          </div>

          <div className="decision-band grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--border-subtle)] sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-[var(--card)] p-5">
              <p className="text-caption">{D.latestAssessment}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {latestAssessment ? `${latestAssessment._count.steps} ${D.roadmapSteps}` : D.noAssessment}
              </p>
              {latestAssessment ? (
                <Link href={`/assessment/${latestAssessment.id}`} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent-bright)]">
                  {D.viewRoadmap} <Arrow className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </div>
            <div className="bg-[var(--card)] p-5">
              <p className="text-caption">{D.progress}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                <div className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--highlight)]" style={{ width: `${progressPct}%` }} />
              </div>
              <p className="mt-2 text-xs text-[var(--muted)]">{progressPct}%</p>
            </div>
            <div className="bg-[var(--card)] p-5">
              <p className="text-caption">{D.activeReports}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{activeRequests.length}</p>
              <Link href={localeHref("/requests", locale)} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent-bright)]">
                {D.viewReports} <Arrow className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="bg-[var(--card)] p-5">
              <p className="text-caption">{D.paymentStatus}</p>
              <div className="mt-3">
                {latestPayment ? (
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={latestPayment.status === "PAID" ? "success" : "warning"}>{latestPayment.status}</Badge>
                    <span className="text-xs text-[var(--muted)]">{latestPayment.invoiceNumber}</span>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--muted)]">{D.noPayments}</p>
                )}
              </div>
            </div>
          </div>

          {!latestAssessment && (
            <div className="surface-panel rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
              <div className="flex items-start gap-4">
                <Compass className="h-8 w-8 shrink-0 text-emerald-400" />
                <div>
                  <h2 className="font-semibold text-foreground">{D.nextAction}</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">{D.nextActionDesc}</p>
                  <Link href={localeHref("/assessment/new", locale)} className="mt-4 inline-block">
                    <Button size="sm">{D.buildFirst}</Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <div>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">{D.quickActions}</h2>
              <div className="space-y-2">
                {[
                  { href: "/assessment/new", icon: FileSearch, label: D.newAssessment },
                  { href: "/requests", icon: ClipboardList, label: D.viewReports },
                  { href: "/payments/list", icon: CreditCard, label: D.paymentStatus },
                ].map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="surface-elevated hover-lift flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-foreground"
                  >
                    <action.icon className="h-4 w-4 text-emerald-400" />
                    {action.label}
                  </Link>
                ))}
                {latestAssessment && hasPaid && (
                  <a
                    href={`/api/assessments/${latestAssessment.id}/pdf`}
                    className="surface-elevated hover-lift flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-emerald-400"
                  >
                    <Download className="h-4 w-4" />
                    {D.downloadReport}
                  </a>
                )}
              </div>
            </div>

            <div className="space-y-6 lg:col-span-2">
              <div className="surface-panel rounded-2xl p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  <h2 className="text-sm font-semibold text-foreground">{D.recentActivity}</h2>
                </div>
                {assessmentCount === 0 ? (
                  <p className="text-sm text-[var(--muted)]">{D.startFirst}</p>
                ) : (
                  <div className="space-y-3">
                    {latestAssessment && (
                      <div className="flex items-center justify-between rounded-xl bg-[var(--surface-muted)]/50 px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{D.latestAssessment}</p>
                          <p className="text-xs text-[var(--muted)]">
                            {formatDate(latestAssessment.createdAt, locale)} · {latestAssessment._count.steps} {D.roadmapSteps}
                          </p>
                        </div>
                        <Link href={`/assessment/${latestAssessment.id}`}>
                          <Button variant="ghost" size="sm">{D.viewRoadmap}</Button>
                        </Link>
                      </div>
                    )}
                    {hasPaid && (
                      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">
                        <CheckCircle2 className="h-4 w-4" />
                        {D.reportReady}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="surface-panel rounded-2xl p-6">
                <div className="mb-3 flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-amber-400" />
                  <h2 className="text-sm font-semibold text-foreground">{D.linkCoverage}</h2>
                </div>
                <p className="text-sm text-[var(--muted)]">
                  {latestAssessment
                    ? `${latestAssessment._count.steps} ${D.roadmapSteps}`
                    : D.noAssessment}
                </p>
              </div>

              <div className="surface-panel rounded-2xl p-6">
                <div className="mb-3 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-amber-400" />
                  <h2 className="text-sm font-semibold text-foreground">{D.keyNotices}</h2>
                </div>
                <p className="text-sm leading-relaxed text-[var(--muted)]">{D.noticeDisclaimer}</p>
                <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
                  <p className="text-sm text-[var(--muted)]">{D.consultationNote}</p>
                  <Link href={localeHref("/requests", locale)} className="mt-3 inline-block">
                    <Button variant="outline" size="sm">{D.consultation}</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardShell>
    </div>
  );
}
