/**
 * Transparent, documented prioritization. Produces a bounded [0, 100] planning
 * indicator with the contributing factors exposed. This is explicitly NOT an
 * approval probability or an official determination.
 */
import type { EngineRule, PriorityFactor } from "@/lib/rules/types";

/** Documented, versioned weights. Change deliberately. */
export const PRIORITY_WEIGHTS = {
  base: 50,
  rulePriorityMax: 20, // rule.priority (0..N) contributes up to this, capped
  complexity: { LOW: 15, MEDIUM: 8, HIGH: 0 },
  perUnresolvedAssumption: -3,
  professionalReview: -6,
  officialVerification: -3,
} as const;

const SCORE_MIN = 0;
const SCORE_MAX = 100;

function clamp(n: number): number {
  return Math.max(SCORE_MIN, Math.min(SCORE_MAX, n));
}

export interface PriorityInput {
  rule: EngineRule;
  unresolvedAssumptions: number;
}

/**
 * Score a single recommendation. Deterministic: the same rule + inputs always
 * yields the same score and factor breakdown.
 */
export function scoreRecommendation(input: PriorityInput): {
  score: number;
  factors: PriorityFactor[];
} {
  const { rule, unresolvedAssumptions } = input;
  const factors: PriorityFactor[] = [];

  factors.push({ key: "base", labelEn: "Base", labelAr: "الأساس", contribution: PRIORITY_WEIGHTS.base });

  const rulePriority = Math.max(0, Math.min(PRIORITY_WEIGHTS.rulePriorityMax, rule.priority));
  factors.push({
    key: "rule_priority",
    labelEn: "Rule priority",
    labelAr: "أولوية القاعدة",
    contribution: rulePriority,
  });

  const complexity = rule.pathway?.complexity ?? "MEDIUM";
  factors.push({
    key: "complexity",
    labelEn: `Complexity (${complexity.toLowerCase()})`,
    labelAr: "التعقيد",
    contribution: PRIORITY_WEIGHTS.complexity[complexity],
  });

  if (unresolvedAssumptions > 0) {
    factors.push({
      key: "unresolved_assumptions",
      labelEn: "Unresolved assumptions",
      labelAr: "افتراضات غير محسومة",
      contribution: unresolvedAssumptions * PRIORITY_WEIGHTS.perUnresolvedAssumption,
    });
  }

  if (rule.requiresProfessionalReview) {
    factors.push({
      key: "professional_review",
      labelEn: "Professional review required",
      labelAr: "يلزم مراجعة مهنية",
      contribution: PRIORITY_WEIGHTS.professionalReview,
    });
  }

  if (rule.requiresVerification) {
    factors.push({
      key: "official_verification",
      labelEn: "Official verification required",
      labelAr: "يلزم تحقق رسمي",
      contribution: PRIORITY_WEIGHTS.officialVerification,
    });
  }

  const raw = factors.reduce((sum, f) => sum + f.contribution, 0);
  return { score: clamp(raw), factors };
}
