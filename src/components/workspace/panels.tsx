import { t } from "@/lib/i18n";
import type {
  AssumptionVM,
  AuthorityVM,
  DependencyVM,
  FactVM,
  Locale,
  NextActionVM,
  ReportSummaryVM,
  RiskVM,
  SourceVM,
} from "@/lib/view-models/types";
import { term, levelLabel, classificationLabel } from "@/lib/i18n/glossary";
import { formatDate } from "@/lib/i18n/format";
import { NarrativePanel, EvidencePanel, DecisionStrip } from "./primitives";
import { FreshnessIndicator, ProfessionalReviewBadge, VerificationBadge } from "./badges";

export function CompanyContext({ locale, provided, inferred }: { locale: Locale; provided: FactVM[]; inferred: FactVM[] }) {
  return (
    <NarrativePanel id="context" title={t(locale, "Company context", "سياق الشركة")} description={t(locale, "What you told us, and what the platform inferred.", "ما أخبرتنا به وما استنتجته المنصة.")}>
      <div className="grid gap-4 lg:grid-cols-2">
        <FactColumn locale={locale} heading={term(locale, "userProvided")} facts={provided} tone="provided" />
        <FactColumn locale={locale} heading={term(locale, "platformInferred")} facts={inferred} tone="inferred" />
      </div>
    </NarrativePanel>
  );
}

function FactColumn({ locale, heading, facts, tone }: { locale: Locale; heading: string; facts: FactVM[]; tone: "provided" | "inferred" }) {
  return (
    <div className="surface-panel rounded-[var(--radius-lg)] p-5">
      <h3 className="text-overline">{heading}</h3>
      {facts.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--muted)]">{t(locale, "Nothing yet.", "لا شيء بعد.")}</p>
      ) : (
        <dl className="mt-3 space-y-2">
          {facts.map((f) => (
            <div key={f.key} className="flex items-center justify-between gap-3 text-sm">
              <dt className="text-[var(--muted)]">{f.label}</dt>
              <dd className="flex items-center gap-2 font-medium text-foreground">
                {f.value}
                {tone === "inferred" && (
                  <span className="rounded border border-[var(--border-subtle)] px-1 text-[10px] text-[var(--muted)]">{term(locale, "inferred")}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export function DependencyView({ locale, dependencies }: { locale: Locale; dependencies: DependencyVM[] }) {
  return (
    <NarrativePanel id="dependencies" title={t(locale, "Dependencies", "الاعتمادات")} description={t(locale, "Steps and what each depends on. On small screens this reads as an ordered list.", "الخطوات وما يعتمد عليه كل منها.")}>
      {dependencies.length === 0 ? (
        <p className="surface-panel rounded-2xl p-6 text-sm text-[var(--muted)]">{t(locale, "No step dependencies for the current pathways.", "لا توجد اعتمادات خطوات للمسارات الحالية.")}</p>
      ) : (
        <ol className="space-y-2">
          {dependencies.map((d) => (
            <li key={d.stepId} className="surface-panel flex items-start gap-3 rounded-xl p-4">
              <span aria-hidden className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] text-xs font-semibold text-foreground">{d.order + 1}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{d.title}</p>
                <p className="text-xs text-[var(--muted)]">
                  {d.dependsOn.length > 0
                    ? t(locale, `Depends on ${d.dependsOn.length} prior step(s)`, `يعتمد على ${d.dependsOn.length} خطوة سابقة`)
                    : t(locale, "No prerequisites", "لا متطلبات مسبقة")}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </NarrativePanel>
  );
}

export function AuthorityMatrix({ locale, authorities }: { locale: Locale; authorities: AuthorityVM[] }) {
  if (authorities.length === 0) return null;
  return (
    <NarrativePanel id="authorities" title={t(locale, "Authority matrix", "مصفوفة الجهات")}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] border-collapse text-sm">
          <caption className="sr-only">{t(locale, "Authorities and related pathways", "الجهات والمسارات المرتبطة")}</caption>
          <thead>
            <tr className="text-xs text-[var(--muted)]">
              <th scope="col" className="p-2 text-start">{t(locale, "Authority", "الجهة")}</th>
              <th scope="col" className="p-2 text-start">{t(locale, "Sources", "المصادر")}</th>
              <th scope="col" className="p-2 text-start">{t(locale, "Related pathways", "المسارات المرتبطة")}</th>
            </tr>
          </thead>
          <tbody>
            {authorities.map((a) => (
              <tr key={a.name} className="border-t border-[var(--border-subtle)]">
                <th scope="row" className="p-2 text-start font-medium text-foreground">{a.name}</th>
                <td className="p-2">{a.sourceCount}</td>
                <td className="p-2 text-[var(--muted)]">{a.pathwayKeys.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </NarrativePanel>
  );
}

export function AssumptionsPanel({ locale, assumptions, onDecide }: { locale: Locale; assumptions: AssumptionVM[]; onDecide?: (key: string, decision: "CONFIRMED" | "REJECTED") => void }) {
  return (
    <NarrativePanel id="assumptions" title={t(locale, "Assumptions", "الافتراضات")} description={t(locale, "Made to complete the picture. Confirm or reject to refine re-evaluation.", "وُضعت لإكمال الصورة. أكّد أو ارفض لتحسين إعادة التقييم.")}>
      {assumptions.length === 0 ? (
        <p className="surface-panel rounded-2xl p-6 text-sm text-[var(--muted)]">{t(locale, "No assumptions were needed.", "لم تُطلب أي افتراضات.")}</p>
      ) : (
        <ul className="space-y-2">
          {assumptions.map((a) => (
            <li key={a.key} className="surface-panel rounded-xl p-4">
              <p className="text-sm font-medium text-foreground">{a.statement}</p>
              <EvidencePanel summary={t(locale, "Why & impact if false", "السبب والأثر إذا كان خاطئًا")}>
                <p>{t(locale, "Confidence: ", "الثقة: ")}{a.confidence}</p>
                <p className="mt-1">{t(locale, "If false: ", "إذا كان خاطئًا: ")}{a.impactIfFalse}</p>
                {a.affectedPathwayLabel && <p className="mt-1">{t(locale, "Affects: ", "يؤثر على: ")}{a.affectedPathwayLabel}</p>}
              </EvidencePanel>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={onDecide ? () => onDecide(a.key, "CONFIRMED") : undefined} className="rounded-lg border border-emerald-500/40 px-3 py-1.5 text-xs font-medium text-emerald-300 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50">
                  {t(locale, "Confirm", "تأكيد")}
                </button>
                <button type="button" onClick={onDecide ? () => onDecide(a.key, "REJECTED") : undefined} className="rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50">
                  {t(locale, "Reject", "رفض")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </NarrativePanel>
  );
}

export function RiskLayer({ locale, risks }: { locale: Locale; risks: RiskVM[] }) {
  const sevOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;
  const sorted = [...risks].sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);
  return (
    <NarrativePanel id="risks" title={term(locale, "risks")} description={t(locale, "Planning risks — not legal conclusions.", "مخاطر تخطيطية، وليست استنتاجات قانونية.")}>
      {sorted.length === 0 ? (
        <p className="surface-panel rounded-2xl p-6 text-sm text-[var(--muted)]">{t(locale, "No notable risks surfaced.", "لم تظهر مخاطر بارزة.")}</p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((r, i) => (
            <li key={i} className="surface-panel rounded-xl p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-foreground">{r.category}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${sevClass(r.severity)}`}>{sevLabel(locale, r.severity)}</span>
              </div>
              <p className="mt-1 text-sm text-[var(--muted)]">{r.rationale}</p>
              <p className="mt-1 text-sm"><span className="text-[var(--muted)]">{t(locale, "Next step: ", "الخطوة التالية: ")}</span><span className="text-foreground">{r.mitigation}</span></p>
            </li>
          ))}
        </ul>
      )}
    </NarrativePanel>
  );
}

function sevLabel(locale: Locale, s: RiskVM["severity"]) {
  return levelLabel(locale, s);
}
function sevClass(s: RiskVM["severity"]) {
  return s === "HIGH" ? "border border-red-500/30 bg-red-500/10 text-red-300" : s === "MEDIUM" ? "border border-amber-500/30 bg-amber-500/10 text-amber-300" : "border border-[var(--border-subtle)] text-[var(--muted)]";
}

export function NextActionFlow({ locale, actions }: { locale: Locale; actions: NextActionVM[] }) {
  return (
    <NarrativePanel id="next-actions" title={t(locale, "Prioritized next actions", "الإجراءات التالية حسب الأولوية")} description={t(locale, "A planning sequence. Completing steps does not guarantee any approval.", "تسلسل تخطيطي. إكمال الخطوات لا يضمن أي موافقة.")}>
      {actions.length === 0 ? (
        <p className="surface-panel rounded-2xl p-6 text-sm text-[var(--muted)]">{t(locale, "No actions to prioritize yet.", "لا توجد إجراءات بعد.")}</p>
      ) : (
        <ol className="relative space-y-2 border-s border-[var(--border-subtle)] ps-5">
          {actions.map((a, i) => (
            <li key={a.ruleKey} className="surface-panel rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground"><span className="text-[var(--muted)]">{i + 1}. </span>{a.title}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <VerificationBadge locale={locale} state={a.verification} />
                    <ProfessionalReviewBadge locale={locale} state={a.verification} />
                  </div>
                </div>
                {a.officialSourceUrl && (
                  <a href={a.officialSourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="shrink-0 text-xs font-medium text-emerald-400 underline underline-offset-2">
                    {t(locale, "Official source ↗", "المصدر الرسمي ↗")}
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </NarrativePanel>
  );
}

export function ReportWorkspace({ locale, report, assessmentId, canExport }: { locale: Locale; report: ReportSummaryVM; assessmentId?: string | null; canExport?: boolean }) {
  return (
    <NarrativePanel id="report" title={t(locale, "Report workspace", "مساحة التقرير")}>
      <div className="surface-panel rounded-2xl p-6">
        <DecisionStrip
          items={[
            { label: t(locale, "Scope", "النطاق"), value: report.scope },
            { label: t(locale, "Pathways", "المسارات"), value: report.pathwayCount },
            { label: t(locale, "Assumptions", "الافتراضات"), value: report.assumptionCount },
            { label: t(locale, "Sources", "المصادر"), value: report.sourceCount },
          ]}
        />
        <p className="mt-4 text-sm text-[var(--muted)]">
          <span className="font-medium text-foreground">{term(locale, "informationCutoff")}: </span>
          {formatDate(locale, report.informationCutoff)}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">{report.disclaimer}</p>
        {canExport && assessmentId && (
          <a href={`/api/assessments/${assessmentId}/pdf`} className="mt-4 inline-flex rounded-lg border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-foreground hover:border-emerald-500/40">
            {t(locale, "Export PDF", "تصدير PDF")}
          </a>
        )}
      </div>
    </NarrativePanel>
  );
}

/** Presentational source rows for the SourceDrawer content (also unit-testable). */
export function SourceList({ locale, sources, onOpenSource }: { locale: Locale; sources: SourceVM[]; onOpenSource?: (s: SourceVM) => void }) {
  return (
    <ul className="space-y-2">
      {sources.map((s) => (
        <li key={s.id} className="surface-panel flex items-center justify-between gap-3 rounded-xl p-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{s.title}</p>
            <p className="text-xs text-[var(--muted)]">{s.authority ?? t(locale, "Unknown authority", "جهة غير معروفة")} · {classificationLabel(locale, s.classification)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <FreshnessIndicator locale={locale} state={s.freshness} />
            <button type="button" onClick={onOpenSource ? () => onOpenSource(s) : undefined} aria-haspopup="dialog" className="rounded-lg border border-[var(--border-subtle)] px-2.5 py-1 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50">
              {t(locale, "Details", "التفاصيل")}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
