"use client";

import Link from "next/link";
import {
  Compass,
  LayoutDashboard,
  FileSearch,
  ClipboardList,
  CreditCard,
  Settings,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { LogoMark } from "@/components/brand/logo";
import { APP_NAME } from "@/lib/constants";

const LINKS: { href: string; icon: LucideIcon; labelEn: string; labelAr: string }[] = [
  { href: "/workspace", icon: Compass, labelEn: "Workspace", labelAr: "مساحة العمل" },
  { href: "/dashboard", icon: LayoutDashboard, labelEn: "Overview", labelAr: "نظرة عامة" },
  { href: "/assessment/new", icon: FileSearch, labelEn: "Assessment", labelAr: "التقييم" },
  { href: "/requests", icon: ClipboardList, labelEn: "Reports", labelAr: "التقارير" },
  { href: "/payments/list", icon: CreditCard, labelEn: "Payments", labelAr: "المدفوعات" },
  { href: "/settings", icon: Settings, labelEn: "Settings", labelAr: "الإعدادات" },
];

/**
 * AppShell — spatial product frame: slim decision rail + main stage.
 * Replaces the generic dashboard-sidebar + card-column composition.
 */
export function AppShell({
  locale,
  isAdmin,
  currentPath,
  companyName,
  children,
  stageClassName,
}: {
  locale: Locale;
  isAdmin?: boolean;
  currentPath: string;
  companyName?: string | null;
  children: React.ReactNode;
  stageClassName?: string;
}) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const links = isAdmin
    ? [...LINKS, { href: "/admin", icon: Shield, labelEn: "Admin", labelAr: "الإدارة" }]
    : LINKS;

  return (
    <div dir={dir} className="flex min-h-[calc(100vh-4.25rem)] w-full min-w-0">
      <aside
        aria-label={t(locale, "Product navigation", "تنقل المنتج")}
        className="sticky top-[4.25rem] hidden h-[calc(100vh-4.25rem)] w-[4.5rem] shrink-0 flex-col border-e border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--obsidian)_88%,transparent)] xl:flex xl:w-56"
      >
        <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-3 py-4 xl:px-4">
          <LogoMark className="h-9 w-9 shrink-0" />
          <div className="hidden min-w-0 xl:block">
            <p className="truncate text-xs font-semibold text-foreground">{APP_NAME}</p>
            <p className="truncate text-[10px] text-[var(--muted)]">
              {t(locale, "Decision workspace", "مساحة القرار")}
            </p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2 xl:p-3">
          {links.map((link) => {
            const Icon = link.icon;
            const active = currentPath.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                title={t(locale, link.labelEn, link.labelAr)}
                className={cn(
                  "group flex flex-col items-start gap-0.5 rounded-[var(--radius-md)] px-2.5 py-2.5 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_45%,transparent)] xl:px-3",
                  active
                    ? "bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--accent-bright)] shadow-[inset_2px_0_0_0_var(--accent)]"
                    : "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-foreground"
                )}
              >
                <span className="flex w-full items-center gap-3">
                  <Icon className="mx-auto h-4 w-4 shrink-0 xl:mx-0" aria-hidden />
                  <span className="hidden truncate xl:inline">{t(locale, link.labelEn, link.labelAr)}</span>
                </span>
                <span
                  className="hidden w-full truncate pe-0 ps-7 text-[10px] font-normal opacity-70 xl:block"
                  lang={locale === "en" ? "ar" : "en"}
                  dir={locale === "en" ? "rtl" : "ltr"}
                >
                  {locale === "en" ? link.labelAr : link.labelEn}
                </span>
              </Link>
            );
          })}
        </nav>

        {companyName && (
          <div className="hidden border-t border-[var(--border-subtle)] p-4 xl:block">
            <p className="truncate text-xs font-medium text-foreground">{companyName}</p>
            <p className="text-[10px] text-[var(--muted)]">
              {t(locale, "Organization workspace", "مساحة المنظمة")}
            </p>
          </div>
        )}
      </aside>

      {/* Mobile/tablet horizontal rail */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border-subtle)] bg-[var(--glass)] backdrop-blur-xl xl:hidden">
        <nav
          aria-label={t(locale, "Product navigation", "تنقل المنتج")}
          className="mx-auto flex max-w-lg items-stretch justify-around gap-1 px-2 py-1.5"
        >
          {links.slice(0, 5).map((link) => {
            const Icon = link.icon;
            const active = currentPath.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-[var(--radius-sm)] px-1 py-1.5 text-[10px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_45%,transparent)]",
                  active ? "text-[var(--accent-bright)]" : "text-[var(--muted)]"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span className="truncate">{t(locale, link.labelEn, link.labelAr)}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className={cn("min-w-0 flex-1 pb-20 xl:pb-0", stageClassName)}>{children}</div>
    </div>
  );
}

/** Back-compat shell used by existing pages — now frames through AppShell. */
export function DashboardShell({
  locale,
  isAdmin,
  currentPath,
  children,
  companyName,
}: {
  locale: Locale;
  isAdmin?: boolean;
  currentPath: string;
  children: React.ReactNode;
  companyName?: string | null;
}) {
  return (
    <AppShell locale={locale} isAdmin={isAdmin} currentPath={currentPath} companyName={companyName}>
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
    </AppShell>
  );
}

export function DashboardNav(props: {
  locale: Locale;
  isAdmin?: boolean;
  currentPath: string;
}) {
  // Kept for any residual imports; AppShell owns navigation.
  void props;
  return null;
}
