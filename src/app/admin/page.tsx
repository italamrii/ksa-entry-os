import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/layout/site-header";
import { DashboardShell } from "@/components/layout/dashboard-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader><CardTitle className="text-base">Total Users</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold text-white">{userCount}</p></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Paid Requests</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold text-emerald-400">{paidCount}</p></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Pending Requests</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold text-amber-400">{pendingRequests}</p></CardContent>
            </Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {adminLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Card className="transition hover:border-emerald-500/50">
                  <CardContent className="flex items-center gap-3 p-4">
                    <link.icon className="h-5 w-5 text-emerald-400" />
                    <span className="font-medium text-white">{link.label}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Top Sectors</CardTitle></CardHeader>
              <CardContent>
                {sectorStats.map((s) => (
                  <div key={s.id} className="flex justify-between py-2 text-sm">
                    <span className="text-slate-300">{s.nameEn}</span>
                    <span className="text-slate-500">{s._count.users}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Recent Assessments</CardTitle></CardHeader>
              <CardContent>
                {recentAssessments.map((a) => (
                  <div key={a.id} className="py-2 text-sm">
                    <p className="text-slate-300">{a.user.companyName ?? a.user.name}</p>
                    <p className="text-slate-500">{a.createdAt.toLocaleDateString()}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Audit Logs</CardTitle></CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto">
                {recentLogs.map((log) => (
                  <div key={log.id} className="border-b border-slate-800 py-2 text-xs">
                    <span className="text-emerald-400">{log.action}</span>
                    <span className="mx-2 text-slate-600">|</span>
                    <span className="text-slate-500">{log.createdAt.toISOString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    </div>
  );
}
