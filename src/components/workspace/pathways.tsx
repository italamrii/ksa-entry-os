"use client";

import { useState } from "react";
import { ArrowRight, Maximize2 } from "lucide-react";
import { t } from "@/lib/i18n";
import { term, levelLabel } from "@/lib/i18n/glossary";
import type {
  AuthorityVM,
  DependencyVM,
  ExecutiveSummaryVM,
  FactVM,
  Locale,
  PathwayVM,
  SourceVM,
} from "@/lib/view-models/types";
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

type StageId = "context" | "objective" | "pathway" | "authorities" | "dependencies" | "sources";

/**
 * IMAGE B spatial pathway canvas:
 * Company Context → Entry Objective → Recommended Pathway → Authorities → Dependencies → Official Sources
 */
export function PathwayCanvas({
  locale,
  pathways,
  dependencies = [],
  authorities = [],
  sources = [],
  summary,
  context,
  ...handlers
}: {
  locale: Locale;
  pathways: PathwayVM[];
  dependencies?: DependencyVM[];
  authorities?: AuthorityVM[];
  sources?: SourceVM[];
  summary?: ExecutiveSummaryVM | null;
  context?: { provided: FactVM[]; inferred: FactVM[] };
} & PathwayHandlers) {
  const [mode, setMode] = useState<CanvasMode>("pathway");
  const activeKey = handlers.activePathwayKey ?? pathways[0]?.ruleKey ?? null;
  const focused = pathways.find((p) => p.ruleKey === activeKey) ?? pathways[0] ?? null;

  const companyBits = [
    summary?.companyName,
    summary?.companyType,
    context?.provided[0]?.value,
  ].filter(Boolean);

  const stages: {
    id: StageId;
    n: number;
    titleEn: string;
    titleAr: string;
    detailEn: string;
    detailAr: string;
    focus?: boolean;
  }[] = [
    {
      id: "context",
      n: 1,
      titleEn: "Company Context",
      titleAr: "سياق الشركة",
      detailEn: companyBits.length ? companyBits.slice(0, 2).join(" · ") : "Profile inputs",
      detailAr: companyBits.length ? companyBits.slice(0, 2).join(" · ") : "مدخلات الملف",
    },
    {
      id: "objective",
      n: 2,
      titleEn: "Entry Objective",
      titleAr: "هدف الدخول",
      detailEn: summary?.entryGoal ?? summary?.nextActionTitle ?? "Establish presence",
      detailAr: summary?.entryGoal ?? summary?.nextActionTitle ?? "تأسيس حضور",
    },
    {
      id: "pathway",
      n: 3,
      titleEn: focused?.title ?? "Recommended pathway",
      titleAr: focused?.title ?? "المسار الموصى به",
      detailEn: t(locale, "Primary recommendation", "التوصية الأساسية"),
      detailAr: "التوصية الأساسية",
      focus: true,
    },
    {
      id: "authorities",
      n: 4,
      titleEn: "Authorities",
      titleAr: "الجهات",
      detailEn: `${authorities.length || focused?.sources.length || 0} ${t(locale, "authorities", "جهات")}`,
      detailAr: `${authorities.length || focused?.sources.length || 0} جهات`,
    },
    {
      id: "dependencies",
      n: 5,
      titleEn: "Dependencies",
      titleAr: "الاعتمادات",
      detailEn: `${dependencies.length} ${t(locale, "steps", "خطوات")}`,
      detailAr: `${dependencies.length} خطوات`,
    },
    {
      id: "sources",
      n: 6,
      titleEn: "Official Sources",
      titleAr: "المصادر الرسمية",
      detailEn: `${sources.length || focused?.sources.length || 0} ${t(locale, "verified", "متحقق")}`,
      detailAr: `${sources.length || focused?.sources.length || 0} متحقق`,
    },
  ];

  return (
    <section id="pathways" aria-label={t(locale, "Recommended pathways", "المسارات الموصى بها")} className="scroll-mt-24">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--highlight)]">
            {t(locale, "Pathway canvas", "لوحة المسارات")}
          </h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {t(
              locale,
              "Spatial entry sequence grounded in official relationships.",
              "تسلسل دخول مكاني مبني على علاقات رسمية."
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            role="tablist"
            aria-label={t(locale, "Canvas mode", "وضع اللوحة")}
            className="inline-flex rounded-md border border-[var(--border-subtle)] bg-[var(--surface-muted)]/70 p-0.5"
          >
            {(
              [
                { id: "pathway" as const, en: "Pathway View", ar: "عرض المسار" },
                { id: "dependency" as const, en: "Dependency View", ar: "عرض الاعتمادات" },
              ]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={mode === tab.id}
                onClick={() => setMode(tab.id)}
                className={cn(
                  "rounded-[5px] px-2.5 py-1 text-[11px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_50%,transparent)]",
                  mode === tab.id
                    ? "bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-[var(--accent-bright)]"
                    : "text-[var(--muted)] hover:text-foreground"
                )}
              >
                {t(locale, tab.en, tab.ar)}
              </button>
            ))}
          </div>
          <span className="hidden text-[var(--muted)] sm:inline" aria-hidden>
            <Maximize2 className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      {pathways.length === 0 ? (
        <p className="pathway-stage rounded-[var(--radius-lg)] border border-[var(--border-subtle)] p-6 text-sm text-[var(--muted)]">
          {t(locale, "No pathways matched your current inputs.", "لا توجد مسارات مطابقة لمدخلاتك الحالية.")}
        </p>
      ) : mode === "dependency" ? (
        <DependencyLane locale={locale} dependencies={dependencies} pathways={pathways} />
      ) : (
        <div className="pathway-stage relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)]">
          {/* Topography layer — dominant underlay */}
          <div className="pointer-events-none absolute inset-x-[-5%] bottom-[-8%] h-[68%] origin-bottom scale-110 [transform:perspective(900px)_rotateX(18deg)] motion-reduce:[transform:none]">
            <SaudiTopo className="h-full w-full opacity-70" glow />
          </div>
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(12,13,16,0.55)_0%,rgba(12,13,16,0.15)_42%,rgba(12,13,16,0.72)_100%)]"
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 topo-grid opacity-40" aria-hidden />

          {/* Desktop horizontal stage flow */}
          <div className="relative hidden min-h-[22rem] lg:block">
            <svg
              className="pointer-events-none absolute inset-x-[4%] top-[5.5rem] h-16 w-[92%]"
              viewBox="0 0 1000 80"
              preserveAspectRatio="none"
              aria-hidden
            >
              <path
                d="M20 40 C 120 10, 200 70, 300 40 S 500 10, 580 40 S 780 70, 860 40 S 940 20, 980 40"
                fill="none"
                stroke="url(#path-glow)"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.75"
              />
              <defs>
                <linearGradient id="path-glow" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#2f9e6e" stopOpacity="0.15" />
                  <stop offset="45%" stopColor="#3db882" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#c4a574" stopOpacity="0.35" />
                </linearGradient>
              </defs>
            </svg>

            <ol className="relative grid grid-cols-6 items-start gap-2 px-3 pb-10 pt-8 xl:gap-3 xl:px-5">
              {stages.map((stage) => {
                const isFocus = Boolean(stage.focus);
                return (
                  <li key={stage.id} className="relative min-w-0">
                    <div
                      className={cn(
                        "relative flex flex-col rounded-lg border px-2.5 py-3 transition duration-300 motion-reduce:transition-none",
                        isFocus
                          ? "-mt-2 border-[color-mix(in_srgb,var(--accent)_65%,transparent)] bg-[color-mix(in_srgb,var(--accent)_14%,rgba(20,22,28,0.92))] py-4 shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_35%,transparent),0_18px_48px_rgba(0,0,0,0.45)]"
                          : "border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--card)_78%,transparent)] backdrop-blur-[2px]"
                      )}
                    >
                      <span
                        className={cn(
                          "mb-2 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold",
                          isFocus ? "bg-[var(--accent)] text-white" : "bg-[var(--surface-muted)] text-[var(--muted)]"
                        )}
                      >
                        {stage.n}
                      </span>
                      {isFocus && (
                        <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-[var(--highlight)]">
                          {t(locale, "Recommended pathway", "المسار الموصى به")}
                        </p>
                      )}
                      <p
                        className={cn(
                          "line-clamp-3 text-xs font-semibold leading-snug text-foreground",
                          isFocus && "text-sm"
                        )}
                      >
                        {t(locale, stage.titleEn, stage.titleAr)}
                      </p>
                      <p className="mt-1.5 line-clamp-2 text-[10px] text-[var(--muted)]">
                        {t(locale, stage.detailEn, stage.detailAr)}
                      </p>
                      {isFocus && focused && (
                        <>
                          <span className="mt-2 inline-flex w-fit items-center gap-1 rounded border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--accent-bright)]">
                            {t(locale, "Primary recommendation", "التوصية الأساسية")}
                            <ArrowRight className="h-2.5 w-2.5 rtl:rotate-180" aria-hidden />
                          </span>
                          {/* Focus beam to topography */}
                          <span
                            className="pointer-events-none absolute start-1/2 top-full h-24 w-[2px] -translate-x-1/2 bg-gradient-to-b from-[var(--accent-bright)] via-[color-mix(in_srgb,var(--accent)_45%,transparent)] to-transparent motion-reduce:hidden"
                            aria-hidden
                          />
                          <span
                            className="pointer-events-none absolute start-1/2 top-[calc(100%+5.5rem)] h-3 w-3 -translate-x-1/2 rounded-full bg-[var(--accent-bright)]/80 shadow-[0_0_24px_8px_rgba(61,184,130,0.35)] motion-reduce:hidden"
                            aria-hidden
                          />
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Mobile / tablet: ordered flow */}
          <ol className="relative space-y-2 p-4 lg:hidden">
            {stages.map((stage) => (
              <li
                key={stage.id}
                className={cn(
                  "rounded-lg border px-3 py-3",
                  stage.focus
                    ? "border-[color-mix(in_srgb,var(--accent)_55%,transparent)] bg-[color-mix(in_srgb,var(--accent)_12%,var(--card))]"
                    : "border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--card)_85%,transparent)]"
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] text-xs font-bold">
                    {stage.n}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{t(locale, stage.titleEn, stage.titleAr)}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">{t(locale, stage.detailEn, stage.detailAr)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {/* Evidence / pathway detail — preserves UX tests & keyboard source controls */}
          <div className="relative border-t border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--obsidian)_55%,transparent)] p-3 sm:p-4">
            {focused ? (
              <PathwayNode
                locale={locale}
                pathway={focused}
                index={0}
                {...handlers}
                activePathwayKey={activeKey}
              />
            ) : null}
            {pathways.length > 1 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {pathways.map((p, i) => (
                  <li key={p.ruleKey}>
                    <button
                      type="button"
                      onClick={handlers.onFocusPathway ? () => handlers.onFocusPathway!(p.ruleKey) : undefined}
                      aria-current={p.ruleKey === activeKey ? "true" : undefined}
                      className={cn(
                        "rounded-full border px-3 py-1 text-[11px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_50%,transparent)]",
                        p.ruleKey === activeKey
                          ? "border-[var(--accent)] text-[var(--accent-bright)]"
                          : "border-[var(--border-subtle)] text-[var(--muted)]"
                      )}
                    >
                      {i + 1}. {p.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
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
