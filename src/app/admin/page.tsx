import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/layout/site-header";
import { DashboardShell } from "@/components/layout/dashboard-nav";
import { Users, FileText, ClipboardList, Link2, Layers, Shield } from "lucide-react";

export default async function AdminDashboardPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  const [userCount, paidCount, pendingRequests, sectorStats, recentAssessments, recentLogs] =
    await Promise.all([
      prisma.user.count(),
      prisma.payment.count({ where: { status: "PAID" } }),
      prisma.reportRequest.count({ where: { status: "PENDING" } }),
      prisma.sector.findMany({
        include: { _count: { select: { users: true } } },
        orderBy: { users: { _count: "desc" } },
        take: 5,
      }),
      prisma.assessment.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, companyName: true } } },
      }),
      prisma.auditLog.findMany({ take: 10, orderBy: { createdAt: "desc" } }),
    ]);

  const adminLinks = [
    { href: "/admin/users", icon: Users, label: "Users" },
    { href: "/admin/requests", icon: ClipboardList, label: "Requests" },
    { href: "/admin/links", icon: Link2, label: "Official Links" },
    { href: "/admin/sectors", icon: Layers, label: "Sectors" },
    { href: "/admin/requirements", icon: FileText, label: "Requirements" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader isAuthenticated isAdmin />
      <DashboardShell locale="en" isAdmin currentPath="/admin">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-[var(--accent-bright)]" aria-hidden />
            <div>
              <p className="text-overline">Operations</p>
              <h1 className="font-display text-2xl font-semibold text-foreground">Admin console</h1>
            </div>
          </div>

          <div className="decision-band grid gap-0 sm:grid-cols-3">
            <div className="px-5 py-4">
              <p className="text-caption">Total users</p>
              <p className="text-metric mt-1 text-2xl font-semibold text-foreground">{userCount}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-caption">Paid requests</p>
              <p className="text-metric mt-1 text-2xl font-semibold text-[var(--accent-bright)]">{paidCount}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-caption">Pending requests</p>
              <p className="text-metric mt-1 text-2xl font-semibold text-[var(--warning)]">{pendingRequests}</p>
            </div>
          </div>

          <nav aria-label="Admin areas" className="flex flex-wrap gap-2">
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-2 text-sm font-medium text-foreground transition hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] hover:text-[var(--accent-bright)]"
              >
                <link.icon className="h-4 w-4 text-[var(--accent-bright)]" aria-hidden />
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="surface-panel overflow-hidden rounded-[var(--radius-lg)]">
              <div className="border-b border-[var(--border-subtle)] px-5 py-3">
                <h2 className="text-sm font-semibold text-foreground">Top sectors</h2>
              </div>
              <ul className="divide-y divide-[var(--border-subtle)]">
                {sectorStats.map((s) => (
                  <li key={s.id} className="flex justify-between px-5 py-3 text-sm">
                    <span className="text-foreground/90">{s.nameEn}</span>
                    <span className="text-metric text-[var(--muted)]">{s._count.users}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="surface-panel overflow-hidden rounded-[var(--radius-lg)]">
              <div className="border-b border-[var(--border-subtle)] px-5 py-3">
                <h2 className="text-sm font-semibold text-foreground">Recent assessments</h2>
              </div>
              <ul className="divide-y divide-[var(--border-subtle)]">
                {recentAssessments.map((a) => (
                  <li key={a.id} className="px-5 py-3 text-sm">
                    <p className="text-foreground/90">{a.user.companyName ?? a.user.name}</p>
                    <p className="text-caption">{a.createdAt.toLocaleDateString()}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="surface-panel overflow-hidden rounded-[var(--radius-lg)]">
            <div className="border-b border-[var(--border-subtle)] px-5 py-3">
              <h2 className="text-sm font-semibold text-foreground">Audit logs</h2>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {recentLogs.map((log) => (
                <div key={log.id} className="border-b border-[var(--border-subtle)] px-5 py-2 text-xs last:border-0">
                  <span className="text-[var(--accent-bright)]">{log.action}</span>
                  <span className="mx-2 text-[var(--muted)]">|</span>
                  <span className="text-[var(--muted)]">{log.createdAt.toISOString()}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </DashboardShell>
    </div>
  );
}
