import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/layout/site-header";
import { DashboardShell } from "@/components/layout/dashboard-nav";
import { Badge } from "@/components/ui/input";
import { SubscriptionControls } from "./subscription-controls";

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
      memberships: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: {
          role: true,
          organization: {
            select: {
              id: true,
              name: true,
              subscriptions: {
                where: { status: "ACTIVE" },
                orderBy: { createdAt: "desc" },
                take: 1,
                select: { plan: true, status: true, currentPeriodEnd: true },
              },
            },
          },
        },
      },
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
            <p className="mt-1 text-sm text-[var(--muted)]">
              Organization subscriptions are granted here; entitlements follow the active plan.
            </p>
          </div>
          <ul className="surface-panel overflow-hidden rounded-[var(--radius-lg)] divide-y divide-[var(--border-subtle)]">
            {users.map((user) => {
              const membership = user.memberships[0] ?? null;
              const org = membership?.organization ?? null;
              const sub = org?.subscriptions[0] ?? null;
              return (
                <li key={user.id} className="space-y-3 px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-sm text-[var(--muted)]">{user.email}</p>
                      <p className="text-sm text-[var(--muted)]">
                        {user.companyName} — {user.country}
                      </p>
                      {user.sector && <p className="text-caption">{user.sector.nameEn}</p>}
                      {org && (
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Org: <span className="text-foreground">{org.name}</span>
                          {membership && ` (${membership.role})`}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={user.role === "ADMIN" ? "success" : "default"}>{user.role}</Badge>
                      {sub ? (
                        <Badge variant="success">
                          {sub.plan} · {sub.status}
                          {sub.currentPeriodEnd
                            ? ` · until ${sub.currentPeriodEnd.toISOString().slice(0, 10)}`
                            : ""}
                        </Badge>
                      ) : (
                        <Badge variant="default">No subscription</Badge>
                      )}
                    </div>
                  </div>
                  {org && (
                    <SubscriptionControls
                      targetUserId={user.id}
                      userLabel={user.email}
                      currentPlan={sub?.plan ?? null}
                      currentStatus={sub?.status ?? null}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </DashboardShell>
    </div>
  );
}
