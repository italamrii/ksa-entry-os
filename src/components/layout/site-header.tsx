import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { nav, t } from "@/lib/i18n";
import { localeHref } from "@/lib/i18n/locale-utils";
import { cn } from "@/lib/utils";

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
      className="text-sm font-medium text-[var(--muted)] transition hover:text-foreground"
    >
      {label}
    </Link>
  );

  return (
    <header
      dir={dir}
      className="sticky top-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--background)]/85 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href={localeHref("/", locale)} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-xs font-bold text-white shadow-lg shadow-teal-600/20">
            KSA
          </div>
          <div className="hidden sm:block">
            <span className="block text-sm font-semibold text-foreground">{APP_NAME}</span>
            <span className="block text-[10px] text-[var(--muted)]">
              {t(locale, "Market Entry Intelligence", "ذكاء دخول السوق")}
            </span>
          </div>
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
          <Link
            href={locale === "ar" ? localeHref("/", "en") : localeHref("/", "ar")}
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
              "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-teal-400"
            )}
          >
            {locale === "ar" ? "EN" : "عربي"}
          </Link>
          {isAuthenticated ? (
            <form action="/api/auth/logout" method="POST">
              <Button type="submit" variant="ghost" size="sm">{n.logout}</Button>
            </form>
          ) : (
            <>
              <Link href={localeHref("/login", locale)}>
                <Button variant="ghost" size="sm">{n.login}</Button>
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
  return (
    <footer dir={dir} className="border-t border-[var(--border-subtle)] bg-[var(--surface-muted)]/30">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="font-semibold text-foreground">{APP_NAME}</p>
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
              <li><Link href={localeHref("/legal/terms", locale)} className="hover:text-teal-400">{t(locale, "Terms of Use", "شروط الاستخدام")}</Link></li>
              <li><Link href={localeHref("/legal/privacy", locale)} className="hover:text-teal-400">{t(locale, "Privacy Policy", "سياسة الخصوصية")}</Link></li>
              <li><Link href={localeHref("/legal/disclaimer", locale)} className="hover:text-teal-400">{t(locale, "Disclaimer", "إخلاء المسؤولية")}</Link></li>
              <li><Link href={localeHref("/legal/data-deletion", locale)} className="hover:text-teal-400">{t(locale, "Data Deletion", "حذف البيانات")}</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground/70">
              {t(locale, "Platform", "المنصة")}
            </p>
            <ul className="space-y-2.5 text-sm text-[var(--muted)]">
              <li><Link href={localeHref("/pricing", locale)} className="hover:text-teal-400">{t(locale, "Pricing", "الأسعار")}</Link></li>
              <li><Link href={localeHref("/register", locale)} className="hover:text-teal-400">{t(locale, "Get Started", "ابدأ الآن")}</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-[var(--border-subtle)] pt-8">
          <p className="text-xs leading-relaxed text-[var(--muted)]">
            {t(
              locale,
              "Not a government entity, law firm, or tax advisor. General guidance from public official sources only.",
              "ليست جهة حكومية ولا مكتب محاماة ولا مستشارًا ضريبيًا. إرشادات عامة من مصادر رسمية متاحة فقط."
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}

export function DisclaimerBanner({ locale = "en" }: { locale?: Locale }) {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
      <p className="text-xs leading-relaxed text-amber-200/90">
        {t(
          locale,
          "General guidance only — not legal, tax, or regulatory advice. Verify with official authorities or licensed advisors.",
          "إرشادات عامة فقط — ليست استشارة قانونية أو ضريبية أو تنظيمية. يُرجى التحقق من الجهات الرسمية أو المستشارين المرخصين."
        )}
      </p>
    </div>
  );
}
