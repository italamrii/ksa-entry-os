import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Map,
  Link2,
  Shield,
  FileDown,
  Target,
  Layers,
  AlertTriangle,
  ListChecks,
} from "lucide-react";
import { SiteHeader, SiteFooter, DisclaimerBanner } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader } from "@/components/marketing/section";
import { PremiumCard } from "@/components/marketing/premium-card";
import { HeroPreview } from "@/components/marketing/hero-preview";
import { JourneyTimeline } from "@/components/marketing/journey-timeline";
import { Reveal } from "@/components/marketing/reveal";
import { SaudiTopo } from "@/components/brand/saudi-topo";
import { PRICING } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";
import { getLanding, landingContent } from "@/lib/i18n/content";
import { getLocaleFromSearch, localeHref } from "@/lib/i18n/locale-utils";
import type { Locale } from "@/lib/i18n";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const params = await searchParams;
  const locale = getLocaleFromSearch(params.lang) as Locale;
  const user = await getCurrentUser();
  const dir = locale === "ar" ? "rtl" : "ltr";
  const L = getLanding(locale);
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const provideIcons = [Map, Link2, Layers, FileDown, AlertTriangle, ListChecks];
  const whyIcons = [Target, Shield, Layers];

  return (
    <div dir={dir} className="flex min-h-screen flex-col">
      <SiteHeader locale={locale} isAuthenticated={!!user} isAdmin={user?.role === "ADMIN"} />

      <section className="hero-mesh relative overflow-hidden px-4 pb-8 pt-12 sm:px-6 lg:px-8 lg:pb-16 lg:pt-20">
        <SaudiTopo className="pointer-events-none absolute inset-y-0 end-[-8%] hidden w-[58%] opacity-35 lg:block" glow />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="text-overline mb-4">{L.hero.overline}</p>
            <h1 className="text-display text-foreground">{L.hero.title}</h1>
            <p className="text-subhead mt-6 text-[var(--muted)]">{L.hero.subtitle}</p>
            <p className="mt-4 text-sm text-[var(--muted)]/80">{L.hero.audience}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href={localeHref("/register", locale)}>
                <Button size="lg" className="cta-glow w-full gap-2 sm:w-auto">
                  {L.hero.ctaPrimary}
                  <Arrow className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={localeHref(user ? "/workspace" : "/#how-it-works", locale)}>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  {user ? (locale === "ar" ? "فتح مساحة العمل" : "Open workspace") : L.hero.ctaSecondary}
                </Button>
              </Link>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <HeroPreview locale={locale} />
          </Reveal>
        </div>
      </section>

      <div className="border-y border-[var(--border-subtle)] bg-[var(--surface-muted)]/40 px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3">
          {L.trustStrip.map((badge) => (
            <span key={badge} className="trust-badge">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/80" />
              {badge}
            </span>
          ))}
        </div>
      </div>

      <Section variant="default">
        <Reveal>
          <div className="grid items-start gap-12 lg:grid-cols-2">
            <SectionHeader align="left" title={L.problem.title} subtitle={L.problem.body} className="mb-0" />
            <div className="space-y-3">
              {L.problem.points.map((point, i) => (
                <Reveal key={point} delay={i * 80}>
                  <div className="hover-lift flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--card)] p-4">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                      <span className="h-2 w-2 rounded-full bg-red-400" />
                    </div>
                    <p className="text-sm font-semibold text-foreground/90">{point}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>
      </Section>

      <Section id="how-it-works" variant="muted">
        <Reveal>
          <SectionHeader title={L.howItWorks.title} subtitle={L.howItWorks.subtitle} />
        </Reveal>
        <ol className="relative space-y-0 lg:flex lg:items-stretch lg:gap-0">
          {L.howItWorks.steps.map((item, i) => (
            <Reveal key={item.step} delay={i * 100} className="lg:flex-1">
              <li className="relative border-b border-[var(--border-subtle)] py-5 pe-4 last:border-0 lg:border-b-0 lg:border-e lg:px-5 lg:py-0 last:lg:border-e-0">
                <p className="text-overline">{item.step}</p>
                <h3 className="mt-2 font-display text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">{item.desc}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </Section>

      <Section>
        <Reveal>
          <SectionHeader title={L.provides.title} subtitle={L.provides.subtitle} />
        </Reveal>
        <ul className="decision-band grid gap-0 sm:grid-cols-2 lg:grid-cols-3">
          {L.provides.cards.map((card, i) => {
            const Icon = provideIcons[i];
            return (
              <li key={card.title} className="flex gap-3 px-5 py-5">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-bright)]" aria-hidden />
                <div>
                  <h3 className="font-semibold text-foreground">{card.title}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">{card.desc}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section variant="bordered">
        <Reveal>
          <SectionHeader title={L.roadmapPreview.title} subtitle={L.roadmapPreview.subtitle} />
        </Reveal>
        <Reveal delay={100}>
          <JourneyTimeline locale={locale} />
        </Reveal>
      </Section>

      <Section variant="muted">
        <Reveal>
          <SectionHeader title={L.whyUse.title} />
        </Reveal>
        <ul className="grid gap-6 md:grid-cols-3">
          {L.whyUse.cards.map((card, i) => {
            const Icon = whyIcons[i];
            return (
              <li key={card.title} className="surface-strip rounded-[var(--radius-md)]">
                <Icon className="h-5 w-5 text-[var(--highlight)]" aria-hidden />
                <h3 className="mt-3 font-display text-lg font-semibold text-foreground">{card.title}</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">{card.desc}</p>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section>
        <Reveal>
          <SectionHeader title={L.sectors.title} subtitle={L.sectors.subtitle} />
        </Reveal>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {L.sectors.list.map((sector, i) => (
            <Reveal key={sector} delay={i * 40}>
              <div className="surface-elevated hover-lift rounded-xl px-4 py-4 text-center text-sm font-medium text-foreground/90">
                {sector}
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section id="pricing" variant="muted">
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
                      <p className="mb-4">
                        <span className="text-3xl font-bold text-foreground">
                          {plan.price === 0 ? (locale === "ar" ? "مجاني" : "Free") : plan.price}
                        </span>
                        {plan.price > 0 && <span className="ms-1 text-sm text-[var(--muted)]">{plan.currency}</span>}
                      </p>
                      <ul className="mb-5 space-y-2">
                        {features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <Link href={localeHref(key === "FREE" ? "/register" : "/payments", locale)}>
                        <Button className={`w-full ${isFeatured ? "cta-glow" : ""}`} variant={isFeatured ? "default" : "outline"}>
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
      </Section>

      <Section>
        <Reveal>
          <SectionHeader title={L.faq.title} />
        </Reveal>
        <div className="mx-auto max-w-3xl space-y-4">
          {L.faq.items.map((faq, i) => (
            <Reveal key={faq.q} delay={i * 60}>
              <div className="surface-elevated hover-lift rounded-2xl p-6">
                <h3 className="font-semibold text-foreground">{faq.q}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{faq.a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section variant="bordered" className="!pb-20">
        <Reveal>
          <div className="surface-panel relative overflow-hidden rounded-3xl p-8 text-center lg:p-14">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/8 via-transparent to-amber-500/8" />
            <div className="relative">
              <h2 className="text-headline text-foreground">{L.cta.title}</h2>
              <p className="text-subhead mx-auto mt-4 max-w-2xl text-[var(--muted)]">{L.cta.subtitle}</p>
              <Link href={localeHref("/register", locale)} className="mt-8 inline-block">
                <Button size="lg" className="cta-glow gap-2">
                  {L.cta.button}
                  <Arrow className="h-4 w-4" />
                </Button>
              </Link>
              <div className="mx-auto mt-8 max-w-xl">
                <DisclaimerBanner locale={locale} />
              </div>
            </div>
          </div>
        </Reveal>
      </Section>

      <SiteFooter locale={locale} />
    </div>
  );
}
