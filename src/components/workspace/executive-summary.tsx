import { t } from "@/lib/i18n";
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
      <div className="surface-panel rounded-2xl p-6 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="text-xs text-[var(--muted)]">{t(locale, "Leading recommended pathway", "المسار الموصى به الرئيسي")}</p>
            <h3 className="mt-1 text-lg font-semibold text-foreground">
              {summary.leadingPathwayTitle ?? t(locale, "No matching pathway yet", "لا يوجد مسار مطابق بعد")}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <VerificationBadge locale={locale} state={summary.verification} />
              <ProfessionalReviewBadge locale={locale} state={summary.verification} />
              <FreshnessIndicator locale={locale} state={summary.sourceFreshness} />
            </div>
            {summary.nextActionTitle && (
              <p className="mt-4 text-sm text-[var(--muted)]">
                <span className="font-medium text-foreground">{t(locale, "Next recommended action: ", "الإجراء التالي الموصى به: ")}</span>
                {summary.nextActionTitle}
              </p>
            )}
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] p-4">
            {summary.planning ? (
              <PlanningIndicator locale={locale} planning={summary.planning} />
            ) : (
              <p className="text-sm text-[var(--muted)]">{t(locale, "Planning indicator appears after evaluation.", "يظهر مؤشر التخطيط بعد التقييم.")}</p>
            )}
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-[var(--border-subtle)] pt-6 sm:grid-cols-4">
          <Metric label={t(locale, "Complexity", "التعقيد")} value={summary.complexity ?? "—"} />
          <Metric label={t(locale, "Unresolved assumptions", "افتراضات غير محسومة")} value={String(summary.unresolvedAssumptions)} />
          <Metric label={t(locale, "Key risks", "المخاطر الرئيسية")} value={String(summary.keyRisks.length)} />
          <Metric label={t(locale, "Information cutoff", "تاريخ توقف المعلومات")} value={summary.informationCutoff ? new Date(summary.informationCutoff).toLocaleDateString(locale) : "—"} />
        </dl>
      </div>
    </NarrativePanel>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-[var(--muted)]">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}
