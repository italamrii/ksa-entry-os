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
import { SourceRail } from "./source-rail";
import { AppShell } from "@/components/layout/app-shell";

/**
 * Spatial executive decision workspace aligned to approved reference (IMAGE B).
 * Left rail → summary strip → pathway canvas → decision band → permanent source rail.
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
        <div className="mx-auto grid w-full min-w-0 max-w-[1680px] gap-0 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0 space-y-5 px-3 py-4 sm:px-5 lg:space-y-6 lg:px-6 lg:py-5">
            <ExecutiveSummary locale={locale} summary={vm.summary} />

            <PathwayCanvas
              locale={locale}
              pathways={vm.includedPathways}
              dependencies={vm.dependencies}
              authorities={vm.authorities}
              sources={vm.sources}
              summary={vm.summary}
              context={vm.context}
              onFocusPathway={setActivePathwayKey}
              onOpenSource={setOpenSource}
              activePathwayKey={activePathwayKey}
            />

            <section
              aria-label={t(locale, "Decision modules", "وحدات القرار")}
              className="decision-band grid gap-px overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--border-subtle)] lg:grid-cols-3"
            >
              <div id="assumptions" className="scroll-mt-24 bg-[var(--card)] p-4 sm:p-5">
                <AssumptionsPanel locale={locale} assumptions={vm.assumptions} onDecide={onDecide} embedded />
              </div>
              <div id="risks" className="scroll-mt-24 bg-[var(--card)] p-4 sm:p-5">
                <RiskLayer locale={locale} risks={vm.risks} embedded />
              </div>
              <div id="next-actions" className="scroll-mt-24 bg-[var(--card)] p-4 sm:p-5">
                <NextActionFlow locale={locale} actions={vm.nextActions} embedded />
              </div>
            </section>

            <details className="group rounded-lg border border-[var(--border-subtle)] bg-[var(--card)] open:pb-2">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-foreground outline-none marker:content-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_45%,transparent)] [&::-webkit-details-marker]:hidden">
                {t(locale, "Additional workspace detail", "تفاصيل إضافية لمساحة العمل")}
                <span className="ms-2 text-xs font-normal text-[var(--muted)]">
                  {t(locale, "Context, authorities, exclusions", "السياق والجهات والاستبعادات")}
                </span>
              </summary>
              <div className="space-y-6 border-t border-[var(--border-subtle)] px-4 py-4">
                <CompanyContext locale={locale} provided={vm.context.provided} inferred={vm.context.inferred} />
                <PathwayComparison locale={locale} pathways={vm.includedPathways} />
                <ExcludedPathways locale={locale} pathways={vm.excludedPathways} />
                <AuthorityMatrix locale={locale} authorities={vm.authorities} />
                <ReportWorkspace
                  locale={locale}
                  report={vm.report}
                  assessmentId={assessmentId}
                  canExport={canExport}
                />
              </div>
            </details>

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

            <p className="border-t border-[var(--border-subtle)] pt-4 text-xs leading-relaxed text-[var(--muted)]">
              {vm.disclaimer}
            </p>
          </div>

          <SourceRail
            locale={locale}
            sources={vm.sources}
            verifiedCount={verifiedCount}
            informationCutoff={vm.summary.informationCutoff}
            onOpenSource={setOpenSource}
          />
        </div>
      </AppShell>

      <SourceDrawer locale={locale} source={openSource} onClose={() => setOpenSource(null)} />
    </div>
  );
}
