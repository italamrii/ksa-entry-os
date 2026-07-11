import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/layout/site-header";
import { DashboardShell } from "@/components/layout/dashboard-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/input";

export default async function AdminUsersPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      companyName: true,
      country: true,
      role: true,
      createdAt: true,
      sector: { select: { nameEn: true } },
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader isAuthenticated isAdmin />
      <DashboardShell locale="en" isAdmin currentPath="/admin">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <div className="space-y-3">
            {users.map((user) => (
              <Card key={user.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">{user.name}</CardTitle>
                  <Badge variant={user.role === "ADMIN" ? "success" : "default"}>{user.role}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-400">{user.email}</p>
                  <p className="text-sm text-slate-500">{user.companyName} — {user.country}</p>
                  {user.sector && <p className="text-xs text-slate-600">{user.sector.nameEn}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardShell>
    </div>
  );
}
