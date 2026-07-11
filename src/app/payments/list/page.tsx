import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/layout/site-header";
import { DashboardShell } from "@/components/layout/dashboard-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <DashboardShell locale={locale} isAdmin={user.role === "ADMIN"} currentPath="/payments">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">{t(locale, "Payments", "المدفوعات")}</h1>
            <Link href="/payments?plan=PROFESSIONAL" className="text-sm text-emerald-400 hover:underline">
              {t(locale, "New payment", "دفعة جديدة")}
            </Link>
          </div>

          {payments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-slate-400">
                {t(locale, "No payments yet", "لا توجد مدفوعات")}
              </CardContent>
            </Card>
          ) : (
            payments.map((payment) => (
              <Card key={payment.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">{payment.invoiceNumber}</CardTitle>
                  <Badge variant={payment.status === "PAID" ? "success" : payment.status === "FAILED" ? "danger" : "warning"}>
                    {payment.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-white">{payment.amount} {payment.currency}</p>
                  <p className="text-sm text-slate-400">{formatDate(payment.createdAt, locale)}</p>
                  <Link href={`/payments/${payment.id}`} className="mt-2 inline-block text-sm text-emerald-400">
                    {t(locale, "View status", "عرض الحالة")}
                  </Link>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DashboardShell>
    </div>
  );
}
