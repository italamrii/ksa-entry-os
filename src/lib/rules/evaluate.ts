/**
 * Pure, deterministic evaluation core. No I/O, no clock reads except the `now`
 * passed in, no randomness, no network, no LLM. Same (facts, rules, now) always
 * produces the same EvaluationOutput.
 */
import { createHash } from "crypto";
import {
  evaluateCondition,
  validateCondition,
  type Condition,
  type FactSet,
} from "@/lib/rules/conditions";
import { scoreRecommendation } from "@/lib/rules/prioritize";
import { deriveRisks } from "@/lib/rules/risks";
import type {
  EngineRule,
  EvaluationOutput,
  ExcludedPathway,
  NextAction,
  RecommendationOut,
  SurfacedAssumption,
  EngineSource,
} from "@/lib/rules/types";

export const ENGINE_VERSION = "1.0.0";

const DISCLAIMER =
  "Priority scores are planning indicators only — not official determinations, eligibility, or approval probabilities. Verify all requirements with the official authority.";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

function rulesetSignature(rules: EngineRule[]): string {
  return rules
    .map((r) => `${r.ruleKey}:${r.version}`)
    .sort()
    .join("|");
}

function sortRules(rules: EngineRule[]): EngineRule[] {
  return [...rules].sort((a, b) => b.priority - a.priority || a.ruleKey.localeCompare(b.ruleKey));
}

export interface EvaluateOptions {
  facts: FactSet;
  rules: EngineRule[];
  now: Date;
  /** Assumption keys the user has already confirmed or rejected. */
  decidedAssumptionKeys?: Set<string>;
}

/**
 * Evaluate normalized facts against published rules. Rules are assumed to be
 * pre-filtered to PUBLISHED + in-date by the caller; this function is pure.
 */
export function evaluate(opts: EvaluateOptions): EvaluationOutput {
  const { facts, now } = opts;
  const decided = opts.decidedAssumptionKeys ?? new Set<string>();
  const rules = sortRules(opts.rules);

  const recommendations: RecommendationOut[] = [];
  const excludedPathways: ExcludedPathway[] = [];
  const matchedRules: EngineRule[] = [];

  for (const rule of rules) {
    // Reject malformed conditions rather than silently matching.
    validateCondition(rule.conditions);
    const result = evaluateCondition(rule.conditions as Condition, facts);

    if (!result.matched) {
      excludedPathways.push({
        ruleKey: rule.ruleKey,
        pathwaySlug: rule.pathway?.slug ?? null,
        reasonEn: `Conditions not met${result.failedFacts.length ? ` (${result.failedFacts.join(", ")})` : ""}.`,
        reasonAr: "لم تتحقق الشروط.",
        failedFacts: result.failedFacts,
      });
      continue;
    }

    matchedRules.push(rule);

    const surfaced: SurfacedAssumption[] = rule.assumptions.map((a) => ({ ...a, ruleKey: rule.ruleKey }));
    const unresolved = surfaced.filter((a) => !decided.has(a.key)).length;
    const { score, factors } = scoreRecommendation({ rule, unresolvedAssumptions: unresolved });

    const triggeredFacts = result.usedFacts
      .filter((k) => facts[k] !== undefined)
      .map((k) => ({
        key: k,
        value: facts[k].value,
        source: facts[k].source,
        confidence: facts[k].confidence,
      }));

    const localizedEn = `Because ${triggeredFacts.map((f) => facts[f.key].labelEn ?? f.key).join(", ") || "your context"}, "${rule.titleEn}" applies. ${rule.explanationEn}`;
    const localizedAr = `بناءً على ${triggeredFacts.map((f) => facts[f.key].labelAr ?? f.key).join("، ") || "سياقك"}، ينطبق "${rule.titleAr}". ${rule.explanationAr}`;

    recommendations.push({
      ruleKey: rule.ruleKey,
      ruleVersion: rule.version,
      pathwayId: rule.pathway?.id ?? null,
      pathwaySlug: rule.pathway?.slug ?? null,
      titleEn: rule.pathway?.titleEn ?? rule.titleEn,
      titleAr: rule.pathway?.titleAr ?? rule.titleAr,
      reason: rule.explanationEn,
      reasoning: {
        triggeredFacts,
        matchedRule: { ruleKey: rule.ruleKey, version: rule.version },
        pathway: rule.pathway ? { id: rule.pathway.id, slug: rule.pathway.slug } : null,
        assumptions: surfaced,
        uncertainty: rule.uncertainty,
        sources: rule.sources,
        requiresVerification: rule.requiresVerification,
        requiresProfessionalReview: rule.requiresProfessionalReview,
        localized: { en: localizedEn, ar: localizedAr },
      },
      assumptions: surfaced,
      riskFactors: [],
      priorityScore: score,
      priorityFactors: factors,
      uncertainty: rule.uncertainty,
      requiresVerification: rule.requiresVerification,
      requiresProfessionalReview: rule.requiresProfessionalReview,
      sources: rule.sources,
      order: 0,
    });
  }

  // Deterministic ordering: score desc, then ruleKey asc.
  recommendations.sort((a, b) => b.priorityScore - a.priorityScore || a.ruleKey.localeCompare(b.ruleKey));
  recommendations.forEach((r, i) => (r.order = i));

  const risks = deriveRisks(facts, matchedRules, now);
  // Attach relevant risk factors to their recommendation.
  for (const rec of recommendations) {
    rec.riskFactors = risks.filter((r) => r.ruleKey === rec.ruleKey);
  }

  const assumptions = dedupeAssumptions(recommendations.flatMap((r) => r.assumptions));
  const sources = dedupeSources(recommendations.flatMap((r) => r.sources));

  const nextActions: NextAction[] = recommendations
    .filter((r) => r.pathwayId)
    .map((r, i) => ({
      ruleKey: r.ruleKey,
      titleEn: r.titleEn,
      titleAr: r.titleAr,
      requiresVerification: r.requiresVerification,
      requiresProfessionalReview: r.requiresProfessionalReview,
      officialSourceUrl: r.sources[0]?.url ?? null,
      order: i,
    }));

  const signature = rulesetSignature(opts.rules);
  const knowledgeVersion = opts.rules.reduce((max, r) => Math.max(max, r.pathway?.version ?? 1), 1);
  const inputHash = createHash("sha256")
    .update(stableStringify({ facts, signature }))
    .digest("hex");

  return {
    engineVersion: ENGINE_VERSION,
    factsVersion: 0, // set by caller (normalization version)
    knowledgeVersion,
    rulesetSignature: signature,
    inputHash,
    facts,
    recommendations,
    excludedPathways,
    assumptions,
    risks,
    sources,
    nextActions,
    summary: {
      matchedRules: matchedRules.length,
      excludedRules: excludedPathways.length,
      candidatePathways: recommendations.filter((r) => r.pathwayId).length,
      assumptions: assumptions.length,
      risks: risks.length,
      professionalReviewRequired: recommendations.some((r) => r.requiresProfessionalReview),
      officialVerificationRequired: recommendations.some((r) => r.requiresVerification),
      disclaimer: DISCLAIMER,
    },
  };
}

function dedupeAssumptions(items: SurfacedAssumption[]): SurfacedAssumption[] {
  const seen = new Map<string, SurfacedAssumption>();
  for (const a of items) if (!seen.has(a.key)) seen.set(a.key, a);
  return [...seen.values()].sort((a, b) => a.key.localeCompare(b.key));
}

function dedupeSources(items: EngineSource[]): EngineSource[] {
  const seen = new Map<string, EngineSource>();
  for (const s of items) if (!seen.has(s.id)) seen.set(s.id, s);
  return [...seen.values()].sort((a, b) => a.id.localeCompare(b.id));
}
