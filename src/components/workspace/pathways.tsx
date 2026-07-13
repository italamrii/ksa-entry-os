"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import { term, levelLabel } from "@/lib/i18n/glossary";
import type { DependencyVM, Locale, PathwayVM, SourceVM } from "@/lib/view-models/types";
import { NarrativePanel, EvidencePanel } from "./primitives";
import { PlanningIndicator, ProfessionalReviewBadge, VerificationBadge } from "./badges";
import { SaudiTopo } from "@/components/brand/saudi-topo";
import { cn } from "@/lib/utils";

interface PathwayHandlers {
  onFocusPathway?: (ruleKey: string) => void;
  onOpenSource?: (source: SourceVM) => void;
  activePathwayKey?: string | null;
}

export function PathwayNode({
  locale,
  pathway,
  onFocusPathway,
  onOpenSource,
  activePathwayKey,
  index,
}: { locale: Locale; pathway: PathwayVM; index?: number } & PathwayHandlers) {
  const active = activePathwayKey === pathway.ruleKey;
  return (
    <article
      aria-current={active ? "true" : undefined}
      className={cn("decision-node rounded-[var(--radius-lg)] p-5 ps-5", active && "is-focused")}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={onFocusPathway ? () => onFocusPathway(pathway.ruleKey) : undefined}
          className="min-w-0 text-start outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_50%,transparent)]"
          aria-label={t(locale, `Focus pathway ${pathway.title}`, `تركيز المسار ${pathway.title}`)}
        >
          {typeof index === "number" && (
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--highlight)]">
              {t(locale, "Pathway", "مسار")} {index + 1}
            </span>
          )}
          <h3 className="truncate text-base font-semibold text-foreground">{pathway.title}</h3>
        </button>
        {pathway.planning && (
          <div className="w-28 shrink-0">
            <PlanningIndicator locale={locale} planning={pathway.planning} />
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <VerificationBadge locale={locale} state={pathway.verification} />
        <ProfessionalReviewBadge locale={locale} state={pathway.verification} />
        {pathway.complexity && (
          <span className="inline-flex items-center rounded-full border border-[var(--border-subtle)] px-2 py-0.5 text-xs text-[var(--muted)]">
            {term(locale, "complexity")}: {levelLabel(locale, pathway.complexity)}
          </span>
        )}
      </div>

      <p className="mt-3 text-sm text-[var(--muted)]">{pathway.reason}</p>

      <div className="mt-3 space-y-2">
        {pathway.triggeredFacts.length > 0 && (
          <EvidencePanel
            summary={t(
              locale,
              `Why this was included (${pathway.triggeredFacts.length} facts)`,
              `سبب التضمين (${pathway.triggeredFacts.length} حقائق)`
            )}
          >
            <ul className="space-y-1">
              {pathway.triggeredFacts.map((f) => (
                <li key={f.key} className="flex items-center justify-between gap-2">
                  <span>
                    {f.label}: <span className="text-foreground">{f.value}</span>
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    {f.source === "inferred" ? t(locale, "inferred", "مُستنتج") : t(locale, "provided", "مُقدَّم")}
                  </span>
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

type CanvasMode = "pathway" | "dependency";

export function PathwayCanvas({
  locale,
  pathways,
  dependencies = [],
  ...handlers
}: { locale: Locale; pathways: PathwayVM[]; dependencies?: DependencyVM[] } & PathwayHandlers) {
  const [mode, setMode] = useState<CanvasMode>("pathway");
  const activeKey = handlers.activePathwayKey ?? pathways[0]?.ruleKey ?? null;

  return (
    <section id="pathways" aria-label={t(locale, "Recommended pathways", "المسارات الموصى بها")} className="scroll-mt-24">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <h2 className="text-overline">{t(locale, "Pathway canvas", "لوحة المسارات")}</h2>
          <p className="mt-1.5 text-sm text-[var(--muted)]">
            {t(
              locale,
              "Ordered by planning priority. Select a node to focus its evidence.",
              "مرتبة حسب أولوية التخطيط. اختر عقدة لتركيز أدلتها."
            )}
          </p>
        </div>
        <div
          role="tablist"
          aria-label={t(locale, "Canvas mode", "وضع اللوحة")}
          className="inline-flex rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)]/60 p-1"
        >
          {(
            [
              { id: "pathway" as const, en: "Pathway view", ar: "عرض المسار" },
              { id: "dependency" as const, en: "Dependency view", ar: "عرض الاعتمادات" },
            ]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={mode === tab.id}
              onClick={() => setMode(tab.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_50%,transparent)]",
                mode === tab.id
                  ? "bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-[var(--accent-bright)]"
                  : "text-[var(--muted)] hover:text-foreground"
              )}
            >
              {t(locale, tab.en, tab.ar)}
            </button>
          ))}
        </div>
      </div>

      {pathways.length === 0 ? (
        <p className="surface-panel rounded-[var(--radius-lg)] p-6 text-sm text-[var(--muted)]">
          {t(locale, "No pathways matched your current inputs.", "لا توجد مسارات مطابقة لمدخلاتك الحالية.")}
        </p>
      ) : mode === "dependency" ? (
        <DependencyLane locale={locale} dependencies={dependencies} pathways={pathways} />
      ) : (
        <div className="pathway-stage relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)]">
          <SaudiTopo className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%] w-full opacity-45" glow />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[var(--card)] via-[color-mix(in_srgb,var(--card)_72%,transparent)] to-transparent" />

          <div className="relative hidden md:block">
            <div className="absolute start-[6%] end-[6%] top-[4.35rem] h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-55" aria-hidden />
            <ol className="relative flex items-start justify-between gap-2 px-4 pb-6 pt-6 lg:gap-3 lg:px-6">
              {pathways.map((p, i) => {
                const active = p.ruleKey === activeKey;
                return (
                  <li key={p.ruleKey} className="relative min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={handlers.onFocusPathway ? () => handlers.onFocusPathway!(p.ruleKey) : undefined}
                      aria-current={active ? "true" : undefined}
                      aria-label={t(locale, `Focus pathway ${p.title}`, `تركيز المسار ${p.title}`)}
                      className={cn(
                        "relative w-full rounded-[var(--radius-md)] border px-2 py-4 text-start outline-none transition focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_50%,transparent)] lg:px-3",
                        active
                          ? "border-[color-mix(in_srgb,var(--accent)_55%,transparent)] bg-[color-mix(in_srgb,var(--accent)_12%,var(--card))] shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_25%,transparent),0_12px_40px_rgba(0,0,0,0.35)]"
                          : "border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] hover:border-[color-mix(in_srgb,var(--highlight)_35%,transparent)]"
                      )}
                    >
                      <span
                        className={cn(
                          "mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                          active ? "bg-[var(--accent)] text-white" : "bg-[var(--surface-muted)] text-[var(--muted)]"
                        )}
                      >
                        {i + 1}
                      </span>
                      <p className="line-clamp-2 text-center text-xs font-semibold text-foreground">{p.title}</p>
                      <p className="mt-2 text-center text-[10px] text-[var(--muted)]">
                        {p.sources.length} {t(locale, "sources", "مصادر")}
                        {p.complexity ? ` · ${levelLabel(locale, p.complexity)}` : ""}
                      </p>
                      {active && (
                        <span
                          className="absolute start-1/2 top-full h-14 w-px -translate-x-1/2 bg-gradient-to-b from-[var(--accent-bright)] to-transparent motion-reduce:hidden"
                          aria-hidden
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="relative space-y-3 border-t border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--obsidian)_50%,transparent)] p-4 sm:p-5">
            <ol className="space-y-3">
              {pathways.map((p, i) => (
                <li
                  key={p.ruleKey}
                  className={cn(
                    "transition-opacity duration-300 motion-reduce:transition-none",
                    activeKey && p.ruleKey !== activeKey && "md:opacity-55"
                  )}
                >
                  <PathwayNode locale={locale} pathway={p} index={i} {...handlers} activePathwayKey={activeKey} />
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </section>
  );
}

function DependencyLane({
  locale,
  dependencies,
  pathways,
}: {
  locale: Locale;
  dependencies: DependencyVM[];
  pathways: PathwayVM[];
}) {
  if (dependencies.length === 0) {
    return (
      <p className="surface-panel rounded-[var(--radius-lg)] p-6 text-sm text-[var(--muted)]">
        {t(locale, "No step dependencies for the current pathways.", "لا توجد اعتمادات خطوات للمسارات الحالية.")}
      </p>
    );
  }
  return (
    <div className="surface-canvas rounded-[var(--radius-lg)] p-4 sm:p-6">
      <p className="mb-4 text-sm text-[var(--muted)]">
        {t(locale, "Dependency lanes across recommended pathways.", "مسارات الاعتماد عبر المسارات الموصى بها.")}
        {pathways.length > 0 ? ` · ${pathways.length} ${t(locale, "pathways", "مسارات")}` : ""}
      </p>
      <ol className="space-y-2">
        {dependencies.map((d) => (
          <li
            key={d.stepId}
            className="flex items-start gap-3 border-s-2 border-[color-mix(in_srgb,var(--highlight)_40%,transparent)] bg-[color-mix(in_srgb,var(--surface-muted)_55%,transparent)] px-4 py-3"
          >
            <span
              aria-hidden
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] text-xs font-semibold"
            >
              {d.order + 1}
            </span>
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
    </div>
  );
}

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
                <td className="p-2">
                  {p.verification.requiresVerification ? t(locale, "Required", "مطلوب") : t(locale, "—", "—")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </NarrativePanel>
  );
}

export function ExcludedPathways({ locale, pathways }: { locale: Locale; pathways: PathwayVM[] }) {
  if (pathways.length === 0) return null;
  return (
    <NarrativePanel
      id="excluded"
      title={t(locale, "Excluded pathways", "المسارات المستبعدة")}
      description={t(
        locale,
        "Not applicable to your inputs, or excluded by content governance.",
        "غير منطبقة على مدخلاتك أو مستبعدة بسبب حوكمة المحتوى."
      )}
    >
      <ul className="divide-y divide-[var(--border-subtle)] rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
        {pathways.map((p) => (
          <li key={p.ruleKey} className="px-4 py-3">
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
