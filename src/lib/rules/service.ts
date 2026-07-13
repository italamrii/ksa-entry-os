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
import { evaluateFreshness } from "@/lib/governance/freshness";
import { isAcceptableForProduction } from "@/lib/governance/classification";
import { alertGovernanceExclusion } from "@/lib/governance/service";
import { getDisclaimer } from "@/lib/governance/disclaimers";
import type { AssumptionTemplate, EngineRule, EngineSource, EvaluationOutput, ExcludedPathway } from "@/lib/rules/types";
import type { Condition } from "@/lib/rules/conditions";

const publishedRuleInclude = {
  pathway: { include: { sources: { include: { source: { include: { authority: true } } } } } },
} satisfies Prisma.RuleInclude;

type RuleWithPathway = Prisma.RuleGetPayload<{ include: typeof publishedRuleInclude }>;

export interface GovernedRulesLoad {
  rules: EngineRule[];
  exclusions: ExcludedPathway[];
  governanceSignature: string;
}

/**
 * Governance-aware rule loading. A rule participates in production evaluation
 * ONLY when it is PUBLISHED + in-date AND its pathway is PUBLISHED + fresh AND
 * it is backed by at least one PUBLISHED, fresh, production-acceptable source.
 * Governance-excluded published rules yield a structured reason + an alert.
 */
export async function loadGovernedEngineRules(now: Date): Promise<GovernedRulesLoad> {
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

  const included: EngineRule[] = [];
  const exclusions: ExcludedPathway[] = [];
  const sigParts: string[] = [];

  for (const rule of rules) {
    const pathway = rule.pathway;
    const reason = governanceReason(pathway, now);
    if (reason) {
      exclusions.push({ ruleKey: rule.ruleKey, pathwaySlug: pathway?.slug ?? null, reasonEn: reason.en, reasonAr: reason.ar, failedFacts: [] });
      await alertGovernanceExclusion(rule.id, rule.ruleKey, reason.en);
      continue;
    }
    included.push(mapRule(rule));
    sigParts.push(`p:${pathway!.id}:${pathway!.version}:${pathway!.status}`);
    for (const ps of pathway!.sources) {
      sigParts.push(`s:${ps.source.id}:${ps.source.version}:${ps.source.status}`);
    }
  }

  return { rules: included, exclusions, governanceSignature: [...new Set(sigParts)].sort().join("|") };
}

function governanceReason(pathway: RuleWithPathway["pathway"], now: Date): { en: string; ar: string } | null {
  if (!pathway) return { en: "No pathway is linked to this rule.", ar: "لا يوجد مسار مرتبط بهذه القاعدة." };
  if (pathway.deletedAt) return { en: "Linked pathway is retired.", ar: "المسار المرتبط متقاعد." };
  if (pathway.status !== "PUBLISHED") return { en: `Linked pathway is not published (${pathway.status}).`, ar: "المسار المرتبط غير منشور." };
  const pathwayFresh = evaluateFreshness({ status: pathway.status, nextReview: pathway.nextReview, lastVerified: pathway.lastReviewed }, now);
  if (pathwayFresh.stale) return { en: "Linked pathway is stale (review overdue).", ar: "المسار المرتبط قديم (المراجعة متأخرة)." };

  const sources = pathway.sources.map((ps) => ps.source);
  const usable = sources.filter(
    (s) =>
      s.status === "PUBLISHED" &&
      isAcceptableForProduction(s.classification as never) &&
      !evaluateFreshness({ status: s.status, nextReview: s.nextReview, availability: s.availability, lastVerified: s.lastVerified, requireVerificationMetadata: true }, now).stale
  );
  if (usable.length === 0) {
    return { en: "No published, fresh, production-acceptable source backs this pathway.", ar: "لا يوجد مصدر منشور وحديث ومقبول يدعم هذا المسار." };
  }
  return null;
}

function mapRule(rule: RuleWithPathway): EngineRule {
  const sources: EngineSource[] = (rule.pathway?.sources ?? [])
    .map((ps) => ps.source)
    .map((s) => ({
      id: s.id,
      title: s.title,
      url: s.url,
      status: s.status,
      classification: s.classification,
      version: s.version,
      authority: s.authority?.nameEn ?? null,
      lastVerified: s.lastVerified ? s.lastVerified.toISOString() : null,
      nextReview: s.nextReview ? s.nextReview.toISOString() : null,
      stale: false,
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

  const governed = await loadGovernedEngineRules(now);
  const decisions = await prisma.assumptionDecision.findMany({
    where: { assessmentId },
    select: { assumptionKey: true },
  });
  const decidedAssumptionKeys = new Set(decisions.map((d) => d.assumptionKey));

  const output = evaluate({
    facts: normalized.facts,
    rules: governed.rules,
    now,
    decidedAssumptionKeys,
    governanceSignature: governed.governanceSignature,
  });
  output.factsVersion = normalized.version;
  // Surface governance-excluded pathways (stale/unpublished/retired dependency).
  output.excludedPathways.push(...governed.exclusions);
  output.summary.excludedRules = output.excludedPathways.length;
  // Centralized, governed disclaimer (never a scattered hardcoded string).
  const disclaimer = await getDisclaimer("EVALUATION");
  output.summary.disclaimer = disclaimer.textEn;

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
      governanceSignature: output.governanceSignature,
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
  // Centralized, bilingual evaluation disclaimer (the persisted one is EN only).
  const evalDisclaimer = await getDisclaimer("EVALUATION");
  const pathwayIds = result.recommendations
    .map((r) => r.pathwayId)
    .filter((id): id is string => Boolean(id));
  const dependencies = await loadDependencies(pathwayIds);
  // Localized pathway titles for display (read-side; avoids English rule-key
  // titles leaking into the Arabic UI). No evaluation logic is affected.
  const pathwayTitles = pathwayIds.length
    ? await prisma.pathway.findMany({ where: { id: { in: pathwayIds } }, select: { id: true, titleEn: true, titleAr: true } })
    : [];
  const titleById = new Map(pathwayTitles.map((p) => [p.id, { en: p.titleEn, ar: p.titleAr }]));

  // Localize authority names on sources (read-side) so the Arabic UI shows the
  // Arabic authority name. Matches the persisted English name to its Arabic one.
  const authorities = await prisma.authority.findMany({ select: { nameEn: true, nameAr: true } });
  const authArByEn = new Map(authorities.map((a) => [a.nameEn, a.nameAr]));
  const withAuthorityAr = (src: Record<string, unknown> | null | undefined) =>
    src && typeof src === "object"
      ? { ...src, authorityAr: typeof src.authority === "string" ? authArByEn.get(src.authority) ?? null : null }
      : src;
  const enrichReasoning = (reasoning: unknown) => {
    if (!reasoning || typeof reasoning !== "object") return reasoning;
    const r = reasoning as Record<string, unknown>;
    if (!Array.isArray(r.sources)) return reasoning;
    return { ...r, sources: (r.sources as Record<string, unknown>[]).map(withAuthorityAr) };
  };

  // Localized titles for excluded pathways (they carry a slug, not an id).
  const excludedRaw = Array.isArray(summary.excludedPathways)
    ? (summary.excludedPathways as Record<string, unknown>[])
    : [];
  const excludedSlugs = excludedRaw
    .map((e) => e.pathwaySlug)
    .filter((s): s is string => typeof s === "string");
  const exPathways = excludedSlugs.length
    ? await prisma.pathway.findMany({ where: { slug: { in: excludedSlugs } }, select: { slug: true, titleEn: true, titleAr: true } })
    : [];
  const titleBySlug = new Map(exPathways.map((p) => [p.slug, { en: p.titleEn, ar: p.titleAr }]));
  const excludedEnriched = excludedRaw.map((e) => {
    const t = typeof e.pathwaySlug === "string" ? titleBySlug.get(e.pathwaySlug) : undefined;
    return { ...e, titleEn: t?.en ?? null, titleAr: t?.ar ?? null };
  });

  return {
    id: result.id,
    createdAt: result.createdAt,
    informationCutoff: result.createdAt,
    engineVersion: result.engineVersion,
    factsVersion: result.factsVersion,
    knowledgeVersion: result.knowledgeVersion,
    rulesetSignature: result.rulesetSignature,
    governanceSignature: result.governanceSignature,
    facts: (result.factsSnapshot as Record<string, unknown>).facts ?? {},
    recommendations: result.recommendations.map((r) => ({
      id: r.id,
      ruleKey: r.ruleKey,
      ruleVersion: r.ruleVersion,
      pathwayId: r.pathwayId,
      titleEn: r.pathwayId ? titleById.get(r.pathwayId)?.en ?? null : null,
      titleAr: r.pathwayId ? titleById.get(r.pathwayId)?.ar ?? null : null,
      order: r.order,
      priorityScore: r.priorityScore,
      priorityFactors: r.priorityFactors,
      uncertainty: r.uncertainty,
      requiresVerification: r.requiresVerification,
      requiresProfessionalReview: r.requiresProfessionalReview,
      reason: r.reason,
      reasoning: enrichReasoning(r.reasoning),
      assumptions: r.assumptions,
      riskFactors: r.riskFactors,
    })),
    dependencies,
    assumptions: result.assumptions,
    risks: result.risks,
    sources: Array.isArray(result.sourcesSnapshot)
      ? (result.sourcesSnapshot as Record<string, unknown>[]).map(withAuthorityAr)
      : result.sourcesSnapshot,
    nextActions: summary.nextActions ?? [],
    excludedPathways: excludedEnriched,
    summary: {
      matchedRules: summary.matchedRules ?? 0,
      excludedRules: summary.excludedRules ?? 0,
      candidatePathways: summary.candidatePathways ?? 0,
      assumptions: summary.assumptions ?? 0,
      risks: summary.risks ?? 0,
      professionalReviewRequired: summary.professionalReviewRequired ?? false,
      officialVerificationRequired: summary.officialVerificationRequired ?? false,
      disclaimer: evalDisclaimer.textEn,
      disclaimerAr: evalDisclaimer.textAr,
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
