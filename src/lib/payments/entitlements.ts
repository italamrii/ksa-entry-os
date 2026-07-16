/**
 * Plan entitlements — the single server-side authority on what a customer gets.
 *
 * Tiers are derived from a VERIFIED PAID payment (never from client state):
 *   FREE          — no paid payment: preview only
 *   STANDARD      — PROFESSIONAL plan paid: personalized core roadmap, limited PDF
 *   PROFESSIONAL  — BUSINESS plan paid: complete roadmap, full evidence + PDF
 *
 * SAFETY RULE (non-negotiable): safety-critical content is NEVER gated.
 * Disclaimers, official-verification warnings, professional-review warnings, and
 * stale-source warnings are available on every tier — a Standard report is
 * shallower, never misleading or less safe.
 */
import type { PlanType } from "@prisma/client";

export type EntitlementTier = "FREE" | "STANDARD" | "PROFESSIONAL";

export interface Entitlements {
  tier: EntitlementTier;
  // --- Roadmap depth ---
  /** Max pathways rendered/exported; null = unlimited. */
  maxPathways: number | null;
  allPathways: boolean;
  pathwayComparison: boolean;
  dependencyCriticalPath: boolean;
  /** Deep modules: municipal, labor, import, sector-specific. */
  detailedModules: boolean;
  fullTaxAnalysis: boolean;
  ongoingComplianceCalendar: boolean;
  // --- Evidence ---
  fullSourceMetadata: boolean;
  evidenceAppendix: boolean;
  /** Max assumptions/risks surfaced; null = unlimited. */
  maxAssumptions: number | null;
  maxRisks: number | null;
  // --- Reporting ---
  pdfExport: boolean;
  pdfVariant: "NONE" | "STANDARD" | "PROFESSIONAL";
  reportSnapshots: boolean;
  regenerateReports: boolean;
  // --- Always-on safety (never paywalled) ---
  safetyDisclaimers: true;
  officialVerificationWarnings: true;
  professionalReviewWarnings: true;
  staleSourceWarnings: true;
  // --- Commercial ---
  showUpgradePrompt: boolean;
}

const SAFETY = {
  safetyDisclaimers: true,
  officialVerificationWarnings: true,
  professionalReviewWarnings: true,
  staleSourceWarnings: true,
} as const;

const FREE: Entitlements = {
  tier: "FREE",
  maxPathways: 3,
  allPathways: false,
  pathwayComparison: false,
  dependencyCriticalPath: false,
  detailedModules: false,
  fullTaxAnalysis: false,
  ongoingComplianceCalendar: false,
  fullSourceMetadata: false,
  evidenceAppendix: false,
  maxAssumptions: 3,
  maxRisks: 3,
  pdfExport: false,
  pdfVariant: "NONE",
  reportSnapshots: false,
  regenerateReports: false,
  ...SAFETY,
  showUpgradePrompt: true,
};

const STANDARD: Entitlements = {
  tier: "STANDARD",
  // Limited in DEPTH, not in safety: condensed pathway details.
  maxPathways: 6,
  allPathways: false,
  pathwayComparison: false,
  dependencyCriticalPath: false,
  detailedModules: false,
  fullTaxAnalysis: false, // summary only
  ongoingComplianceCalendar: false,
  fullSourceMetadata: false, // limited source metadata
  evidenceAppendix: false,
  maxAssumptions: 5,
  maxRisks: 5,
  pdfExport: true,
  pdfVariant: "STANDARD",
  reportSnapshots: false,
  regenerateReports: false,
  ...SAFETY,
  showUpgradePrompt: true,
};

const PROFESSIONAL: Entitlements = {
  tier: "PROFESSIONAL",
  maxPathways: null,
  allPathways: true,
  pathwayComparison: true,
  dependencyCriticalPath: true,
  detailedModules: true,
  fullTaxAnalysis: true,
  ongoingComplianceCalendar: true,
  fullSourceMetadata: true,
  evidenceAppendix: true,
  maxAssumptions: null,
  maxRisks: null,
  pdfExport: true,
  pdfVariant: "PROFESSIONAL",
  reportSnapshots: true,
  regenerateReports: true,
  ...SAFETY,
  showUpgradePrompt: false,
};

const BY_TIER: Record<EntitlementTier, Entitlements> = { FREE, STANDARD, PROFESSIONAL };

/** Map the highest verified-paid plan to an entitlement tier. */
export function tierFromPaidPlans(paidPlans: PlanType[]): EntitlementTier {
  if (paidPlans.includes("BUSINESS")) return "PROFESSIONAL";
  if (paidPlans.includes("PROFESSIONAL")) return "STANDARD";
  return "FREE";
}

export function entitlementsFor(tier: EntitlementTier): Entitlements {
  return BY_TIER[tier];
}

/** Safety content is never gated — enforced as an invariant, not a convention. */
export function isSafetyContentGated(e: Entitlements): boolean {
  return !(
    e.safetyDisclaimers &&
    e.officialVerificationWarnings &&
    e.professionalReviewWarnings &&
    e.staleSourceWarnings
  );
}
