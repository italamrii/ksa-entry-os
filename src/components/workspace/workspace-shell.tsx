"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import type { SourceVM, WorkspaceViewModel } from "@/lib/view-models/types";
import { ExecutiveSummary } from "./executive-summary";
import { PathwayCanvas, PathwayComparison, ExcludedPathways } from "./pathways";
import {
  CompanyContext,
  AuthorityMatrix,
  AssumptionsPanel,
  RiskLayer,
  NextActionFlow,
  ReportWorkspace,
  SourceList,
} from "./panels";
import { NarrativePanel } from "./primitives";
import { SourceDrawer } from "./source-drawer";
import { AppShell } from "@/components/layout/app-shell";
import { FreshnessIndicator } from "./badges";

/**
 * Spatial executive decision workspace.
 * Composition: product rail → summary strip → pathway canvas → decision modules → evidence rail.
 */
export function WorkspaceShell({
  vm,
  assessmentId,
  canExport,
  isAdmin,
}: {
  vm: WorkspaceViewModel;
  assessmentId: string | null;
  canExport: boolean;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const { locale, dir } = vm;
  const [activePathwayKey, setActivePathwayKey] = useState<string | null>(
    vm.includedPathways[0]?.ruleKey ?? null
  );
  const [openSource, setOpenSource] = useState<SourceVM | null>(null);

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

  const verifiedCount = vm.sources.filter((s) => s.freshness === "FRESH").length;

  return (
    <div dir={dir}>
      <AppShell
        locale={locale}
        isAdmin={isAdmin}
        currentPath="/workspace"
        companyName={vm.summary.companyName}
        stageClassName="min-w-0"
      >
        <div className="mx-auto grid w-full min-w-0 max-w-[1600px] gap-0 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0 space-y-8 px-4 py-6 sm:px-6 lg:px-8">
            <ExecutiveSummary locale={locale} summary={vm.summary} />

            <PathwayCanvas
              locale={locale}
              pathways={vm.includedPathways}
              dependencies={vm.dependencies}
              onFocusPathway={setActivePathwayKey}
              onOpenSource={setOpenSource}
              activePathwayKey={activePathwayKey}
            />

            {/* Integrated decision modules — one band, not a card grid */}
            <section
              aria-label={t(locale, "Decision modules", "وحدات القرار")}
              className="decision-band grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--border-subtle)] lg:grid-cols-3"
            >
              <div id="assumptions" className="scroll-mt-24 bg-[var(--card)] p-5">
                <AssumptionsPanel locale={locale} assumptions={vm.assumptions} onDecide={onDecide} embedded />
              </div>
              <div id="risks" className="scroll-mt-24 bg-[var(--card)] p-5">
                <RiskLayer locale={locale} risks={vm.risks} embedded />
              </div>
              <div id="next-actions" className="scroll-mt-24 bg-[var(--card)] p-5">
                <NextActionFlow locale={locale} actions={vm.nextActions} embedded />
              </div>
            </section>

            <CompanyContext locale={locale} provided={vm.context.provided} inferred={vm.context.inferred} />
            <PathwayComparison locale={locale} pathways={vm.includedPathways} />
            <ExcludedPathways locale={locale} pathways={vm.excludedPathways} />
            <AuthorityMatrix locale={locale} authorities={vm.authorities} />

            <NarrativePanel
              id="sources"
              title={t(locale, "Official sources", "المصادر الرسمية")}
              description={t(
                locale,
                "Independently operated. Open to verify current requirements.",
                "مُشغَّلة بشكل مستقل. افتحها للتحقق من المتطلبات الحالية."
              )}
              className="xl:hidden"
            >
              {vm.sources.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">{t(locale, "No sources linked yet.", "لا مصادر مرتبطة بعد.")}</p>
              ) : (
                <SourceList locale={locale} sources={vm.sources} onOpenSource={setOpenSource} />
              )}
            </NarrativePanel>

            <ReportWorkspace
              locale={locale}
              report={vm.report}
              assessmentId={assessmentId}
              canExport={canExport}
            />

            <p className="border-t border-[var(--border-subtle)] pt-6 text-xs leading-relaxed text-[var(--muted)]">
              {vm.disclaimer}
            </p>
          </div>

          {/* Spatial evidence rail — desktop */}
          <aside
            aria-label={t(locale, "Official sources", "المصادر الرسمية")}
            className="hidden border-s border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--obsidian)_65%,transparent)] xl:flex xl:flex-col"
          >
            <div className="sticky top-[4.25rem] flex max-h-[calc(100vh-4.25rem)] flex-col overflow-hidden">
              <div className="border-b border-[var(--border-subtle)] px-4 py-4">
                <p className="text-overline">{t(locale, "Official sources", "المصادر الرسمية")}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {verifiedCount}/{vm.sources.length} {t(locale, "verified fresh", "حديثة ومتحقق منها")}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-3">
                {vm.sources.length === 0 ? (
                  <p className="px-1 text-sm text-[var(--muted)]">
                    {t(locale, "No sources linked yet.", "لا مصادر مرتبطة بعد.")}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {vm.sources.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => setOpenSource(s)}
                          aria-haspopup="dialog"
                          className="w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--card)] px-3 py-3 text-start outline-none transition hover:border-[color-mix(in_srgb,var(--highlight)_40%,transparent)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_50%,transparent)]"
                        >
                          <p className="truncate text-sm font-medium text-foreground">{s.title}</p>
                          <p className="mt-0.5 truncate text-[11px] text-[var(--muted)]">
                            {s.authority ?? t(locale, "Unknown authority", "جهة غير معروفة")}
                          </p>
                          <div className="mt-2">
                            <FreshnessIndicator locale={locale} state={s.freshness} />
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {vm.summary.informationCutoff && (
                <div className="border-t border-[var(--border-subtle)] px-4 py-3 text-[11px] text-[var(--muted)]">
                  <p>
                    {t(locale, "Information cutoff", "تاريخ توقف المعلومات")}:{" "}
                    {new Date(vm.summary.informationCutoff).toLocaleDateString(locale)}
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </AppShell>

      <SourceDrawer locale={locale} source={openSource} onClose={() => setOpenSource(null)} />
    </div>
  );
}
