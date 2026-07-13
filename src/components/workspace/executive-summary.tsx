import { t } from "@/lib/i18n";
import { term, levelLabel } from "@/lib/i18n/glossary";
import { formatDate, formatNumber } from "@/lib/i18n/format";
import type { ExecutiveSummaryVM, Locale } from "@/lib/view-models/types";
import { FreshnessIndicator, PlanningIndicator, ProfessionalReviewBadge, VerificationBadge } from "./badges";
import { SaudiTopo } from "@/components/brand/saudi-topo";

/**
 * Executive Summary Strip — persistent top region of the decision workspace.
 * Not a metric-card row: a bilingual headline band + planning gauge + facts rail.
 */
export function ExecutiveSummary({ locale, summary }: { locale: Locale; summary: ExecutiveSummaryVM }) {
  const headline =
    summary.leadingPathwayTitle ??
    t(locale, "No matching pathway yet", "لا يوجد مسار مطابق بعد");

  return (
    <section id="overview" aria-label={t(locale, "Executive summary", "الملخص التنفيذي")} className="scroll-mt-24">
      <div className="exec-strip relative overflow-hidden">
        <SaudiTopo className="pointer-events-none absolute inset-y-0 end-0 w-[55%] max-w-xl opacity-40 motion-reduce:opacity-25" glow />
        <div className="pointer-events-none absolute inset-0 topo-grid opacity-25" aria-hidden />

        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(12rem,0.7fr)] lg:items-center">
          <div className="min-w-0">
            <p className="text-overline">{t(locale, "Executive summary", "الملخص التنفيذي")}</p>
            <h2 className="font-display mt-2 text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
              {headline}
            </h2>
            {summary.companyName && (
              <p className="mt-2 text-sm text-[var(--muted)]">
                {[summary.companyName, summary.country, summary.companyType].filter(Boolean).join(" · ")}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <VerificationBadge locale={locale} state={summary.verification} />
              <ProfessionalReviewBadge locale={locale} state={summary.verification} />
              <FreshnessIndicator locale={locale} state={summary.sourceFreshness} />
            </div>

            {summary.nextActionTitle && (
              <p className="mt-5 border-s-2 border-[var(--highlight)] ps-3 text-sm text-[var(--muted)]">
                <span className="font-medium text-foreground">
                  {t(locale, "Next recommended action: ", "الإجراء التالي الموصى به: ")}
                </span>
                {summary.nextActionTitle}
              </p>
            )}
          </div>

          <div className="exec-gauge">
            {summary.planning ? (
              <PlanningIndicator locale={locale} planning={summary.planning} />
            ) : (
              <p className="text-sm text-[var(--muted)]">
                {t(locale, "Planning indicator appears after evaluation.", "يظهر مؤشر التخطيط بعد التقييم.")}
              </p>
            )}
          </div>
        </div>

        <dl className="relative mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--border-subtle)] sm:grid-cols-4">
          <Metric label={term(locale, "complexity")} value={summary.complexity ? levelLabel(locale, summary.complexity) : "—"} />
          <Metric
            label={t(locale, "Unresolved assumptions", "افتراضات غير محسومة")}
            value={formatNumber(locale, summary.unresolvedAssumptions)}
          />
          <Metric label={t(locale, "Key risks", "المخاطر الرئيسية")} value={formatNumber(locale, summary.keyRisks.length)} />
          <Metric label={term(locale, "informationCutoff")} value={formatDate(locale, summary.informationCutoff)} />
        </dl>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--card)] px-3 py-3 sm:px-4">
      <dt className="text-caption">{label}</dt>
      <dd className="text-metric mt-1 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}
