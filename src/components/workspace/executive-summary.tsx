import { t } from "@/lib/i18n";
import { term, levelLabel } from "@/lib/i18n/glossary";
import { formatDate, formatNumber, formatScore } from "@/lib/i18n/format";
import type { ExecutiveSummaryVM, Locale, PlanningIndicatorVM } from "@/lib/view-models/types";
import { FreshnessIndicator, PlanningIndicator, ProfessionalReviewBadge, VerificationBadge } from "./badges";
import { SaudiTopo } from "@/components/brand/saudi-topo";

/**
 * Executive Summary Strip — IMAGE B top band: bilingual headline + planning ring + fact rail.
 * Never invents approval probabilities or investment ranges.
 */
export function ExecutiveSummary({ locale, summary }: { locale: Locale; summary: ExecutiveSummaryVM }) {
  const headline =
    summary.leadingPathwayTitle ??
    t(locale, "No matching pathway yet", "لا يوجد مسار مطابق بعد");
  const headlineArSupport =
    locale === "en"
      ? "جاهزية تخطيط مرتبطة بمدخلاتك الحالية"
      : "Planning readiness bound to your current inputs";

  return (
    <section id="overview" aria-label={t(locale, "Executive summary", "الملخص التنفيذي")} className="scroll-mt-24">
      <div className="exec-strip relative overflow-hidden">
        <SaudiTopo
          className="pointer-events-none absolute inset-y-[-10%] end-[-6%] w-[52%] max-w-2xl opacity-55 motion-reduce:opacity-30"
          glow
        />
        <div className="pointer-events-none absolute inset-0 topo-grid opacity-30" aria-hidden />

        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--highlight)]">
              {t(locale, "Executive summary", "الملخص التنفيذي")}
            </p>
            <h2 className="mt-2 max-w-3xl text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl">
              {headline}
            </h2>
            <p
              className="mt-1 max-w-2xl text-sm text-[var(--muted)]"
              lang={locale === "en" ? "ar" : "en"}
              dir={locale === "en" ? "rtl" : "ltr"}
            >
              {headlineArSupport}
            </p>
            {summary.companyName && (
              <p className="mt-2 text-xs text-[var(--muted)]">
                {[summary.companyName, summary.country, summary.companyType, summary.entryGoal]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-muted)]/80 px-2.5 py-1 text-[11px] text-foreground">
                {t(locale, "Market: Saudi Arabia", "السوق: المملكة العربية السعودية")}
              </span>
              {summary.companyType && (
                <span className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-muted)]/80 px-2.5 py-1 text-[11px] text-foreground">
                  {t(locale, "Profile", "الملف")}: {summary.companyType}
                </span>
              )}
              <VerificationBadge locale={locale} state={summary.verification} />
              <ProfessionalReviewBadge locale={locale} state={summary.verification} />
              <FreshnessIndicator locale={locale} state={summary.sourceFreshness} />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            {summary.planning ? (
              <PlanningRing locale={locale} planning={summary.planning} />
            ) : (
              <div className="exec-gauge max-w-[14rem]">
                <p className="text-sm text-[var(--muted)]">
                  {t(locale, "Planning indicator appears after evaluation.", "يظهر مؤشر التخطيط بعد التقييم.")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Keep PlanningIndicator in DOM for a11y/tests when circular ring is shown */}
        {summary.planning && (
          <div className="sr-only">
            <PlanningIndicator locale={locale} planning={summary.planning} />
          </div>
        )}

        <dl className="relative mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--border-subtle)] sm:grid-cols-4">
          <Metric
            label={term(locale, "complexity")}
            value={summary.complexity ? levelLabel(locale, summary.complexity) : "—"}
          />
          <Metric
            label={t(locale, "Unresolved assumptions", "افتراضات غير محسومة")}
            value={formatNumber(locale, summary.unresolvedAssumptions)}
          />
          <Metric
            label={t(locale, "Key risks", "المخاطر الرئيسية")}
            value={formatNumber(locale, summary.keyRisks.length)}
          />
          <Metric
            label={t(locale, "Next action", "الإجراء التالي")}
            value={summary.nextActionTitle ?? "—"}
          />
        </dl>
        {summary.informationCutoff && (
          <p className="relative mt-3 text-[11px] text-[var(--muted)]">
            {term(locale, "informationCutoff")}: {formatDate(locale, summary.informationCutoff)}
          </p>
        )}
      </div>
    </section>
  );
}

function PlanningRing({ locale, planning }: { locale: Locale; planning: PlanningIndicatorVM }) {
  const pct = Math.max(0, Math.min(100, planning.score));
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="exec-gauge flex items-center gap-3 rounded-lg !p-3">
      <div
        className="relative h-[5.25rem] w-[5.25rem] shrink-0"
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={term(locale, "planningIndicator")}
      >
        <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90" aria-hidden>
          <circle cx="40" cy="40" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke="var(--accent-bright)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-metric text-lg font-semibold text-foreground" dir="ltr">
            {formatScore(locale, pct)}
          </span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-[var(--muted)]">{term(locale, "planningIndicator")}</p>
        <p className="mt-0.5 text-sm font-semibold text-foreground">{planning.label}</p>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[color-mix(in_srgb,var(--card)_92%,transparent)] px-3 py-2.5 sm:px-4">
      <dt className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 line-clamp-2 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}
