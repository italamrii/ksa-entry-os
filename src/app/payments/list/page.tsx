import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/layout/site-header";
import { DashboardShell } from "@/components/layout/dashboard-nav";
import { Badge } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export default async function PaymentsListPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const locale = (user.locale as Locale) ?? "en";
  const payments = await prisma.payment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { request: true },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader locale={locale} isAuthenticated isAdmin={user.role === "ADMIN"} />
      <DashboardShell locale={locale} isAdmin={user.role === "ADMIN"} currentPath="/payments" companyName={user.companyName}>
        <div className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-overline">{t(locale, "Billing", "الفوترة")}</p>
              <h1 className="font-display text-2xl font-semibold text-foreground">
                {t(locale, "Payments", "المدفوعات")}
              </h1>
            </div>
            <Link href="/payments?plan=PROFESSIONAL" className="text-sm text-[var(--accent-bright)] hover:underline">
              {t(locale, "New payment", "دفعة جديدة")}
            </Link>
          </div>

          {payments.length === 0 ? (
            <div className="surface-strip rounded-[var(--radius-md)] text-center text-sm text-[var(--muted)]">
              {t(locale, "No payments yet", "لا توجد مدفوعات")}
            </div>
          ) : (
            <ul className="surface-panel overflow-hidden rounded-[var(--radius-lg)] divide-y divide-[var(--border-subtle)]">
              {payments.map((payment) => (
                <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{payment.invoiceNumber}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {payment.amount} {payment.currency} · {formatDate(payment.createdAt, locale)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={payment.status === "PAID" ? "success" : payment.status === "FAILED" ? "danger" : "warning"}>
                      {payment.status}
                    </Badge>
                    <Link href={`/payments/${payment.id}`} className="text-sm text-[var(--accent-bright)] hover:underline">
                      {t(locale, "View status", "عرض الحالة")}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DashboardShell>
    </div>
  );
}
