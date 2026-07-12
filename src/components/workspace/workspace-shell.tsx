"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import type { SourceVM, WorkspaceViewModel } from "@/lib/view-models/types";
import { ExecutiveSummary } from "./executive-summary";
import { PathwayCanvas, PathwayComparison, ExcludedPathways } from "./pathways";
import { CompanyContext, DependencyView, AuthorityMatrix, AssumptionsPanel, RiskLayer, NextActionFlow, ReportWorkspace, SourceList } from "./panels";
import { NarrativePanel } from "./primitives";
import { SourceDrawer } from "./source-drawer";

const SECTIONS = [
  { id: "overview", en: "Overview", ar: "نظرة عامة" },
  { id: "context", en: "Company context", ar: "سياق الشركة" },
  { id: "pathways", en: "Pathways", ar: "المسارات" },
  { id: "dependencies", en: "Dependencies", ar: "الاعتمادات" },
  { id: "assumptions", en: "Assumptions", ar: "الافتراضات" },
  { id: "risks", en: "Risks", ar: "المخاطر" },
  { id: "sources", en: "Official sources", ar: "المصادر الرسمية" },
  { id: "next-actions", en: "Next actions", ar: "الإجراءات التالية" },
  { id: "report", en: "Report", ar: "التقرير" },
];

export function WorkspaceShell({ vm, assessmentId, canExport }: { vm: WorkspaceViewModel; assessmentId: string | null; canExport: boolean }) {
  const router = useRouter();
  const { locale, dir } = vm;
  const [activePathwayKey, setActivePathwayKey] = useState<string | null>(vm.includedPathways[0]?.ruleKey ?? null);
  const [openSource, setOpenSource] = useState<SourceVM | null>(null);
  const [current, setCurrent] = useState("overview");

  async function onDecide(key: string, decision: "CONFIRMED" | "REJECTED") {
    if (!assessmentId) return;
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/assumptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assumptionKey: key, decision }),
      });
      if (!res.ok) throw new Error();
      toast.success(t(locale, "Saved. Re-evaluate to apply.", "تم الحفظ. أعد التقييم للتطبيق."));
      router.refresh();
    } catch {
      toast.error(t(locale, "Could not save decision.", "تعذر حفظ القرار."));
    }
  }

  return (
    <div dir={dir} className="mx-auto flex w-full min-w-0 max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <aside className="hidden w-56 shrink-0 lg:block" aria-label={t(locale, "Workspace sections", "أقسام مساحة العمل")}>
        <nav className="surface-panel sticky top-24 rounded-[var(--radius-lg)] p-3">
          <ul className="flex flex-col gap-0.5">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  aria-current={current === s.id ? "true" : undefined}
                  onClick={() => setCurrent(s.id)}
                  className={`block rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_50%,transparent)] ${
                    current === s.id
                      ? "bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent-bright)]"
                      : "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-foreground"
                  }`}
                >
                  {t(locale, s.en, s.ar)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <main className="min-w-0 flex-1 space-y-10">
        <ExecutiveSummary locale={locale} summary={vm.summary} />
        <CompanyContext locale={locale} provided={vm.context.provided} inferred={vm.context.inferred} />
        <PathwayCanvas locale={locale} pathways={vm.includedPathways} onFocusPathway={setActivePathwayKey} onOpenSource={setOpenSource} activePathwayKey={activePathwayKey} />
        <PathwayComparison locale={locale} pathways={vm.includedPathways} />
        <ExcludedPathways locale={locale} pathways={vm.excludedPathways} />
        <DependencyView locale={locale} dependencies={vm.dependencies} />
        <AuthorityMatrix locale={locale} authorities={vm.authorities} />
        <AssumptionsPanel locale={locale} assumptions={vm.assumptions} onDecide={onDecide} />
        <RiskLayer locale={locale} risks={vm.risks} />
        <NarrativePanel id="sources" title={t(locale, "Official sources", "المصادر الرسمية")} description={t(locale, "Independently operated. Open to verify current requirements.", "مُشغَّلة بشكل مستقل. افتحها للتحقق من المتطلبات الحالية.")}>
          {vm.sources.length === 0 ? (
            <p className="surface-panel rounded-2xl p-6 text-sm text-[var(--muted)]">{t(locale, "No sources linked yet.", "لا مصادر مرتبطة بعد.")}</p>
          ) : (
            <SourceList locale={locale} sources={vm.sources} onOpenSource={setOpenSource} />
          )}
        </NarrativePanel>
        <NextActionFlow locale={locale} actions={vm.nextActions} />
        <ReportWorkspace locale={locale} report={vm.report} assessmentId={assessmentId} canExport={canExport} />

        <p className="border-t border-[var(--border-subtle)] pt-6 text-xs leading-relaxed text-[var(--muted)]">{vm.disclaimer}</p>
      </main>

      <SourceDrawer locale={locale} source={openSource} onClose={() => setOpenSource(null)} />
    </div>
  );
}
