import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { buildWorkspaceViewModel } from "@/lib/view-models/adapters";
import type { EvaluationViewInput, WorkspaceContext } from "@/lib/view-models/types";
import { GLOSSARY, term, levelLabel } from "@/lib/i18n/glossary";
import { formatDate, formatDateShort, formatNumber, formatScore, formatPercent } from "@/lib/i18n/format";
import { FALLBACK_DISCLAIMERS } from "@/lib/governance/disclaimers";
import { VerificationBadge, ProfessionalReviewBadge, FreshnessIndicator, PlanningIndicator } from "@/components/workspace/badges";
import { SourceDrawer } from "@/components/workspace/source-drawer";
import { EmptyState, ErrorState, NoAssessmentState } from "@/components/workspace/states";
import type { SourceVM } from "@/lib/view-models/types";

const html = (el: React.ReactElement) => renderToStaticMarkup(el);
const ARABIC = /[؀-ۿ]/;
const ARABIC_INDIC_DIGITS = /[٠-٩۰-۹]/;
// A rough "has Latin letters" check to catch untranslated English fragments in AR.
const LATIN_WORD = /[A-Za-z]{3,}/;

describe("terminology glossary", () => {
  it("has a non-empty, distinct EN and AR value for every term", () => {
    for (const [key, val] of Object.entries(GLOSSARY)) {
      expect(val.en.trim(), `${key}.en`).not.toBe("");
      expect(val.ar.trim(), `${key}.ar`).not.toBe("");
      expect(val.ar, `${key} should be translated`).not.toBe(val.en);
      expect(ARABIC.test(val.ar), `${key}.ar should contain Arabic`).toBe(true);
    }
  });

  it("resolves terms and levels per locale", () => {
    expect(term("en", "planningIndicator")).toBe("Planning indicator");
    expect(term("ar", "planningIndicator")).toBe("مؤشر التخطيط");
    expect(levelLabel("en", "HIGH")).toBe("High");
    expect(levelLabel("ar", "HIGH")).toBe("مرتفع");
  });
});

describe("locale-aware formatting", () => {
  const d = "2026-07-11T00:00:00Z";

  it("formats dates as Gregorian with Latin numerals in both locales", () => {
    const en = formatDate("en", d);
    const ar = formatDate("ar", d);
    expect(en).toMatch(/2026/);
    expect(ar).toMatch(/2026/); // Gregorian year, not Hijri
    expect(ARABIC_INDIC_DIGITS.test(ar)).toBe(false); // Latin numerals
    expect(ARABIC.test(ar)).toBe(true); // Arabic month name
    expect(formatDate("en", null)).toBe("—");
    expect(formatDateShort("en", d)).toMatch(/\d{2}\/\d{2}\/2026/);
  });

  it("formats numbers, scores and percentages with Latin numerals", () => {
    expect(formatScore("ar", 74)).toBe("74/100");
    expect(ARABIC_INDIC_DIGITS.test(formatNumber("ar", 1234))).toBe(false);
    expect(formatPercent("en", 74)).toBe("74%");
  });
});

describe("legal disclaimers are bilingual", () => {
  it("every disclaimer context has EN and AR copy", () => {
    for (const [ctx, copy] of Object.entries(FALLBACK_DISCLAIMERS)) {
      expect(copy.en.trim(), `${ctx}.en`).not.toBe("");
      expect(copy.ar.trim(), `${ctx}.ar`).not.toBe("");
      expect(ARABIC.test(copy.ar), `${ctx}.ar Arabic`).toBe(true);
    }
    // Guidance-only boundary preserved in both languages.
    expect(FALLBACK_DISCLAIMERS.PLATFORM.en).toMatch(/does not.*guarantee/i);
    expect(FALLBACK_DISCLAIMERS.PLATFORM.ar).toMatch(/لا تضمن/);
  });
});

describe("Arabic workspace rendering (no English fragments)", () => {
  it("badges render Arabic labels", () => {
    expect(html(<VerificationBadge locale="ar" state={{ requiresVerification: true, requiresProfessionalReview: false }} />)).toContain("يلزم تحقق رسمي");
    expect(html(<ProfessionalReviewBadge locale="ar" state={{ requiresVerification: false, requiresProfessionalReview: true }} />)).toContain("يوصى بمراجعة مهنية");
    expect(html(<FreshnessIndicator locale="ar" state="STALE" />)).toContain("متقادم");
  });

  it("planning indicator keeps Latin score but Arabic label", () => {
    const out = html(<PlanningIndicator locale="ar" planning={{ score: 74, label: "أولوية تخطيط أعلى", factors: [], disclaimer: "" }} />);
    expect(out).toContain("مؤشر التخطيط");
    expect(out).toContain("74/100");
  });

  it("English and Arabic states have no leaked strings from the other language", () => {
    const enEmpty = html(<EmptyState locale="en" />);
    const arEmpty = html(<EmptyState locale="ar" />);
    expect(ARABIC.test(enEmpty)).toBe(false);
    // Arabic state body should be Arabic (icons are SVG, not Latin words in copy)
    const arText = arEmpty.replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, " ");
    expect(ARABIC.test(arText)).toBe(true);
    expect(LATIN_WORD.test(arText)).toBe(false);
    html(<ErrorState locale="ar" />);
    html(<NoAssessmentState locale="ar" />);
  });
});

describe("adapter localizes leaked fragments (titles, fact values, authorities)", () => {
  const view = {
    id: "e1",
    createdAt: "2026-07-11T00:00:00Z",
    informationCutoff: "2026-07-11T00:00:00Z",
    facts: {
      "company.origin": { value: "foreign", source: "provided", confidence: "HIGH", labelEn: "Company origin", labelAr: "أصل الشركة" },
      objective: { value: "setup", source: "provided", confidence: "HIGH", labelEn: "Entry objective", labelAr: "هدف الدخول" },
    },
    recommendations: [
      {
        ruleKey: "misa_investment", ruleVersion: 1, pathwayId: "p1", titleEn: "MISA Path", titleAr: "مسار وزارة الاستثمار",
        order: 0, priorityScore: 74, priorityFactors: [], uncertainty: "MEDIUM", requiresVerification: true, requiresProfessionalReview: false,
        reason: "r", reasoning: { triggeredFacts: [], localized: { en: "e", ar: "ع" }, sources: [] },
      },
    ],
    dependencies: [],
    assumptions: [],
    risks: [],
    sources: [
      { id: "s1", title: "MISA (official)", url: "https://misa.gov.sa", status: "PUBLISHED", classification: "OFFICIAL_PRIMARY", version: 1, authority: "Ministry of Investment (MISA)", authorityAr: "وزارة الاستثمار", language: "en", lastVerified: "2026-06-01", nextReview: "2026-12-01", stale: false },
    ],
    nextActions: [],
    excludedPathways: [],
    summary: { matchedRules: 1, excludedRules: 0, candidatePathways: 1, assumptions: 0, risks: 0, professionalReviewRequired: false, officialVerificationRequired: true, disclaimer: "planning indicators only" },
  } as unknown as EvaluationViewInput;
  const ctx: WorkspaceContext = { companyName: "شركة", country: "الإمارات", companyType: "foreign", entryGoal: "setup", hasAssessment: true };

  it("uses the Arabic pathway title, fact values, and authority name in ar", () => {
    const ar = buildWorkspaceViewModel(view, ctx, "ar", new Date("2026-07-11T00:00:00Z"));
    expect(ar.includedPathways[0].title).toBe("مسار وزارة الاستثمار");
    const origin = ar.context.provided.find((f) => f.key === "company.origin");
    expect(origin?.value).toBe("أجنبية");
    const objective = ar.context.provided.find((f) => f.key === "objective");
    expect(objective?.value).toBe("تأسيس كيان قانوني"); // ENTRY_GOALS setup labelAr
    expect(ar.sources[0].authority).toBe("وزارة الاستثمار");
  });

  it("uses English equivalents in en", () => {
    const en = buildWorkspaceViewModel(view, ctx, "en", new Date("2026-07-11T00:00:00Z"));
    expect(en.includedPathways[0].title).toBe("MISA Path");
    expect(en.context.provided.find((f) => f.key === "company.origin")?.value).toBe("Foreign");
    expect(en.sources[0].authority).toBe("Ministry of Investment (MISA)");
  });
});

describe("source drawer i18n + LTR URL handling", () => {
  const source: SourceVM = {
    id: "s1", title: "MISA (official)", authority: "Ministry of Investment (MISA)", classification: "OFFICIAL_PRIMARY",
    url: "https://misa.gov.sa", language: "en", version: 1, lastVerified: "2026-06-01", nextReview: "2026-12-01",
    freshness: "FRESH", external: true,
  };

  it("renders RTL with Arabic labels while keeping the source URL intact and LTR-safe", () => {
    const out = html(<SourceDrawer locale="ar" source={source} onClose={() => {}} />);
    expect(out).toContain('dir="rtl"');
    expect(out).toContain("آخر تحقق"); // last verified (glossary)
    expect(out).toContain("المراجعة التالية"); // next review
    expect(out).toContain('href="https://misa.gov.sa"'); // URL preserved verbatim
    expect(out).toContain("مغادرة"); // external-link leaving warning (Arabic)
  });
});
