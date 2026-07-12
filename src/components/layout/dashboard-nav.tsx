import Link from "next/link";
import { LayoutDashboard, FileSearch, CreditCard, Settings, Shield, ClipboardList, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

const links = [
  { href: "/workspace", icon: Compass, labelEn: "Workspace", labelAr: "مساحة العمل" },
  { href: "/dashboard", icon: LayoutDashboard, labelEn: "Dashboard", labelAr: "لوحة التحكم" },
  { href: "/assessment/new", icon: FileSearch, labelEn: "New Assessment", labelAr: "تقييم جديد" },
  { href: "/requests", icon: ClipboardList, labelEn: "Entry Reports", labelAr: "تقارير الدخول" },
  { href: "/payments/list", icon: CreditCard, labelEn: "Payments", labelAr: "المدفوعات" },
  { href: "/settings", icon: Settings, labelEn: "Settings", labelAr: "الإعدادات" },
];

export function DashboardNav({
  locale,
  isAdmin,
  currentPath,
}: {
  locale: Locale;
  isAdmin?: boolean;
  currentPath: string;
}) {
  const allLinks = isAdmin
    ? [...links, { href: "/admin", icon: Shield, labelEn: "Admin", labelAr: "الإدارة" }]
    : links;

  return (
    <nav className="flex flex-col gap-1">
      {allLinks.map((link) => {
        const Icon = link.icon;
        const active = currentPath.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-[var(--radius-md)] px-3.5 py-2.5 text-sm font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_45%,transparent)]",
              active
                ? "bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent-bright)] ring-1 ring-[color-mix(in_srgb,var(--accent)_22%,transparent)]"
                : "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {t(locale, link.labelEn, link.labelAr)}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({
  locale,
  isAdmin,
  currentPath,
  children,
}: {
  locale: Locale;
  isAdmin?: boolean;
  currentPath: string;
  children: React.ReactNode;
}) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <div dir={dir} className="mx-auto flex max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="surface-panel sticky top-24 rounded-[var(--radius-lg)] p-3">
          <DashboardNav locale={locale} isAdmin={isAdmin} currentPath={currentPath} />
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
