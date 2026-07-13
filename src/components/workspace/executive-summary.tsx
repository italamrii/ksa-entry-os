import { t } from "@/lib/i18n";
import { term, levelLabel } from "@/lib/i18n/glossary";
import { formatDate, formatNumber } from "@/lib/i18n/format";
import type { ExecutiveSummaryVM, Locale } from "@/lib/view-models/types";
import { NarrativePanel } from "./primitives";
import { FreshnessIndicator, PlanningIndicator, ProfessionalReviewBadge, VerificationBadge } from "./badges";

/**
 * ExecutiveSummary — the first view. Summarizes; detail appears progressively
 * elsewhere. Scores are labeled as planning indicators, never approval odds.
 */
export function ExecutiveSummary({ locale, summary }: { locale: Locale; summary: ExecutiveSummaryVM }) {
  return (
    <NarrativePanel id="overview" title={t(locale, "Executive summary", "الملخص التنفيذي")}>
      <div className="surface-panel relative overflow-hidden rounded-[var(--radius-lg)] p-6 lg:p-8">
        <div className="pointer-events-none absolute inset-0 topo-grid opacity-40" aria-hidden />
        <div className="relative grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="text-caption">{t(locale, "Leading recommended pathway", "المسار الموصى به الرئيسي")}</p>
            <h3 className="font-display mt-1 text-xl font-semibold tracking-tight text-foreground">
              {summary.leadingPathwayTitle ?? t(locale, "No matching pathway yet", "لا يوجد مسار مطابق بعد")}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <VerificationBadge locale={locale} state={summary.verification} />
              <ProfessionalReviewBadge locale={locale} state={summary.verification} />
              <FreshnessIndicator locale={locale} state={summary.sourceFreshness} />
            </div>
            {summary.nextActionTitle && (
              <p className="surface-strip mt-5 rounded-[var(--radius-md)] text-sm text-[var(--muted)]">
                <span className="font-medium text-foreground">
                  {t(locale, "Next recommended action: ", "الإجراء التالي الموصى به: ")}
                </span>
                {summary.nextActionTitle}
              </p>
            )}
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-muted)]/40 p-4">
            {summary.planning ? (
              <PlanningIndicator locale={locale} planning={summary.planning} />
            ) : (
              <p className="text-sm text-[var(--muted)]">
                {t(locale, "Planning indicator appears after evaluation.", "يظهر مؤشر التخطيط بعد التقييم.")}
              </p>
            )}
          </div>
        </div>

        <dl className="relative mt-6 grid grid-cols-2 gap-4 border-t border-[var(--border-subtle)] pt-6 sm:grid-cols-4">
          <Metric label={term(locale, "complexity")} value={summary.complexity ? levelLabel(locale, summary.complexity) : "—"} />
          <Metric
            label={t(locale, "Unresolved assumptions", "افتراضات غير محسومة")}
            value={formatNumber(locale, summary.unresolvedAssumptions)}
          />
          <Metric label={t(locale, "Key risks", "المخاطر الرئيسية")} value={formatNumber(locale, summary.keyRisks.length)} />
          <Metric label={term(locale, "informationCutoff")} value={formatDate(locale, summary.informationCutoff)} />
        </dl>
      </div>
    </NarrativePanel>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-caption">{label}</dt>
      <dd className="text-metric mt-0.5 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}
