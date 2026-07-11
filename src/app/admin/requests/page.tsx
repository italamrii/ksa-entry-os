import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/layout/site-header";
import { DashboardShell } from "@/components/layout/dashboard-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
          <h1 className="text-2xl font-bold text-white">Requests</h1>
          {requests.map((req) => (
            <Card key={req.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">{req.user.companyName ?? req.user.name}</CardTitle>
                <Badge>{req.status}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400">{req.user.email}</p>
                <p className="text-sm text-slate-500">Plan: {req.plan}</p>
                {req.payments[0] && (
                  <p className="text-xs text-slate-600">
                    {req.payments[0].invoiceNumber} — {req.payments[0].amount} {req.payments[0].currency} ({req.payments[0].status})
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardShell>
    </div>
  );
}
