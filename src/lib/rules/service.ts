/**
 * Database-facing rules service: loads published rules, resolves an assessment's
 * facts, runs the pure evaluator, and persists an immutable EvaluationResult.
 * Enforces organization ownership; never regenerates when nothing changed.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireOrgAccess } from "@/lib/organizations";
import { normalizeFacts, type RawAnswers, type RawProfile } from "@/lib/rules/facts";
import { evaluate } from "@/lib/rules/evaluate";
import type { AssumptionTemplate, EngineRule, EngineSource, EvaluationOutput } from "@/lib/rules/types";
import type { Condition } from "@/lib/rules/conditions";

const publishedRuleInclude = {
  pathway: { include: { sources: { include: { source: { include: { authority: true } } } } } },
} satisfies Prisma.RuleInclude;

type RuleWithPathway = Prisma.RuleGetPayload<{ include: typeof publishedRuleInclude }>;

/** Load PUBLISHED, in-date, non-deleted rules and map them to engine rules. */
export async function loadPublishedEngineRules(now: Date): Promise<EngineRule[]> {
  const rules = await prisma.rule.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      AND: [
        { OR: [{ effectiveDate: null }, { effectiveDate: { lte: now } }] },
        { OR: [{ expiryDate: null }, { expiryDate: { gt: now } }] },
      ],
    },
    include: publishedRuleInclude,
  });
  return rules.map(mapRule);
}

function mapRule(rule: RuleWithPathway): EngineRule {
  const sources: EngineSource[] = (rule.pathway?.sources ?? [])
    .map((ps) => ps.source)
    .map((s) => ({
      id: s.id,
      title: s.title,
      url: s.url,
      status: s.status,
      authority: s.authority?.nameEn ?? null,
      lastVerified: s.lastVerified ? s.lastVerified.toISOString() : null,
      nextReview: s.nextReview ? s.nextReview.toISOString() : null,
    }));

  return {
    ruleKey: rule.ruleKey,
    version: rule.version,
    titleEn: rule.titleEn,
    titleAr: rule.titleAr,
    explanationEn: rule.explanationEn,
    explanationAr: rule.explanationAr,
    priority: rule.priority,
    conditions: rule.conditions as unknown as Condition,
    uncertainty: rule.uncertainty,
    requiresProfessionalReview: rule.requiresProfessionalReview,
    requiresVerification: rule.requiresVerification,
    assumptions: Array.isArray(rule.assumptions) ? (rule.assumptions as unknown as AssumptionTemplate[]) : [],
    limitationsEn: rule.limitationsEn,
    limitationsAr: rule.limitationsAr,
    sources,
    pathway: rule.pathway
      ? {
          id: rule.pathway.id,
          slug: rule.pathway.slug,
          titleEn: rule.pathway.titleEn,
          titleAr: rule.pathway.titleAr,
          complexity: rule.pathway.complexity,
          riskLevel: rule.pathway.riskLevel,
          version: rule.pathway.version,
          requiresProfessionalReview: rule.pathway.requiresProfessionalReview,
          requiresVerification: rule.pathway.requiresVerification,
          nextReview: rule.pathway.nextReview ? rule.pathway.nextReview.toISOString() : null,
        }
      : null,
  };
}

async function resolveSectorSlug(sectorId: string | null | undefined): Promise<string | null> {
  if (!sectorId) return null;
  const sector = await prisma.sector.findUnique({ where: { id: sectorId }, select: { slug: true } });
  return sector?.slug ?? null;
}

export interface AuthContext {
  id: string;
}

/** Load the assessment (org-scoped) and build its normalized facts. */
export async function buildAssessmentFacts(user: AuthContext, assessmentId: string) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { organization: { include: { profile: true } } },
  });
  if (!assessment) {
    const err = new Error("Not found") as Error & { status: number };
    err.status = 404;
    throw err;
  }
  // Cross-organization protection.
  await requireOrgAccess(user.id, assessment.organizationId);

  const profileRow = assessment.organization.profile;
  const answers: RawAnswers = {
    companyOrigin: assessment.companyOrigin,
    hasForeignEntity: assessment.hasForeignEntity,
    sectorSlug: await resolveSectorSlug(assessment.sectorId),
    businessActivity: assessment.businessActivity,
    hiringEmployees: assessment.hiringEmployees,
    sellingToGov: assessment.sellingToGov,
    needsLocalOffice: assessment.needsLocalOffice,
    invoiceCustomers: assessment.invoiceCustomers,
    sectorLicensing: assessment.sectorLicensing,
    launchTimeline: assessment.launchTimeline,
  };
  const profile: RawProfile = {
    companyType: profileRow?.companyType ?? null,
    sectorSlug: await resolveSectorSlug(profileRow?.sectorId),
    entryGoal: profileRow?.entryGoal ?? null,
    originCountry: profileRow?.originCountry ?? null,
    operatingModel: profileRow?.operatingModel ?? null,
    targetRegion: profileRow?.targetRegion ?? null,
    marketEntryStatus: profileRow?.marketEntryStatus ?? null,
  };

  const normalized = normalizeFacts(profile, answers);
  return { assessment, normalized };
}

/**
 * Evaluate an assessment. Reuses the latest EvaluationResult when the input
 * hash is unchanged (facts + ruleset signature); otherwise persists a new
 * immutable result. Enforces org ownership.
 */
export async function evaluateAssessment(user: AuthContext, assessmentId: string) {
  const now = new Date();
  const { assessment, normalized } = await buildAssessmentFacts(user, assessmentId);

  const rules = await loadPublishedEngineRules(now);
  const decisions = await prisma.assumptionDecision.findMany({
    where: { assessmentId },
    select: { assumptionKey: true },
  });
  const decidedAssumptionKeys = new Set(decisions.map((d) => d.assumptionKey));

  const output = evaluate({ facts: normalized.facts, rules, now, decidedAssumptionKeys });
  output.factsVersion = normalized.version;

  // Reuse the latest result if nothing changed.
  const latest = await prisma.evaluationResult.findFirst({
    where: { assessmentId },
    orderBy: { createdAt: "desc" },
    include: { recommendations: { orderBy: { order: "asc" } } },
  });
  if (latest && latest.inputHash === output.inputHash) {
    return { result: latest, output, reused: true };
  }

  const created = await persistEvaluation(assessment.organizationId, assessmentId, normalized.originalAnswers, output);
  return { result: created, output, reused: false };
}

async function persistEvaluation(
  organizationId: string,
  assessmentId: string,
  originalAnswers: unknown,
  output: EvaluationOutput
) {
  return prisma.evaluationResult.create({
    data: {
      organizationId,
      assessmentId,
      engineVersion: output.engineVersion,
      factsVersion: output.factsVersion,
      knowledgeVersion: output.knowledgeVersion,
      rulesetSignature: output.rulesetSignature,
      inputHash: output.inputHash,
      factsSnapshot: { facts: output.facts, originalAnswers } as unknown as Prisma.InputJsonValue,
      sourcesSnapshot: output.sources as unknown as Prisma.InputJsonValue,
      risks: output.risks as unknown as Prisma.InputJsonValue,
      assumptions: output.assumptions as unknown as Prisma.InputJsonValue,
      summary: {
        ...output.summary,
        nextActions: output.nextActions,
        excludedPathways: output.excludedPathways,
      } as unknown as Prisma.InputJsonValue,
      recommendations: {
        create: output.recommendations.map((r) => ({
          assessmentId,
          pathwayId: r.pathwayId,
          ruleKey: r.ruleKey,
          ruleVersion: r.ruleVersion,
          reason: r.reason,
          reasoning: r.reasoning as unknown as Prisma.InputJsonValue,
          assumptions: r.assumptions as unknown as Prisma.InputJsonValue,
          riskFactors: r.riskFactors as unknown as Prisma.InputJsonValue,
          priorityScore: r.priorityScore,
          priorityFactors: r.priorityFactors as unknown as Prisma.InputJsonValue,
          uncertainty: r.uncertainty,
          requiresVerification: r.requiresVerification,
          requiresProfessionalReview: r.requiresProfessionalReview,
          order: r.order,
        })),
      },
    },
    include: { recommendations: { orderBy: { order: "asc" } } },
  });
}

/** Latest persisted evaluation for an assessment (org-scoped). */
export async function getLatestEvaluation(user: AuthContext, assessmentId: string) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { organizationId: true },
  });
  if (!assessment) {
    const err = new Error("Not found") as Error & { status: number };
    err.status = 404;
    throw err;
  }
  await requireOrgAccess(user.id, assessment.organizationId);
  return prisma.evaluationResult.findFirst({
    where: { assessmentId },
    orderBy: { createdAt: "desc" },
    include: { recommendations: { orderBy: { order: "asc" } } },
  });
}

type EvaluationRow = Prisma.EvaluationResultGetPayload<{
  include: { recommendations: true };
}>;

/** Load dependency edges for the candidate pathways (for the Dependency Map). */
async function loadDependencies(pathwayIds: string[]) {
  if (pathwayIds.length === 0) return [];
  const steps = await prisma.pathwayStep.findMany({
    where: { pathwayId: { in: pathwayIds } },
    include: { dependencies: true },
    orderBy: [{ pathwayId: "asc" }, { order: "asc" }],
  });
  return steps.map((s) => ({
    pathwayId: s.pathwayId,
    stepId: s.id,
    order: s.order,
    titleEn: s.titleEn,
    titleAr: s.titleAr,
    requiresVerification: s.requiresVerification,
    requiresProfessionalReview: s.requiresProfessionalReview,
    dependsOn: s.dependencies.map((d) => d.dependsOnId),
  }));
}

/**
 * Shape an EvaluationResult into a client-safe view: facts, recommendations,
 * dependencies, assumptions, risks, sources, next actions. Contains no
 * unpublished-rule or admin-only review metadata.
 */
export async function buildEvaluationView(result: EvaluationRow) {
  const summary = result.summary as Record<string, unknown>;
  const pathwayIds = result.recommendations
    .map((r) => r.pathwayId)
    .filter((id): id is string => Boolean(id));
  const dependencies = await loadDependencies(pathwayIds);

  return {
    id: result.id,
    createdAt: result.createdAt,
    engineVersion: result.engineVersion,
    factsVersion: result.factsVersion,
    knowledgeVersion: result.knowledgeVersion,
    rulesetSignature: result.rulesetSignature,
    facts: (result.factsSnapshot as Record<string, unknown>).facts ?? {},
    recommendations: result.recommendations.map((r) => ({
      id: r.id,
      ruleKey: r.ruleKey,
      ruleVersion: r.ruleVersion,
      pathwayId: r.pathwayId,
      order: r.order,
      priorityScore: r.priorityScore,
      priorityFactors: r.priorityFactors,
      uncertainty: r.uncertainty,
      requiresVerification: r.requiresVerification,
      requiresProfessionalReview: r.requiresProfessionalReview,
      reason: r.reason,
      reasoning: r.reasoning,
      assumptions: r.assumptions,
      riskFactors: r.riskFactors,
    })),
    dependencies,
    assumptions: result.assumptions,
    risks: result.risks,
    sources: result.sourcesSnapshot,
    nextActions: summary.nextActions ?? [],
    excludedPathways: summary.excludedPathways ?? [],
    summary: {
      matchedRules: summary.matchedRules ?? 0,
      excludedRules: summary.excludedRules ?? 0,
      candidatePathways: summary.candidatePathways ?? 0,
      assumptions: summary.assumptions ?? 0,
      risks: summary.risks ?? 0,
      professionalReviewRequired: summary.professionalReviewRequired ?? false,
      officialVerificationRequired: summary.officialVerificationRequired ?? false,
      disclaimer: summary.disclaimer ?? "",
    },
  };
}

/** Record a user's confirm/reject decision on a surfaced assumption. */
export async function decideAssumption(
  user: AuthContext,
  assessmentId: string,
  assumptionKey: string,
  decision: "CONFIRMED" | "REJECTED"
) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { organizationId: true },
  });
  if (!assessment) {
    const err = new Error("Not found") as Error & { status: number };
    err.status = 404;
    throw err;
  }
  await requireOrgAccess(user.id, assessment.organizationId);
  return prisma.assumptionDecision.upsert({
    where: { assessmentId_assumptionKey: { assessmentId, assumptionKey } },
    update: { decision, decidedByUserId: user.id },
    create: { organizationId: assessment.organizationId, assessmentId, assumptionKey, decision, decidedByUserId: user.id },
  });
}
