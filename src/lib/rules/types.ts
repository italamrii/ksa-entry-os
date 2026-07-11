import type { Condition, ConfidenceLevel, FactSet } from "@/lib/rules/conditions";

export interface EngineSource {
  id: string;
  title: string;
  url: string;
  status: string;
  classification: string;
  version: number;
  authority: string | null;
  lastVerified: string | null;
  nextReview: string | null;
  /** Whether the source was stale at evaluation time (included sources: false). */
  stale: boolean;
}

export interface AssumptionTemplate {
  key: string;
  textEn: string;
  textAr: string;
  confidence: ConfidenceLevel;
  impactIfFalseEn: string;
  impactIfFalseAr: string;
}

export interface EnginePathway {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  complexity: "LOW" | "MEDIUM" | "HIGH";
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  version: number;
  requiresProfessionalReview: boolean;
  requiresVerification: boolean;
  nextReview: string | null;
}

/** Pure engine representation of a rule (decoupled from Prisma). */
export interface EngineRule {
  ruleKey: string;
  version: number;
  titleEn: string;
  titleAr: string;
  explanationEn: string;
  explanationAr: string;
  priority: number;
  conditions: Condition;
  uncertainty: ConfidenceLevel;
  requiresProfessionalReview: boolean;
  requiresVerification: boolean;
  assumptions: AssumptionTemplate[];
  limitationsEn: string | null;
  limitationsAr: string | null;
  pathway: EnginePathway | null;
  sources: EngineSource[];
}

export type RiskCategory =
  | "MISSING_INFORMATION"
  | "REGULATORY_SENSITIVITY"
  | "DEPENDENCY_UNRESOLVED"
  | "PROFESSIONAL_REVIEW_NEEDED"
  | "OFFICIAL_VERIFICATION_REQUIRED"
  | "OUTDATED_SOURCE"
  | "CONFLICTING_INPUTS";

export type Severity = "LOW" | "MEDIUM" | "HIGH";

export interface Risk {
  category: RiskCategory;
  severity: Severity;
  rationaleEn: string;
  rationaleAr: string;
  mitigationEn: string;
  mitigationAr: string;
  ruleKey?: string;
}

export interface SurfacedAssumption extends AssumptionTemplate {
  ruleKey: string;
}

export interface PriorityFactor {
  key: string;
  labelEn: string;
  labelAr: string;
  contribution: number;
}

export interface NextAction {
  ruleKey: string;
  titleEn: string;
  titleAr: string;
  requiresVerification: boolean;
  requiresProfessionalReview: boolean;
  officialSourceUrl: string | null;
  order: number;
}

export interface ReasoningTrace {
  triggeredFacts: { key: string; value: unknown; source: string; confidence: string }[];
  matchedRule: { ruleKey: string; version: number };
  pathway: { id: string; slug: string } | null;
  assumptions: SurfacedAssumption[];
  uncertainty: ConfidenceLevel;
  sources: EngineSource[];
  requiresVerification: boolean;
  requiresProfessionalReview: boolean;
  /** Localized presentation text derived from the structured reasoning. */
  localized: { en: string; ar: string };
}

export interface RecommendationOut {
  ruleKey: string;
  ruleVersion: number;
  pathwayId: string | null;
  pathwaySlug: string | null;
  titleEn: string;
  titleAr: string;
  reason: string;
  reasoning: ReasoningTrace;
  assumptions: SurfacedAssumption[];
  riskFactors: Risk[];
  priorityScore: number;
  priorityFactors: PriorityFactor[];
  uncertainty: ConfidenceLevel;
  requiresVerification: boolean;
  requiresProfessionalReview: boolean;
  sources: EngineSource[];
  order: number;
}

export interface ExcludedPathway {
  ruleKey: string;
  pathwaySlug: string | null;
  reasonEn: string;
  reasonAr: string;
  failedFacts: string[];
}

export interface EvaluationOutput {
  engineVersion: string;
  factsVersion: number;
  knowledgeVersion: number;
  rulesetSignature: string;
  governanceSignature: string;
  inputHash: string;
  facts: FactSet;
  recommendations: RecommendationOut[];
  excludedPathways: ExcludedPathway[];
  assumptions: SurfacedAssumption[];
  risks: Risk[];
  sources: EngineSource[];
  nextActions: NextAction[];
  summary: {
    matchedRules: number;
    excludedRules: number;
    candidatePathways: number;
    assumptions: number;
    risks: number;
    professionalReviewRequired: boolean;
    officialVerificationRequired: boolean;
    /** Explicit disclaimer that scores are planning indicators, not decisions. */
    disclaimer: string;
  };
}
