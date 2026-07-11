import { SiteHeader, SiteFooter, DisclaimerBanner } from "@/components/layout/site-header";
import { DISCLAIMER_EN, DISCLAIMER_AR } from "@/lib/constants";

interface LegalPageProps {
  titleEn: string;
  titleAr: string;
  children: React.ReactNode;
  locale?: "en" | "ar";
}

export function LegalPageLayout({ titleEn, titleAr, children, locale = "en" }: LegalPageProps) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const title = locale === "ar" ? titleAr : titleEn;

  return (
    <div dir={dir} className="flex min-h-screen flex-col">
      <SiteHeader locale={locale} />
      <main className="mx-auto max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold text-white">{title}</h1>
        <div className="prose prose-invert mt-8 max-w-none space-y-4 text-sm leading-relaxed text-slate-300">
          {children}
        </div>
        <div className="mt-8 space-y-4">
          <DisclaimerBanner locale={locale} />
          <p className="text-xs text-slate-500">{locale === "ar" ? DISCLAIMER_AR : DISCLAIMER_EN}</p>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
