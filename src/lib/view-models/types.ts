/**
 * View models for the Executive Guided Workspace. These are the ONLY shapes UI
 * components bind to — never Prisma models, and never the raw engine output.
 *
 * Adapters (adapters.ts) map the Stage 4 evaluation + Stage 4.5 governance
 * output into these localized structures. No rule evaluation, risk derivation,
 * scoring, source governance, or lifecycle logic is duplicated here — the UI
 * consumes decisions the backend already made.
 */
export type Locale = "en" | "ar";
export type Confidence = "LOW" | "MEDIUM" | "HIGH";
export type Complexity = "LOW" | "MEDIUM" | "HIGH";
export type Severity = "LOW" | "MEDIUM" | "HIGH";
export type FreshnessState = "FRESH" | "REVIEW_DUE" | "STALE" | "MISSING";

export interface VerificationState {
  requiresVerification: boolean;
  requiresProfessionalReview: boolean;
}

export interface PlanningIndicatorVM {
  /** Bounded 0..100 planning indicator. Never an approval/success probability. */
  score: number;
  label: string;
  factors: { label: string; contribution: number }[];
  disclaimer: string;
}

export interface FactVM {
  key: string;
  label: string;
  value: string;
  source: "provided" | "inferred";
  confidence: Confidence;
}

export interface SourceVM {
  id: string;
  title: string;
  authority: string | null;
  classification: string;
  url: string;
  language: string;
  version: number;
  lastVerified: string | null;
  nextReview: string | null;
  freshness: FreshnessState;
  external: true;
}

export interface AssumptionVM {
  key: string;
  statement: string;
  impactIfFalse: string;
  confidence: Confidence;
  affectedPathwayKey: string | null;
}

export interface RiskVM {
  category: string;
  severity: Severity;
  rationale: string;
  mitigation: string;
  affectedPathwayKey: string | null;
}

export interface DependencyVM {
  pathwayId: string;
  stepId: string;
  order: number;
  title: string;
  dependsOn: string[];
  verification: VerificationState;
}

export interface AuthorityVM {
  name: string;
  sourceCount: number;
  pathwayKeys: string[];
}

export interface NextActionVM {
  ruleKey: string;
  title: string;
  reason: string;
  priority: number;
  officialSourceUrl: string | null;
  verification: VerificationState;
}

export interface PathwayVM {
  id: string | null;
  ruleKey: string;
  title: string;
  included: boolean;
  reason: string;
  planning: PlanningIndicatorVM | null;
  complexity: Complexity | null;
  uncertainty: Confidence;
  verification: VerificationState;
  triggeredFacts: FactVM[];
  assumptions: AssumptionVM[];
  risks: RiskVM[];
  sources: SourceVM[];
  failedFacts: string[];
}

export interface ExecutiveSummaryVM {
  companyName: string | null;
  country: string | null;
  companyType: string | null;
  entryGoal: string | null;
  hasAssessment: boolean;
  leadingPathwayTitle: string | null;
  planning: PlanningIndicatorVM | null;
  complexity: Complexity | null;
  unresolvedAssumptions: number;
  keyRisks: RiskVM[];
  verification: VerificationState;
  sourceFreshness: FreshnessState;
  nextActionTitle: string | null;
  informationCutoff: string | null;
}

export interface ReportSummaryVM {
  scope: string;
  informationCutoff: string | null;
  disclaimer: string;
  pathwayCount: number;
  assumptionCount: number;
  riskCount: number;
  sourceCount: number;
  generationStatus: "AVAILABLE" | "NONE";
}

export interface WorkspaceViewModel {
  locale: Locale;
  dir: "ltr" | "rtl";
  summary: ExecutiveSummaryVM;
  context: { provided: FactVM[]; inferred: FactVM[] };
  includedPathways: PathwayVM[];
  excludedPathways: PathwayVM[];
  dependencies: DependencyVM[];
  authorities: AuthorityVM[];
  assumptions: AssumptionVM[];
  risks: RiskVM[];
  sources: SourceVM[];
  nextActions: NextActionVM[];
  report: ReportSummaryVM;
  disclaimer: string;
}

/** Structural input shape (mirrors buildEvaluationView() from the rules service). */
export interface EvaluationViewInput {
  id: string;
  createdAt: string | Date;
  informationCutoff: string | Date;
  facts: Record<string, { value: unknown; source: "provided" | "inferred"; confidence: Confidence; labelEn?: string; labelAr?: string }>;
  recommendations: {
    id?: string;
    ruleKey: string;
    ruleVersion: number;
    pathwayId: string | null;
    order: number;
    priorityScore: number | null;
    priorityFactors: unknown;
    uncertainty: Confidence;
    requiresVerification: boolean;
    requiresProfessionalReview: boolean;
    reason: string;
    reasoning: unknown;
  }[];
  dependencies: { pathwayId: string; stepId: string; order: number; titleEn: string; titleAr: string; requiresVerification: boolean; requiresProfessionalReview: boolean; dependsOn: string[] }[];
  assumptions: { key: string; textEn: string; textAr: string; confidence: Confidence; impactIfFalseEn: string; impactIfFalseAr: string; ruleKey: string }[];
  risks: { category: string; severity: Severity; rationaleEn: string; rationaleAr: string; mitigationEn: string; mitigationAr: string; ruleKey?: string }[];
  sources: { id: string; title: string; url: string; status: string; classification: string; version: number; authority: string | null; language?: string; lastVerified: string | null; nextReview: string | null; stale: boolean }[];
  nextActions: { ruleKey: string; titleEn: string; titleAr: string; requiresVerification: boolean; requiresProfessionalReview: boolean; officialSourceUrl: string | null; order: number }[];
  excludedPathways: { ruleKey: string; pathwaySlug: string | null; reasonEn: string; reasonAr: string; failedFacts: string[] }[];
  summary: {
    matchedRules: number; excludedRules: number; candidatePathways: number; assumptions: number; risks: number;
    professionalReviewRequired: boolean; officialVerificationRequired: boolean; disclaimer: string;
  };
}

export interface WorkspaceContext {
  companyName: string | null;
  country: string | null;
  companyType: string | null;
  entryGoal: string | null;
  hasAssessment: boolean;
}
