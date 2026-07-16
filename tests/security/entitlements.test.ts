import { describe, it, expect } from "vitest";
import {
  entitlementsFor,
  tierFromPaidPlans,
  isSafetyContentGated,
  type EntitlementTier,
} from "@/lib/payments/entitlements";
import {
  reportContractFor,
  contractIncludesSafetySections,
  ALWAYS_INCLUDED_SAFETY_SECTIONS,
} from "@/lib/reports/contracts";

describe("plan entitlement tiers", () => {
  it("derives the tier from verified-paid plans only", () => {
    expect(tierFromPaidPlans([])).toBe("FREE");
    expect(tierFromPaidPlans(["FREE"])).toBe("FREE");
    expect(tierFromPaidPlans(["PROFESSIONAL"])).toBe("STANDARD");
    expect(tierFromPaidPlans(["BUSINESS"])).toBe("PROFESSIONAL");
    // Highest paid plan wins.
    expect(tierFromPaidPlans(["PROFESSIONAL", "BUSINESS"])).toBe("PROFESSIONAL");
  });

  it("STANDARD is limited in depth: condensed pathways, no deep modules or appendix", () => {
    const e = entitlementsFor("STANDARD");
    expect(e.pdfExport).toBe(true);
    expect(e.pdfVariant).toBe("STANDARD");
    expect(e.allPathways).toBe(false);
    expect(e.maxPathways).toBe(6);
    expect(e.pathwayComparison).toBe(false);
    expect(e.fullTaxAnalysis).toBe(false);
    expect(e.ongoingComplianceCalendar).toBe(false);
    expect(e.evidenceAppendix).toBe(false);
    expect(e.fullSourceMetadata).toBe(false);
    expect(e.showUpgradePrompt).toBe(true);
  });

  it("PROFESSIONAL is complete: all pathways, full analysis, evidence appendix", () => {
    const e = entitlementsFor("PROFESSIONAL");
    expect(e.allPathways).toBe(true);
    expect(e.maxPathways).toBeNull();
    expect(e.pathwayComparison).toBe(true);
    expect(e.dependencyCriticalPath).toBe(true);
    expect(e.detailedModules).toBe(true);
    expect(e.fullTaxAnalysis).toBe(true);
    expect(e.ongoingComplianceCalendar).toBe(true);
    expect(e.fullSourceMetadata).toBe(true);
    expect(e.evidenceAppendix).toBe(true);
    expect(e.reportSnapshots).toBe(true);
    expect(e.pdfVariant).toBe("PROFESSIONAL");
    expect(e.showUpgradePrompt).toBe(false);
  });

  it("FREE cannot export a PDF", () => {
    const e = entitlementsFor("FREE");
    expect(e.pdfExport).toBe(false);
    expect(e.pdfVariant).toBe("NONE");
  });

  it("CRITICAL: safety content is never paywalled on ANY tier", () => {
    for (const tier of ["FREE", "STANDARD", "PROFESSIONAL"] as EntitlementTier[]) {
      const e = entitlementsFor(tier);
      expect(e.safetyDisclaimers, `${tier} disclaimers`).toBe(true);
      expect(e.officialVerificationWarnings, `${tier} verification warnings`).toBe(true);
      expect(e.professionalReviewWarnings, `${tier} professional-review warnings`).toBe(true);
      expect(e.staleSourceWarnings, `${tier} stale-source warnings`).toBe(true);
      expect(isSafetyContentGated(e), `${tier} must not gate safety`).toBe(false);
    }
  });
});

describe("report contracts (Stage 8 readiness)", () => {
  it("Standard contract is limited to an 8–12 page target with core sections", () => {
    const contract = reportContractFor(entitlementsFor("STANDARD"))!;
    expect(contract.variant).toBe("STANDARD");
    expect(contract.targetPageRange).toEqual([8, 12]);
    for (const s of ["cover", "executiveSummary", "companyContext", "topPathway", "coreSteps", "coreAuthorities", "taxSummary", "topRisks", "nextActions"] as const) {
      expect(contract.sections, `standard must include ${s}`).toContain(s);
    }
    // Depth-limited: no full analysis / appendix / all pathways.
    for (const s of ["allPathways", "evidenceAppendix", "taxAnalysisFull", "ongoingCompliance", "sourceMetadata"] as const) {
      expect(contract.sections, `standard must NOT include ${s}`).not.toContain(s);
    }
    expect(contract.limits.maxPathways).toBe(6);
  });

  it("Professional contract is complete and unbounded", () => {
    const contract = reportContractFor(entitlementsFor("PROFESSIONAL"))!;
    expect(contract.variant).toBe("PROFESSIONAL");
    expect(contract.targetPageRange).toBeNull();
    for (const s of ["allPathways", "detailedRequirements", "taxAnalysisFull", "municipalModule", "labourModule", "importModule", "sectorModule", "dependencies", "sourceMetadata", "ongoingCompliance", "evidenceAppendix"] as const) {
      expect(contract.sections, `professional must include ${s}`).toContain(s);
    }
    expect(contract.limits.maxPathways).toBeNull();
  });

  it("CRITICAL: every contract carries the safety sections (never behind a paywall)", () => {
    for (const tier of ["STANDARD", "PROFESSIONAL"] as EntitlementTier[]) {
      const contract = reportContractFor(entitlementsFor(tier))!;
      expect(contractIncludesSafetySections(contract), `${tier} safety sections`).toBe(true);
      for (const s of ALWAYS_INCLUDED_SAFETY_SECTIONS) {
        expect(contract.sections, `${tier} must include ${s}`).toContain(s);
      }
    }
  });

  it("FREE has no report contract (no export entitlement)", () => {
    expect(reportContractFor(entitlementsFor("FREE"))).toBeNull();
  });
});
