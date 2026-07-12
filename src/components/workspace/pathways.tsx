import { t } from "@/lib/i18n";
import type { Locale, PathwayVM, SourceVM } from "@/lib/view-models/types";
import { NarrativePanel, EvidencePanel } from "./primitives";
import { PlanningIndicator, ProfessionalReviewBadge, VerificationBadge } from "./badges";

interface PathwayHandlers {
  onFocusPathway?: (ruleKey: string) => void;
  onOpenSource?: (source: SourceVM) => void;
  activePathwayKey?: string | null;
}

/**
 * PathwayNode — one pathway with its reasoning, triggered facts, assumptions,
 * risks and sources revealed progressively. Clicking focuses it; source chips
 * open the Source Drawer. Rule logic is NEVER recomputed here — it renders the
 * decision the engine already made.
 */
export function PathwayNode({ locale, pathway, onFocusPathway, onOpenSource, activePathwayKey }: { locale: Locale; pathway: PathwayVM } & PathwayHandlers) {
  const active = activePathwayKey === pathway.ruleKey;
  return (
    <article
      aria-current={active ? "true" : undefined}
      className={`decision-node rounded-[var(--radius-lg)] p-5 ps-5 ${active ? "is-focused" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={onFocusPathway ? () => onFocusPathway(pathway.ruleKey) : undefined}
          className="min-w-0 text-start outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_50%,transparent)]"
          aria-label={t(locale, `Focus pathway ${pathway.title}`, `تركيز المسار ${pathway.title}`)}
        >
          <h3 className="truncate text-base font-semibold text-foreground">{pathway.title}</h3>
        </button>
        {pathway.planning && <div className="w-28 shrink-0"><PlanningIndicator locale={locale} planning={pathway.planning} /></div>}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <VerificationBadge locale={locale} state={pathway.verification} />
        <ProfessionalReviewBadge locale={locale} state={pathway.verification} />
        {pathway.complexity && (
          <span className="inline-flex items-center rounded-full border border-[var(--border-subtle)] px-2 py-0.5 text-xs text-[var(--muted)]">
            {t(locale, "Complexity", "التعقيد")}: {pathway.complexity}
          </span>
        )}
      </div>

      <p className="mt-3 text-sm text-[var(--muted)]">{pathway.reason}</p>

      <div className="mt-3 space-y-2">
        {pathway.triggeredFacts.length > 0 && (
          <EvidencePanel summary={t(locale, `Why this was included (${pathway.triggeredFacts.length} facts)`, `سبب التضمين (${pathway.triggeredFacts.length} حقائق)`)}>
            <ul className="space-y-1">
              {pathway.triggeredFacts.map((f) => (
                <li key={f.key} className="flex items-center justify-between gap-2">
                  <span>{f.label}: <span className="text-foreground">{f.value}</span></span>
                  <span className="text-xs text-[var(--muted)]">{f.source === "inferred" ? t(locale, "inferred", "مُستنتج") : t(locale, "provided", "مُقدَّم")}</span>
                </li>
              ))}
            </ul>
          </EvidencePanel>
        )}
        {pathway.sources.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {pathway.sources.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={onOpenSource ? () => onOpenSource(s) : undefined}
                aria-haspopup="dialog"
                className="inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] px-2.5 py-1 text-xs text-foreground outline-none transition hover:border-[color-mix(in_srgb,var(--highlight)_45%,transparent)] hover:text-[var(--highlight)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_50%,transparent)]"
              >
                {t(locale, "Source", "مصدر")}: {s.authority ?? s.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

/** PathwayCanvas — the spatial list of included pathways. On mobile it is an
 * ordered, readable list (no horizontal overflow). */
export function PathwayCanvas({ locale, pathways, ...handlers }: { locale: Locale; pathways: PathwayVM[] } & PathwayHandlers) {
  return (
    <NarrativePanel id="pathways" title={t(locale, "Recommended pathways", "المسارات الموصى بها")} description={t(locale, "Ordered by planning priority. Select one to focus its evidence.", "مرتبة حسب أولوية التخطيط. اختر واحدًا لعرض أدلته.")}>
      {pathways.length === 0 ? (
        <p className="surface-panel rounded-2xl p-6 text-sm text-[var(--muted)]">{t(locale, "No pathways matched your current inputs.", "لا توجد مسارات مطابقة لمدخلاتك الحالية.")}</p>
      ) : (
        <ol className="space-y-3">
          {pathways.map((p) => (
            <li key={p.ruleKey}>
              <PathwayNode locale={locale} pathway={p} {...handlers} />
            </li>
          ))}
        </ol>
      )}
    </NarrativePanel>
  );
}

/** PathwayComparison — side-by-side of the leading pathways. */
export function PathwayComparison({ locale, pathways }: { locale: Locale; pathways: PathwayVM[] }) {
  const top = pathways.slice(0, 3);
  if (top.length < 2) return null;
  return (
    <NarrativePanel id="comparison" title={t(locale, "Compare pathways", "مقارنة المسارات")}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-sm">
          <caption className="sr-only">{t(locale, "Pathway comparison", "مقارنة المسارات")}</caption>
          <thead>
            <tr className="text-start text-xs text-[var(--muted)]">
              <th scope="col" className="p-2 text-start">{t(locale, "Pathway", "المسار")}</th>
              <th scope="col" className="p-2 text-start">{t(locale, "Planning", "التخطيط")}</th>
              <th scope="col" className="p-2 text-start">{t(locale, "Complexity", "التعقيد")}</th>
              <th scope="col" className="p-2 text-start">{t(locale, "Verification", "التحقق")}</th>
            </tr>
          </thead>
          <tbody>
            {top.map((p) => (
              <tr key={p.ruleKey} className="border-t border-[var(--border-subtle)]">
                <th scope="row" className="p-2 text-start font-medium text-foreground">{p.title}</th>
                <td className="p-2">{p.planning?.score ?? "—"}</td>
                <td className="p-2">{p.complexity ?? "—"}</td>
                <td className="p-2">{p.verification.requiresVerification ? t(locale, "Required", "مطلوب") : t(locale, "—", "—")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </NarrativePanel>
  );
}

/** ExcludedPathways — shows what was excluded and why (governance/facts). */
export function ExcludedPathways({ locale, pathways }: { locale: Locale; pathways: PathwayVM[] }) {
  if (pathways.length === 0) return null;
  return (
    <NarrativePanel id="excluded" title={t(locale, "Excluded pathways", "المسارات المستبعدة")} description={t(locale, "Not applicable to your inputs, or excluded by content governance.", "غير منطبقة على مدخلاتك أو مستبعدة بسبب حوكمة المحتوى.")}>
      <ul className="space-y-2">
        {pathways.map((p) => (
          <li key={p.ruleKey} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/20 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-foreground">{p.title}</span>
              <span className="text-xs text-[var(--muted)]">{t(locale, "Excluded", "مستبعد")}</span>
            </div>
            <p className="mt-1 text-sm text-[var(--muted)]">{p.reason}</p>
          </li>
        ))}
      </ul>
    </NarrativePanel>
  );
}
