import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { SiteHeader, SiteFooter, DisclaimerBanner } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader } from "@/components/marketing/section";
import { PremiumCard } from "@/components/marketing/premium-card";
import { Reveal } from "@/components/marketing/reveal";
import { PRICING } from "@/lib/constants";
import { getLanding, landingContent } from "@/lib/i18n/content";
import { getLocaleFromSearch, localeHref } from "@/lib/i18n/locale-utils";
import type { Locale } from "@/lib/i18n";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const params = await searchParams;
  const locale = getLocaleFromSearch(params.lang) as Locale;
  const dir = locale === "ar" ? "rtl" : "ltr";
  const L = getLanding(locale);

  return (
    <div dir={dir} className="flex min-h-screen flex-col">
      <SiteHeader locale={locale} />
      <main className="flex-1">
        <Section className="!pt-16">
          <Reveal>
            <SectionHeader title={L.pricing.title} subtitle={L.pricing.subtitle} />
          </Reveal>
          <div className="grid gap-6 lg:grid-cols-3">
            {(["FREE", "PROFESSIONAL", "BUSINESS"] as const).map((key, i) => {
              const planContent = landingContent.pricing.plans[key];
              const plan = PRICING[key];
              const isFeatured = key === "PROFESSIONAL";
              const name = locale === "ar" ? planContent.name.ar : planContent.name.en;
              const tagline = locale === "ar" ? planContent.tagline.ar : planContent.tagline.en;
              const features = locale === "ar" ? planContent.features.ar : planContent.features.en;
              const cta =
                key === "FREE" ? L.pricing.free : key === "PROFESSIONAL" ? L.pricing.choose : L.pricing.business;

              return (
                <Reveal key={key} delay={i * 100}>
                  <PremiumCard
                    title={name}
                    description={tagline}
                    badge={isFeatured ? L.pricing.popular : undefined}
                    variant={isFeatured ? "featured" : "default"}
                    className={`hover-lift h-full ${isFeatured ? "lg:-mt-2" : ""}`}
                    footer={
                      <div>
                        <p className="mb-5">
                          <span className="text-4xl font-bold text-foreground">
                            {plan.price === 0 ? (locale === "ar" ? "مجاني" : "Free") : plan.price}
                          </span>
                          {plan.price > 0 && <span className="ms-2 text-base text-[var(--muted)]">{plan.currency}</span>}
                        </p>
                        <ul className="mb-6 space-y-3">
                          {features.map((f) => (
                            <li key={f} className="flex items-start gap-2.5 text-sm text-[var(--muted)]">
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
                              {f}
                            </li>
                          ))}
                        </ul>
                        <Link href={localeHref(key === "FREE" ? "/register" : "/payments", locale)}>
                          <Button className={`w-full ${isFeatured ? "cta-glow" : ""}`} variant={isFeatured ? "default" : "outline"} size="lg">
                            {cta}
                          </Button>
                        </Link>
                      </div>
                    }
                  />
                </Reveal>
              );
            })}
          </div>
          <div className="mx-auto mt-14 max-w-2xl">
            <DisclaimerBanner locale={locale} />
          </div>
        </Section>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
