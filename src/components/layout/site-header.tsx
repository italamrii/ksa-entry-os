import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { LogoLockup, LogoMark } from "@/components/brand/logo";
import type { Locale } from "@/lib/i18n";
import { nav, t } from "@/lib/i18n";
import { localeHref } from "@/lib/i18n/locale-utils";
import { LocaleSwitch } from "@/components/layout/locale-switch";

interface SiteHeaderProps {
  locale?: Locale;
  isAuthenticated?: boolean;
  isAdmin?: boolean;
}

export function SiteHeader({ locale = "en", isAuthenticated = false, isAdmin = false }: SiteHeaderProps) {
  const n = nav[locale];
  const dir = locale === "ar" ? "rtl" : "ltr";

  const navLink = (href: string, label: string) => (
    <Link
      href={localeHref(href, locale)}
      className="text-sm font-medium text-[var(--muted)] transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
    >
      {label}
    </Link>
  );

  return (
    <header
      dir={dir}
      className="sticky top-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--glass)] backdrop-blur-xl"
    >
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href={localeHref("/", locale)} className="rounded-[var(--radius-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_45%,transparent)]">
          <LogoLockup
            tagline={t(locale, "Market Entry Intelligence", "ذكاء دخول السوق")}
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLink("/", n.home)}
          {navLink("/pricing", n.pricing)}
          {isAuthenticated && (
            <>
              {navLink("/dashboard", n.dashboard)}
              {isAdmin && navLink("/admin", n.admin)}
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <LocaleSwitch />
          {isAuthenticated ? (
            <form action={localeHref("/api/auth/logout", locale)} method="POST">
              <Button type="submit" variant="ghost" size="sm">
                {n.logout}
              </Button>
            </form>
          ) : (
            <>
              <Link href={localeHref("/login", locale)}>
                <Button variant="ghost" size="sm">
                  {n.login}
                </Button>
              </Link>
              <Link href={localeHref("/register", locale)}>
                <Button size="sm">{n.register}</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ locale = "en" }: { locale?: Locale }) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const linkClass = "hover:text-[var(--highlight)] transition";
  return (
    <footer dir={dir} className="border-t border-[var(--border-subtle)] bg-[var(--surface-muted)]/30">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <LogoMark className="h-9 w-9" />
              <p className="font-semibold text-foreground">{APP_NAME}</p>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--muted)]">
              {t(
                locale,
                "Executive-grade advisory navigation for companies entering the Saudi market — structured roadmaps, official links, and compliance awareness.",
                "منصة إرشادية تنفيذية للشركات الداخلة إلى السوق السعودي — خرائط طريق مهيكلة وروابط رسمية ووعي بالامتثال."
              )}
            </p>
          </div>
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground/70">
              {t(locale, "Legal", "قانوني")}
            </p>
            <ul className="space-y-2.5 text-sm text-[var(--muted)]">
              <li>
                <Link href={localeHref("/legal/terms", locale)} className={linkClass}>
                  {t(locale, "Terms of Use", "شروط الاستخدام")}
                </Link>
              </li>
              <li>
                <Link href={localeHref("/legal/privacy", locale)} className={linkClass}>
                  {t(locale, "Privacy Policy", "سياسة الخصوصية")}
                </Link>
              </li>
              <li>
                <Link href={localeHref("/legal/disclaimer", locale)} className={linkClass}>
                  {t(locale, "Disclaimer", "إخلاء المسؤولية")}
                </Link>
              </li>
              <li>
                <Link href={localeHref("/legal/data-deletion", locale)} className={linkClass}>
                  {t(locale, "Data Deletion", "حذف البيانات")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground/70">
              {t(locale, "Platform", "المنصة")}
            </p>
            <ul className="space-y-2.5 text-sm text-[var(--muted)]">
              <li>
                <Link href={localeHref("/pricing", locale)} className={linkClass}>
                  {t(locale, "Pricing", "الأسعار")}
                </Link>
              </li>
              <li>
                <Link href={localeHref("/register", locale)} className={linkClass}>
                  {t(locale, "Get Started", "ابدأ الآن")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-10 text-xs text-[var(--muted)]">
          © {new Date().getFullYear()} {APP_NAME}.{" "}
          {t(
            locale,
            "Not a government entity. Not legal, tax, or licensed advisory advice.",
            "ليست جهة حكومية. لا تُعد استشارة قانونية أو ضريبية أو مرخّصة."
          )}
        </p>
      </div>
    </footer>
  );
}

export function DisclaimerBanner({ locale = "en" }: { locale?: Locale }) {
  return (
    <p className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-muted)]/60 px-3 py-2 text-xs leading-relaxed text-[var(--muted)]">
      {t(
        locale,
        "Informational guidance only. Verify all requirements with official authorities or licensed advisors.",
        "إرشاد معلوماتي فقط. تحقّق من جميع المتطلبات عبر الجهات الرسمية أو المستشارين المرخّصين."
      )}
    </p>
  );
}
