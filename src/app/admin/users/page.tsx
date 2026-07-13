import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/layout/site-header";
import { DashboardShell } from "@/components/layout/dashboard-nav";
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
          <div>
            <p className="text-overline">Admin</p>
            <h1 className="font-display text-2xl font-semibold text-foreground">Users</h1>
          </div>
          <ul className="surface-panel overflow-hidden rounded-[var(--radius-lg)] divide-y divide-[var(--border-subtle)]">
            {users.map((user) => (
              <li key={user.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{user.name}</p>
                  <p className="text-sm text-[var(--muted)]">{user.email}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {user.companyName} — {user.country}
                  </p>
                  {user.sector && <p className="text-caption">{user.sector.nameEn}</p>}
                </div>
                <Badge variant={user.role === "ADMIN" ? "success" : "default"}>{user.role}</Badge>
              </li>
            ))}
          </ul>
        </div>
      </DashboardShell>
    </div>
  );
}
