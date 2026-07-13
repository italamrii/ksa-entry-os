import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/layout/site-header";
import { DashboardShell } from "@/components/layout/dashboard-nav";
import { Badge } from "@/components/ui/input";

export default async function AdminRequestsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  const requests = await prisma.reportRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true, companyName: true } },
      payments: true,
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader isAuthenticated isAdmin />
      <DashboardShell locale="en" isAdmin currentPath="/admin">
        <div className="space-y-6">
          <div>
            <p className="text-overline">Admin</p>
            <h1 className="font-display text-2xl font-semibold text-foreground">Requests</h1>
          </div>
          <ul className="surface-panel overflow-hidden rounded-[var(--radius-lg)] divide-y divide-[var(--border-subtle)]">
            {requests.map((req) => (
              <li key={req.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{req.user.companyName ?? req.user.name}</p>
                  <p className="text-sm text-[var(--muted)]">{req.user.email}</p>
                  <p className="text-sm text-[var(--muted)]">Plan: {req.plan}</p>
                  {req.payments[0] && (
                    <p className="text-caption">
                      {req.payments[0].invoiceNumber} — {req.payments[0].amount} {req.payments[0].currency} ({req.payments[0].status})
                    </p>
                  )}
                </div>
                <Badge>{req.status}</Badge>
              </li>
            ))}
          </ul>
        </div>
      </DashboardShell>
    </div>
  );
}
