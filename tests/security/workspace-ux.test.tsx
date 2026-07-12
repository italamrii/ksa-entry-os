import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { buildWorkspaceViewModel } from "@/lib/view-models/adapters";
import type { EvaluationViewInput, WorkspaceContext } from "@/lib/view-models/types";
import { ExecutiveSummary } from "@/components/workspace/executive-summary";
import { PathwayCanvas, ExcludedPathways } from "@/components/workspace/pathways";
import { AssumptionsPanel, RiskLayer, NextActionFlow, SourceList } from "@/components/workspace/panels";
import { SourceDrawer } from "@/components/workspace/source-drawer";
import { LoadingState, EmptyState, ErrorState, UnauthorizedState, PartialDataState } from "@/components/workspace/states";
import { VerificationBadge, ProfessionalReviewBadge, FreshnessIndicator } from "@/components/workspace/badges";

const view: EvaluationViewInput = {
  id: "e1",
  createdAt: "2026-07-11T00:00:00Z",
  informationCutoff: "2026-07-11T00:00:00Z",
  facts: {
    "company.origin": { value: "foreign", source: "provided", confidence: "HIGH", labelEn: "Company origin", labelAr: "أصل الشركة" },
    "ownership.foreign": { value: true, source: "inferred", confidence: "HIGH", labelEn: "Foreign ownership", labelAr: "ملكية أجنبية" },
  },
  recommendations: [
    {
      ruleKey: "misa_investment", ruleVersion: 1, pathwayId: "p1", order: 0, priorityScore: 74,
      priorityFactors: [{ key: "base", labelEn: "Base", labelAr: "الأساس", contribution: 50 }, { key: "complexity", labelEn: "Complexity (high)", labelAr: "التعقيد", contribution: 0 }],
      uncertainty: "MEDIUM", requiresVerification: true, requiresProfessionalReview: true, reason: "fallback reason",
      reasoning: {
        triggeredFacts: [{ key: "company.origin", value: "foreign", source: "provided", confidence: "HIGH" }],
        localized: { en: "Because Company origin, MISA applies.", ar: "بناءً على أصل الشركة، تنطبق." },
        sources: [{ id: "s1", title: "MISA (official)", url: "https://misa.gov.sa", status: "PUBLISHED", classification: "OFFICIAL_PRIMARY", version: 1, authority: "Ministry of Investment (MISA)", lastVerified: "2026-06-01", nextReview: "2026-12-01", stale: false }],
      },
    },
  ],
  dependencies: [{ pathwayId: "p1", stepId: "st1", order: 0, titleEn: "Register with MISA", titleAr: "التسجيل", requiresVerification: true, requiresProfessionalReview: false, dependsOn: [] }],
  assumptions: [{ key: "assume.foreign_ownership", textEn: "Assumes foreign ownership structure.", textAr: "يفترض ملكية أجنبية.", confidence: "MEDIUM", impactIfFalseEn: "MISA licensing may not apply.", impactIfFalseAr: "قد لا ينطبق.", ruleKey: "misa_investment" }],
  risks: [
    { category: "PROFESSIONAL_REVIEW_NEEDED", severity: "MEDIUM", rationaleEn: "touches legal areas", rationaleAr: "مجالات قانونية", mitigationEn: "Consult a licensed professional", mitigationAr: "استشر مختصًا", ruleKey: "misa_investment" },
    { category: "OUTDATED_SOURCE", severity: "HIGH", rationaleEn: "source past review", rationaleAr: "مصدر قديم", mitigationEn: "Re-verify the source", mitigationAr: "أعد التحقق" },
  ],
  sources: [
    { id: "s1", title: "MISA (official)", url: "https://misa.gov.sa", status: "PUBLISHED", classification: "OFFICIAL_PRIMARY", version: 1, authority: "Ministry of Investment (MISA)", language: "en", lastVerified: "2026-06-01", nextReview: "2026-12-01", stale: false },
    { id: "s2", title: "Old source", url: "https://old.gov.sa", status: "STALE", classification: "OFFICIAL_PRIMARY", version: 1, authority: "Old Authority", language: "en", lastVerified: null, nextReview: "2026-01-01", stale: true },
  ],
  nextActions: [{ ruleKey: "misa_investment", titleEn: "Review the MISA pathway", titleAr: "راجع مسار الوزارة", requiresVerification: true, requiresProfessionalReview: true, officialSourceUrl: "https://misa.gov.sa", order: 0 }],
  excludedPathways: [{ ruleKey: "gosi_registration", pathwaySlug: "pw-gosi-employer", reasonEn: "Conditions not met (intent.hiring).", reasonAr: "لم تتحقق الشروط.", failedFacts: ["intent.hiring"] }],
  summary: { matchedRules: 1, excludedRules: 1, candidatePathways: 1, assumptions: 1, risks: 2, professionalReviewRequired: true, officialVerificationRequired: true, disclaimer: "Priority scores are planning indicators only." },
};

const ctx: WorkspaceContext = { companyName: "Acme", country: "UK", companyType: "foreign", entryGoal: "setup", hasAssessment: true };
const html = (el: React.ReactElement) => renderToStaticMarkup(el);
const vmEn = buildWorkspaceViewModel(view, ctx, "en", new Date("2026-07-11T00:00:00Z"));

describe("workspace adapters (no rule recomputation)", () => {
  const vm = buildWorkspaceViewModel(view, ctx, "en", new Date("2026-07-11T00:00:00Z"));

  it("maps included/excluded pathways without adding or dropping any", () => {
    expect(vm.includedPathways).toHaveLength(view.recommendations.length);
    expect(vm.excludedPathways).toHaveLength(view.excludedPathways.length);
    expect(vm.excludedPathways[0].reason).toMatch(/Conditions not met/);
    expect(vm.excludedPathways[0].failedFacts).toContain("intent.hiring");
  });

  it("passes the engine planning score through unchanged", () => {
    expect(vm.includedPathways[0].planning?.score).toBe(74);
    expect(vm.summary.planning?.score).toBe(74);
    expect(vm.includedPathways[0].complexity).toBe("HIGH");
  });

  it("splits provided vs inferred facts", () => {
    expect(vm.context.provided.map((f) => f.key)).toContain("company.origin");
    expect(vm.context.inferred.map((f) => f.key)).toContain("ownership.foreign");
  });

  it("surfaces assumptions, risks, sources, verification, and freshness", () => {
    expect(vm.assumptions[0].statement).toMatch(/foreign ownership/i);
    expect(vm.risks.map((r) => r.severity)).toContain("HIGH");
    expect(vm.summary.verification.requiresVerification).toBe(true);
    expect(vm.summary.verification.requiresProfessionalReview).toBe(true);
    expect(vm.sources.find((s) => s.id === "s2")?.freshness).toBe("STALE");
  });

  it("localizes to Arabic and sets RTL direction", () => {
    const ar = buildWorkspaceViewModel(view, ctx, "ar", new Date("2026-07-11T00:00:00Z"));
    expect(ar.dir).toBe("rtl");
    expect(ar.risks.map((r) => r.category)).toContain("تلزم مراجعة مهنية");
  });
});

describe("workspace component rendering", () => {
  const vm = buildWorkspaceViewModel(view, ctx, "en", new Date("2026-07-11T00:00:00Z"));

  it("executive summary shows a planning indicator, not approval odds", () => {
    const out = html(<ExecutiveSummary locale="en" summary={vm.summary} />);
    expect(out).toContain("Planning indicator");
    expect(out.toLowerCase()).not.toContain("approval probability");
    expect(out).toContain('role="meter"');
  });

  it("pathway canvas shows inclusion reasoning and source triggers", () => {
    const out = html(<PathwayCanvas locale="en" pathways={vm.includedPathways} />);
    expect(out).toContain("MISA applies");
    expect(out).toContain("Source");
    expect(out).toContain("<button");
    expect(out).toContain("<details"); // progressive disclosure of evidence
  });

  it("excluded pathways show a reason", () => {
    const out = html(<ExcludedPathways locale="en" pathways={vm.excludedPathways} />);
    expect(out).toContain("Conditions not met");
  });

  it("assumptions expose confirm/reject controls", () => {
    const out = html(<AssumptionsPanel locale="en" assumptions={vm.assumptions} />);
    expect(out).toContain("Confirm");
    expect(out).toContain("Reject");
  });

  it("risk layer shows severity and a next verification step", () => {
    const out = html(<RiskLayer locale="en" risks={vm.risks} />);
    expect(out).toContain("High");
    expect(out).toContain("Next step");
  });

  it("next actions warn that completion does not guarantee approval and link out safely", () => {
    const out = html(<NextActionFlow locale="en" actions={vm.nextActions} />);
    expect(out).toContain("does not guarantee");
    expect(out).toContain('rel="noopener noreferrer nofollow"');
  });

  it("stale source is flagged as outdated (not color-only)", () => {
    const out = html(<SourceList locale="en" sources={vm.sources} />);
    expect(out).toContain("Outdated");
  });

  it("badges carry text for verification and professional review", () => {
    expect(html(<VerificationBadge locale="en" state={{ requiresVerification: true, requiresProfessionalReview: false }} />)).toContain("Official verification required");
    expect(html(<ProfessionalReviewBadge locale="en" state={{ requiresVerification: false, requiresProfessionalReview: true }} />)).toContain("Professional review");
    expect(html(<FreshnessIndicator locale="en" state="STALE" />)).toContain("Outdated");
  });
});

describe("workspace states", () => {
  it("loading is a status region", () => {
    expect(html(<LoadingState locale="en" />)).toContain('role="status"');
  });
  it("empty, partial, error and unauthorized states explain what/next", () => {
    expect(html(<EmptyState locale="en" />)).toContain("Nothing here yet");
    expect(html(<PartialDataState locale="en" />)).toContain("partial");
    expect(html(<ErrorState locale="en" />)).toContain('role="alert"');
    expect(html(<UnauthorizedState locale="en" />)).toContain("different organization");
  });
});

describe("source drawer accessibility", () => {
  it("is a labelled modal dialog with an external-link warning and a keyboard-closable control", () => {
    const out = html(<SourceDrawer locale="en" source={vmEn.sources[0]} onClose={() => {}} />);
    expect(out).toContain('role="dialog"');
    expect(out).toContain('aria-modal="true"');
    expect(out).toContain("leave KSA Entry OS");
    expect(out).toContain('aria-label="Close"');
    expect(out).toContain('rel="noopener noreferrer nofollow"');
  });
  it("renders RTL for Arabic", () => {
    const out = html(<SourceDrawer locale="ar" source={vmEn.sources[0]} onClose={() => {}} />);
    expect(out).toContain('dir="rtl"');
  });
  it("renders nothing when no source is selected", () => {
    expect(html(<SourceDrawer locale="en" source={null} onClose={() => {}} />)).toBe("");
  });
});
