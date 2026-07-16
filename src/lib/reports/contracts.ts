/**
 * Report contracts for Stage 8 (PDF). CONTRACTS ONLY — this file defines the
 * section shape each tier is entitled to; it does not render or redesign the PDF.
 *
 * The Standard report is limited in DEPTH and LENGTH, never in safety: every
 * tier includes the disclaimer, official-verification, and professional-review
 * sections. Entitlement is resolved server-side.
 */
import type { Entitlements } from "@/lib/payments/entitlements";

export type ReportSectionKey =
  | "cover"
  | "executiveSummary"
  | "companyContext"
  | "topPathway"
  | "allPathways"
  | "coreSteps"
  | "detailedRequirements"
  | "coreAuthorities"
  | "authorityMatrix"
  | "taxSummary"
  | "taxAnalysisFull"
  | "municipalModule"
  | "labourModule"
  | "importModule"
  | "sectorModule"
  | "dependencies"
  | "assumptions"
  | "risks"
  | "topRisks"
  | "nextActions"
  | "keyOfficialLinks"
  | "sourceMetadata"
  | "evidenceAppendix"
  | "ongoingCompliance"
  | "informationCutoff"
  | "disclaimers";

export interface ReportContract {
  variant: "STANDARD" | "PROFESSIONAL";
  sections: ReportSectionKey[];
  targetPageRange: [number, number] | null;
  limits: {
    maxPathways: number | null;
    maxAssumptions: number | null;
    maxRisks: number | null;
  };
}

/** Sections that must appear on EVERY variant — safety is never paywalled. */
export const ALWAYS_INCLUDED_SAFETY_SECTIONS: ReportSectionKey[] = [
  "disclaimers",
  "informationCutoff",
  "keyOfficialLinks",
];

const STANDARD_CONTRACT: ReportContract = {
  variant: "STANDARD",
  sections: [
    "cover",
    "executiveSummary",
    "companyContext",
    "topPathway",
    "coreSteps",
    "coreAuthorities",
    "taxSummary",
    "topRisks",
    "nextActions",
    "keyOfficialLinks",
    "informationCutoff",
    "disclaimers",
  ],
  targetPageRange: [8, 12],
  limits: { maxPathways: 6, maxAssumptions: 5, maxRisks: 5 },
};

const PROFESSIONAL_CONTRACT: ReportContract = {
  variant: "PROFESSIONAL",
  sections: [
    "cover",
    "executiveSummary",
    "companyContext",
    "allPathways",
    "detailedRequirements",
    "authorityMatrix",
    "taxAnalysisFull",
    "municipalModule",
    "labourModule",
    "importModule",
    "sectorModule",
    "dependencies",
    "assumptions",
    "risks",
    "nextActions",
    "sourceMetadata",
    "ongoingCompliance",
    "evidenceAppendix",
    "keyOfficialLinks",
    "informationCutoff",
    "disclaimers",
  ],
  targetPageRange: null,
  limits: { maxPathways: null, maxAssumptions: null, maxRisks: null },
};

/** Resolve the report contract from server-side entitlements. */
export function reportContractFor(entitlements: Entitlements): ReportContract | null {
  if (!entitlements.pdfExport) return null;
  return entitlements.pdfVariant === "PROFESSIONAL" ? PROFESSIONAL_CONTRACT : STANDARD_CONTRACT;
}

export function contractIncludesSafetySections(contract: ReportContract): boolean {
  return ALWAYS_INCLUDED_SAFETY_SECTIONS.every((s) => contract.sections.includes(s));
}
