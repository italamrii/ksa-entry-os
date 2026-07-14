import { notFound } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { buildWorkspaceViewModel } from "@/lib/view-models/adapters";
import type { EvaluationViewInput, WorkspaceContext } from "@/lib/view-models/types";
import { SiteHeader } from "@/components/layout/site-header";

/**
 * Development-only spatial workspace fixture for visual QA against IMAGE B.
 * Never mounts in production builds.
 */
export default async function DesignPreviewWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const params = await searchParams;
  const locale = params.lang === "ar" ? "ar" : "en";

  const view: EvaluationViewInput = {
    id: "preview-eval",
    createdAt: "2026-07-11T00:00:00Z",
    informationCutoff: "2026-07-11T08:42:00Z",
    facts: {
      "company.origin": {
        value: "foreign",
        source: "provided",
        confidence: "HIGH",
        labelEn: "Company origin",
        labelAr: "أصل الشركة",
      },
      "ownership.foreign": {
        value: true,
        source: "inferred",
        confidence: "HIGH",
        labelEn: "Foreign ownership",
        labelAr: "ملكية أجنبية",
      },
      "intent.entity": {
        value: "wfoe",
        source: "provided",
        confidence: "HIGH",
        labelEn: "Entry objective",
        labelAr: "هدف الدخول",
      },
    },
    recommendations: [
      {
        ruleKey: "misa_investment",
        ruleVersion: 1,
        pathwayId: "p1",
        order: 0,
        priorityScore: 78,
        priorityFactors: [
          { key: "base", labelEn: "Base", labelAr: "الأساس", contribution: 50 },
          { key: "complexity", labelEn: "Complexity", labelAr: "التعقيد", contribution: 28 },
        ],
        uncertainty: "MEDIUM",
        requiresVerification: true,
        requiresProfessionalReview: true,
        reason: "Because company origin is foreign, MISA applies for investment licensing.",
        titleEn: "Wholly Foreign-Owned Company (WFOE)",
        titleAr: "شركة أجنبية مملوكة بالكامل",
        reasoning: {
          triggeredFacts: [{ key: "company.origin", value: "foreign", source: "provided", confidence: "HIGH" }],
          localized: {
            en: "Because Company origin, MISA applies.",
            ar: "بناءً على أصل الشركة، تنطبق وزارة الاستثمار.",
          },
          sources: [
            {
              id: "s1",
              title: "MISA Investment Guide",
              url: "https://misa.gov.sa",
              status: "PUBLISHED",
              classification: "OFFICIAL_PRIMARY",
              version: 1,
              authority: "Ministry of Investment (MISA)",
              lastVerified: "2026-07-11",
              nextReview: "2026-12-01",
              stale: false,
            },
          ],
        },
      },
    ],
    dependencies: [
      {
        pathwayId: "p1",
        stepId: "st1",
        order: 0,
        titleEn: "Validate activity scope with MISA",
        titleAr: "التحقق من نطاق النشاط مع وزارة الاستثمار",
        requiresVerification: true,
        requiresProfessionalReview: false,
        dependsOn: [],
      },
      {
        pathwayId: "p1",
        stepId: "st2",
        order: 1,
        titleEn: "ZATCA readiness checklist",
        titleAr: "قائمة جاهزية الزكاة والضريبة",
        requiresVerification: true,
        requiresProfessionalReview: false,
        dependsOn: ["st1"],
      },
    ],
    assumptions: [
      {
        key: "assume.foreign_ownership",
        textEn: "100% foreign ownership permitted for this activity",
        textAr: "يُسمح بالملكية الأجنبية بنسبة ١٠٠٪ لهذا النشاط",
        confidence: "HIGH",
        impactIfFalseEn: "Joint venture routes may apply instead.",
        impactIfFalseAr: "قد تنطبق مسارات المشروع المشترك.",
        ruleKey: "misa_investment",
      },
      {
        key: "assume.entity",
        textEn: "New legal entity required in KSA",
        textAr: "يلزم كيان قانوني جديد في المملكة",
        confidence: "MEDIUM",
        impactIfFalseEn: "Branch pathway may replace WFOE.",
        impactIfFalseAr: "قد يحل مسار الفرع محل الشركة المملوكة بالكامل.",
        ruleKey: "misa_investment",
      },
    ],
    risks: [
      {
        category: "REGULATORY",
        severity: "MEDIUM",
        rationaleEn: "Activity scope may need licensing confirmation",
        rationaleAr: "قد يحتاج نطاق النشاط إلى تأكيد الترخيص",
        mitigationEn: "Validate with MISA before filing",
        mitigationAr: "تحقق مع الوزارة قبل التقديم",
        ruleKey: "misa_investment",
      },
      {
        category: "OPERATIONAL",
        severity: "LOW",
        rationaleEn: "Local presence timing uncertain",
        rationaleAr: "توقيت الحضور المحلي غير مؤكد",
        mitigationEn: "Sequence office setup after licensing",
        mitigationAr: "رتّب المكتب بعد الترخيص",
        ruleKey: "misa_investment",
      },
    ],
    sources: [
      {
        id: "s1",
        title: "Investment licensing overview",
        url: "https://misa.gov.sa",
        status: "PUBLISHED",
        classification: "OFFICIAL_PRIMARY",
        version: 1,
        authority: "Ministry of Investment",
        language: "en",
        lastVerified: "2026-07-11",
        nextReview: "2026-12-01",
        stale: false,
      },
      {
        id: "s2",
        title: "Business setup services",
        url: "https://business.sa",
        status: "PUBLISHED",
        classification: "OFFICIAL_PRIMARY",
        version: 1,
        authority: "Saudi Business Center",
        language: "en",
        lastVerified: "2026-07-10",
        nextReview: "2026-11-01",
        stale: false,
      },
      {
        id: "s3",
        title: "ZATCA e-services",
        url: "https://zatca.gov.sa",
        status: "PUBLISHED",
        classification: "OFFICIAL_PRIMARY",
        version: 1,
        authority: "ZATCA",
        language: "en",
        lastVerified: "2026-07-09",
        nextReview: "2026-10-01",
        stale: false,
      },
      {
        id: "s4",
        title: "Commercial registration notes",
        url: "https://mc.gov.sa",
        status: "PUBLISHED",
        classification: "OFFICIAL_SECONDARY",
        version: 1,
        authority: "Ministry of Commerce",
        language: "en",
        lastVerified: "2026-07-08",
        nextReview: "2026-09-01",
        stale: false,
      },
    ],
    nextActions: [
      {
        ruleKey: "misa_investment",
        titleEn: "Validate activity scope with MISA",
        titleAr: "تحقق من نطاق النشاط مع وزارة الاستثمار",
        requiresVerification: true,
        requiresProfessionalReview: false,
        officialSourceUrl: "https://misa.gov.sa",
        order: 0,
      },
      {
        ruleKey: "misa_investment",
        titleEn: "Confirm entity capital documentation",
        titleAr: "تأكيد وثائق رأس مال الكيان",
        requiresVerification: true,
        requiresProfessionalReview: true,
        officialSourceUrl: "https://business.sa",
        order: 1,
      },
    ],
    excludedPathways: [],
    summary: {
      matchedRules: 1,
      excludedRules: 0,
      candidatePathways: 1,
      assumptions: 2,
      risks: 2,
      professionalReviewRequired: true,
      officialVerificationRequired: true,
      disclaimer: "Planning indicators only — not an approval forecast.",
      disclaimerAr: "مؤشرات تخطيط فقط — وليست توقع موافقة.",
    },
  };

  const ctx: WorkspaceContext = {
    companyName: "Vision Tech Solutions",
    country: "UAE",
    companyType: "foreign",
    entryGoal: "Establish a legal entity",
    hasAssessment: true,
  };

  const vm = buildWorkspaceViewModel(view, ctx, locale, new Date("2026-07-11T08:42:00Z"));

  return (
    <div className="flex min-h-screen flex-col dark">
      <SiteHeader locale={locale} isAuthenticated isAdmin />
      <WorkspaceShell vm={vm} assessmentId="preview" canExport={false} isAdmin />
    </div>
  );
}
